import { z } from "zod";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Timestamp,
} from "firebase/firestore";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { auth, db, isFirebaseConfigured } from "./firebase";
import { ADMIN_EMAILS, EVENT } from "./event-config";
import { priceForSeat, seatParts, type RoomId } from "./seat-layout";
import type { CloudinaryUpload } from "./cloudinary";

export class BackendNotConfigured extends Error {
  constructor() {
    super("The booking backend is not connected yet.");
    this.name = "BackendNotConfigured";
  }
}

function requireBackend() {
  if (!isFirebaseConfigured) throw new BackendNotConfigured();
}

/** A hold lasts this long, and is renewed while the booking tab stays open. */
export const HOLD_TTL_MS = 8 * 60 * 1000;

export const attendeeSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80),
  email: z
    .string()
    .trim()
    .email("Enter a valid email")
    .max(120)
    .refine((email) => email.toLowerCase().endsWith("@vitbhopal.ac.in"), {
      message: "Only VIT Bhopal emails (@vitbhopal.ac.in) are allowed",
    }),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s]{10,15}$/, "Enter a valid phone number"),
  regNo: z
    .string()
    .trim()
    .min(4, "Enter your registration number")
    .max(24)
    .regex(/^[A-Za-z0-9]+$/, "Letters and numbers only"),
  upiRef: z
    .string()
    .trim()
    .min(6, "Enter the UPI transaction / reference ID")
    .max(40)
    .regex(/^[A-Za-z0-9]+$/, "Letters and numbers only"),
});

export type Attendee = z.infer<typeof attendeeSchema>;

export type SeatHold = { seat: string; holdId: string; expiresAt: number };

export type Availability = {
  taken: string[];
  held: SeatHold[];
  /** seats permanently reserved through the AB02-127 waiting list */
  waitlisted: string[];
  /** how many people are on the AB02-127 waiting list right now */
  waitlistTotal: number;
  /** whether the organiser has opened AB02-127 for normal booking */
  r2Open: boolean;
  holdTtlMs: number;
  updatedAt: string;
};

export type BookingRecord = {
  code: string;
  createdAt: string;
  name: string;
  email: string;
  phone: string;
  regNo: string;
  seats: string[];
  amount: number;
  upiRef: string;
  /** Cloudinary URL of the payment screenshot (admin-only read via Firestore rules) */
  screenshotUrl: string;
  status: "pending" | "verified" | "rejected";
};

/* ---------------- collections ---------------- */

const SEATS = "seats";
const BOOKINGS = "bookings";
const REGS = "registrations";
const SHOTS = "screenshots";
const WAITLIST = "waitlist";
const CONFIG = "config";

type SeatDoc = {
  status: "held" | "booked" | "waitlisted";
  holdId?: string;
  expiresAt?: number;
  code?: string;
  /** code of the waitlist entry that reserved this seat */
  waitlistCode?: string;
};

function toIso(v: unknown): string {
  if (!v) return "";
  if (typeof v === "string") return v;
  const ts = v as Timestamp;
  return typeof ts?.toDate === "function" ? ts.toDate().toISOString() : String(v);
}

/* ---------------- availability ---------------- */

export async function getAvailability(): Promise<Availability> {
  requireBackend();
  const snap = await getDocs(collection(db(), SEATS));
  const taken: string[] = [];
  const held: SeatHold[] = [];
  const waitlisted: string[] = [];
  const now = Date.now();
  snap.forEach((d) => {
    const data = d.data() as SeatDoc;
    if (data.status === "booked") taken.push(d.id);
    else if (data.status === "waitlisted") waitlisted.push(d.id);
    else if (data.status === "held" && (data.expiresAt ?? 0) > now) {
      held.push({ seat: d.id, holdId: data.holdId ?? "", expiresAt: data.expiresAt ?? 0 });
    }
  });
  let r2Open = false;
  try {
    const cfg = await getDoc(doc(db(), CONFIG, "rooms"));
    if (cfg.exists()) r2Open = Boolean((cfg.data() as Record<string, unknown>)["R2"]);
  } catch {
    r2Open = false;
  }
  return {
    taken,
    held,
    waitlisted,
    waitlistTotal: waitlisted.length,
    r2Open,
    holdTtlMs: HOLD_TTL_MS,
    updatedAt: new Date().toISOString(),
  };
}

/* ---------------- holds ---------------- */

/** Claim (or renew) a temporary hold on seats for this browser session. */
export async function holdSeats(holdId: string, seats: string[]) {
  requireBackend();
  if (seats.length > EVENT.maxSeatsPerBooking) {
    throw new Error(`Maximum ${EVENT.maxSeatsPerBooking} seats per booking`);
  }
  const mine = await getDocs(query(collection(db(), SEATS), where("holdId", "==", holdId)));
  const stale = mine.docs.filter((d) => !seats.includes(d.id));
  const expiresAt = Date.now() + HOLD_TTL_MS;

  await runTransaction(db(), async (tx) => {
    const now = Date.now();
    const current = await Promise.all(seats.map((s) => tx.get(doc(db(), SEATS, s))));
    const staleSnaps = await Promise.all(stale.map((d) => tx.get(d.ref)));

    const clash: string[] = [];
    current.forEach((snap, i) => {
      if (!snap.exists()) return;
      const data = snap.data() as SeatDoc;
      if (data.status === "booked" || data.status === "waitlisted") clash.push(seats[i] as string);
      else if (data.holdId !== holdId && (data.expiresAt ?? 0) > now) {
        clash.push(seats[i] as string);
      }
    });
    if (clash.length) throw new Error(`Seats no longer available: ${clash.join(", ")}`);

    for (const s of seats) {
      tx.set(doc(db(), SEATS, s), { status: "held", holdId, expiresAt });
    }
    staleSnaps.forEach((d) => {
      if (!d.exists()) return;
      const data = d.data() as SeatDoc;
      if (data.status === "held" && data.holdId === holdId) {
        tx.delete(d.ref);
      }
    });
  });

  return { seats, expiresAt, holdTtlMs: HOLD_TTL_MS };
}

/** Give the seats back immediately (deselect, tab close, expiry). */
export async function releaseSeats(holdId: string, seats?: string[]) {
  requireBackend();
  const mine = await getDocs(query(collection(db(), SEATS), where("holdId", "==", holdId)));
  let released = 0;
  await Promise.all(
    mine.docs.map(async (d) => {
      const data = d.data() as SeatDoc;
      if (data.status !== "held") return;
      if (seats && seats.length && !seats.includes(d.id)) return;
      await deleteDoc(d.ref);
      released++;
    }),
  );
  return { released };
}

const HOLD_KEY = "f1-hold-id";

/** Stable per-tab session id used to own seat holds. */
export function getHoldId(): string {
  if (typeof window === "undefined") return "";
  let id = window.sessionStorage.getItem(HOLD_KEY);
  if (!id) {
    id = `hold-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
    window.sessionStorage.setItem(HOLD_KEY, id);
  }
  return id;
}

/* ---------------- booking ---------------- */

function newCode() {
  const alphabet = "ACDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "F1-";
  for (let i = 0; i < 6; i++) {
    out += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return out;
}

export async function createBooking(input: {
  seats: string[];
  attendee: Attendee;
  /** Result of uploading the compressed screenshot to Cloudinary. */
  screenshot: CloudinaryUpload;
  holdId: string;
}) {
  requireBackend();
  const { seats, attendee, screenshot, holdId } = input;
  if (!seats.length) throw new Error("No seats selected");
  if (seats.length > EVENT.maxSeatsPerBooking) {
    throw new Error(`Maximum ${EVENT.maxSeatsPerBooking} seats per booking`);
  }
  const parsed = attendeeSchema.parse(attendee);
  // Price is derived from the seat map, never from anything typed in the form.
  const amount = seats.reduce((sum, s) => sum + priceForSeat(s), 0);
  const code = newCode();
  const regKey = parsed.regNo.toUpperCase();

  await runTransaction(db(), async (tx) => {
    const now = Date.now();

    // One registration number = one booking. This doc is the uniqueness lock.
    const regRef = doc(db(), REGS, regKey);
    const regSnap = await tx.get(regRef);
    if (regSnap.exists()) {
      throw new Error(`Registration number ${regKey} has already booked seats.`);
    }

    const seatSnaps = await Promise.all(seats.map((s) => tx.get(doc(db(), SEATS, s))));
    const clash: string[] = [];
    seatSnaps.forEach((snap, i) => {
      if (!snap.exists()) return;
      const data = snap.data() as SeatDoc;
      if (data.status === "booked" || data.status === "waitlisted") clash.push(seats[i] as string);
      else if (data.holdId !== holdId && (data.expiresAt ?? 0) > now) {
        clash.push(seats[i] as string);
      }
    });
    if (clash.length) throw new Error(`These seats were just taken: ${clash.join(", ")}`);

    for (const s of seats) {
      tx.set(doc(db(), SEATS, s), { status: "booked", code });
    }
    tx.set(regRef, { code, createdAt: serverTimestamp() });
    // Link the Cloudinary image to this booking code. Firestore keeps the access
    // control: only organisers can read this doc, but the image URL itself is
    // unlisted (random public id) on Cloudinary.
    tx.set(doc(db(), SHOTS, code), {
      screenshotUrl: screenshot.secureUrl,
      cloudinaryPublicId: screenshot.publicId,
      createdAt: serverTimestamp(),
    });
    tx.set(doc(db(), BOOKINGS, code), {
      code,
      createdAt: serverTimestamp(),
      name: parsed.name,
      email: parsed.email,
      phone: parsed.phone,
      regNo: regKey,
      seats,
      amount,
      upiRef: parsed.upiRef,
      screenshotUrl: screenshot.secureUrl,
      status: "pending",
    });
  });

  return { code, amount };
}

export async function getBooking(code: string): Promise<BookingRecord> {
  requireBackend();
  const snap = await getDoc(doc(db(), BOOKINGS, code));
  if (!snap.exists()) throw new Error("Booking not found");
  const d = snap.data() as Omit<BookingRecord, "createdAt" | "screenshotUrl"> & {
    createdAt?: unknown;
  };
  return { ...d, createdAt: toIso(d.createdAt), screenshotUrl: "" } as BookingRecord;
}

/** Search bookings and waitlist entries by code, email, or registration number. */
export async function searchTickets(inputQuery: string): Promise<{
  bookings: BookingRecord[];
  waitlists: WaitlistRecord[];
}> {
  requireBackend();
  const q = inputQuery.trim();
  if (!q) return { bookings: [], waitlists: [] };

  const qUpper = q.toUpperCase();
  const qLower = q.toLowerCase();

  const bookingsMap = new Map<string, BookingRecord>();
  const waitlistsMap = new Map<string, WaitlistRecord>();

  // 1. Direct code lookup for Bookings
  if (qUpper.startsWith("F1-") || qUpper.length >= 6) {
    try {
      const snap = await getDoc(doc(db(), BOOKINGS, qUpper));
      if (snap.exists()) {
        const d = snap.data() as Record<string, unknown>;
        bookingsMap.set(snap.id, {
          code: String(d["code"] ?? snap.id),
          createdAt: toIso(d["createdAt"]),
          name: String(d["name"] ?? ""),
          email: String(d["email"] ?? ""),
          phone: String(d["phone"] ?? ""),
          regNo: String(d["regNo"] ?? ""),
          seats: (d["seats"] as string[]) ?? [],
          amount: Number(d["amount"] ?? 0),
          upiRef: String(d["upiRef"] ?? ""),
          screenshotUrl: String(d["screenshotUrl"] ?? ""),
          status: String(d["status"] ?? "pending") as BookingRecord["status"],
        });
      }
    } catch {}
  }

  // 2. Direct code lookup for Waitlist
  if (qUpper.startsWith("WL-") || qUpper.length >= 6) {
    try {
      const snap = await getDoc(doc(db(), WAITLIST, qUpper));
      if (snap.exists()) {
        const d = snap.data() as Record<string, unknown>;
        waitlistsMap.set(snap.id, {
          code: String(d["code"] ?? snap.id),
          seat: String(d["seat"] ?? ""),
          name: String(d["name"] ?? ""),
          email: String(d["email"] ?? ""),
          phone: String(d["phone"] ?? ""),
          regNo: String(d["regNo"] ?? ""),
          createdAt: toIso(d["createdAt"]),
        });
      }
    } catch {}
  }

  // 3. Query bookings by email
  try {
    const emailSnaps = await getDocs(
      query(collection(db(), BOOKINGS), where("email", "==", qLower)),
    );
    emailSnaps.forEach((d) => {
      const data = d.data() as Record<string, unknown>;
      bookingsMap.set(d.id, {
        code: String(data["code"] ?? d.id),
        createdAt: toIso(data["createdAt"]),
        name: String(data["name"] ?? ""),
        email: String(data["email"] ?? ""),
        phone: String(data["phone"] ?? ""),
        regNo: String(data["regNo"] ?? ""),
        seats: (data["seats"] as string[]) ?? [],
        amount: Number(data["amount"] ?? 0),
        upiRef: String(data["upiRef"] ?? ""),
        screenshotUrl: String(data["screenshotUrl"] ?? ""),
        status: String(data["status"] ?? "pending") as BookingRecord["status"],
      });
    });
  } catch {}

  // 4. Query bookings by registration number
  try {
    const regSnaps = await getDocs(
      query(collection(db(), BOOKINGS), where("regNo", "==", qUpper)),
    );
    regSnaps.forEach((d) => {
      const data = d.data() as Record<string, unknown>;
      bookingsMap.set(d.id, {
        code: String(data["code"] ?? d.id),
        createdAt: toIso(data["createdAt"]),
        name: String(data["name"] ?? ""),
        email: String(data["email"] ?? ""),
        phone: String(data["phone"] ?? ""),
        regNo: String(data["regNo"] ?? ""),
        seats: (data["seats"] as string[]) ?? [],
        amount: Number(data["amount"] ?? 0),
        upiRef: String(data["upiRef"] ?? ""),
        screenshotUrl: String(data["screenshotUrl"] ?? ""),
        status: String(data["status"] ?? "pending") as BookingRecord["status"],
      });
    });
  } catch {}

  // 5. Query waitlist by email
  try {
    const emailWlSnaps = await getDocs(
      query(collection(db(), WAITLIST), where("email", "==", qLower)),
    );
    emailWlSnaps.forEach((d) => {
      const data = d.data() as Record<string, unknown>;
      waitlistsMap.set(d.id, {
        code: String(data["code"] ?? d.id),
        seat: String(data["seat"] ?? ""),
        name: String(data["name"] ?? ""),
        email: String(data["email"] ?? ""),
        phone: String(data["phone"] ?? ""),
        regNo: String(data["regNo"] ?? ""),
        createdAt: toIso(data["createdAt"]),
      });
    });
  } catch {}

  // 6. Query waitlist by registration number
  try {
    const regWlSnaps = await getDocs(
      query(collection(db(), WAITLIST), where("regNo", "==", qUpper)),
    );
    regWlSnaps.forEach((d) => {
      const data = d.data() as Record<string, unknown>;
      waitlistsMap.set(d.id, {
        code: String(data["code"] ?? d.id),
        seat: String(data["seat"] ?? ""),
        name: String(data["name"] ?? ""),
        email: String(data["email"] ?? ""),
        phone: String(data["phone"] ?? ""),
        regNo: String(data["regNo"] ?? ""),
        createdAt: toIso(data["createdAt"]),
      });
    });
  } catch {}

  return {
    bookings: Array.from(bookingsMap.values()),
    waitlists: Array.from(waitlistsMap.values()),
  };
}

/* ---------------- AB02-127 waiting list ---------------- */

/**
 * AB02-127 is locked until 100 people join the waiting list. Joining the list
 * reserves the seat you pick — no payment. When the list fills up the
 * organiser opens the room and allocates bookings for those seats first.
 */
export const waitlistSchema = attendeeSchema.pick({
  name: true,
  email: true,
  phone: true,
  regNo: true,
});

export type WaitlistAttendee = z.infer<typeof waitlistSchema>;

export type WaitlistRecord = {
  code: string;
  seat: string;
  name: string;
  email: string;
  phone: string;
  regNo: string;
  createdAt: string;
};

function newWaitlistCode() {
  const alphabet = "ACDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "WL-";
  for (let i = 0; i < 6; i++) {
    out += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return out;
}

/** Join the waiting list and reserve one seat in AB02-127 (no payment). */
export async function joinWaitlist(input: {
  seat: string;
  attendee: WaitlistAttendee;
}): Promise<{ code: string; seat: string }> {
  requireBackend();
  const { seat, attendee } = input;
  const parts = seatParts(seat);
  if (!parts) throw new Error("That seat does not exist.");
  if (parts.room !== "R2") throw new Error("The waiting list is only for AB02-127.");
  const parsed = waitlistSchema.parse(attendee);
  const regKey = parsed.regNo.toUpperCase();

  // Count what is already reserved so we don't overshoot the capacity.
  const existing = await getDocs(
    query(collection(db(), SEATS), where("status", "==", "waitlisted")),
  );
  if (existing.size >= EVENT.waitlistCapacity) {
    throw new Error(
      `The waiting list is full (${EVENT.waitlistCapacity}). Bookings for AB02-127 open soon.`,
    );
  }

  const code = newWaitlistCode();
  const now = Date.now();

  await runTransaction(db(), async (tx) => {
    // One registration number = one booking or waitlist entry.
    const regRef = doc(db(), REGS, regKey);
    const regSnap = await tx.get(regRef);
    if (regSnap.exists()) {
      throw new Error(`Registration number ${regKey} is already on a booking or the waitlist.`);
    }

    const seatSnap = await tx.get(doc(db(), SEATS, seat));
    if (seatSnap.exists()) {
      const data = seatSnap.data() as SeatDoc;
      if (data.status === "booked" || data.status === "waitlisted") {
        throw new Error("That seat is already taken.");
      }
      if (data.status === "held" && (data.expiresAt ?? 0) > now) {
        throw new Error("That seat is on hold for someone else right now.");
      }
    }

    // The seat now shows as reserved (waitlisted) on everyone's map.
    tx.set(doc(db(), SEATS, seat), { status: "waitlisted", waitlistCode: code });
    tx.set(doc(db(), WAITLIST, code), {
      code,
      seat,
      name: parsed.name,
      email: parsed.email,
      phone: parsed.phone,
      regNo: regKey,
      createdAt: serverTimestamp(),
    });
    tx.set(regRef, { code, kind: "waitlist", createdAt: serverTimestamp() });
  });

  return { code, seat };
}

/** Look up a waitlist entry by its code (e.g. to show "you're on the list"). */
export async function getWaitlist(code: string): Promise<WaitlistRecord> {
  requireBackend();
  const snap = await getDoc(doc(db(), WAITLIST, code));
  if (!snap.exists()) throw new Error("Waitlist entry not found");
  const d = snap.data() as Record<string, unknown>;
  return {
    code: String(d["code"] ?? code),
    seat: String(d["seat"] ?? ""),
    name: String(d["name"] ?? ""),
    email: String(d["email"] ?? ""),
    phone: String(d["phone"] ?? ""),
    regNo: String(d["regNo"] ?? ""),
    createdAt: toIso(d["createdAt"]),
  };
}

export async function getRoomState(): Promise<Record<RoomId, boolean>> {
  requireBackend();
  const snap = await getDoc(doc(db(), CONFIG, "rooms"));
  return {
    R1: true,
    R2: snap.exists() ? Boolean((snap.data() as Record<string, unknown>)["R2"]) : false,
  };
}

/** Organiser-only: list everyone on the AB02-127 waiting list. */
export async function adminWaitlistList(): Promise<{ entries: WaitlistRecord[] }> {
  requireBackend();
  const snap = await getDocs(collection(db(), WAITLIST));
  const entries = snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return {
      code: String(data["code"] ?? d.id),
      seat: String(data["seat"] ?? ""),
      name: String(data["name"] ?? ""),
      email: String(data["email"] ?? ""),
      phone: String(data["phone"] ?? ""),
      regNo: String(data["regNo"] ?? ""),
      createdAt: toIso(data["createdAt"]),
    };
  });
  entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { entries };
}

/** Organiser-only: open or close AB02-127 for normal booking. */
export async function adminSetRoomOpen(room: RoomId, open: boolean) {
  requireBackend();
  const ref = doc(db(), CONFIG, "rooms");
  const snap = await getDoc(ref);
  const current = snap.exists() ? (snap.data() as Record<string, unknown>) : {};
  await setDoc(ref, { ...current, [room]: open });
  return { room, open };
}

/**
 * Organiser-only: turn a waitlist entry into a real booking. The seat was
 * already reserved for this person, so it just moves from "waitlisted" to
 * "booked" behind their booking code. Payment is settled separately (the
 * existing verify flow).
 */
export async function adminAllocateWaitlist(code: string, allocatorEmail: string) {
  requireBackend();
  const wlRef = doc(db(), WAITLIST, code);
  const wlSnap = await getDoc(wlRef);
  if (!wlSnap.exists()) throw new Error("Waitlist entry not found");
  const wl = wlSnap.data() as Record<string, unknown>;
  const seat = String(wl["seat"] ?? "");
  if (!seat) throw new Error("Waitlist entry has no seat reserved.");
  const regKey = String(wl["regNo"] ?? "");
  const bookingCode = newCode();
  const amount = priceForSeat(seat);

  await runTransaction(db(), async (tx) => {
    const seatSnap = await tx.get(doc(db(), SEATS, seat));
    if (seatSnap.exists()) {
      const data = seatSnap.data() as SeatDoc;
      if (data.status === "booked") throw new Error("That seat is already booked.");
      if (data.status !== "waitlisted") {
        throw new Error("That seat is no longer reserved for the waitlist.");
      }
    }
    tx.set(doc(db(), SEATS, seat), { status: "booked", code: bookingCode });
    tx.set(doc(db(), BOOKINGS, bookingCode), {
      code: bookingCode,
      createdAt: serverTimestamp(),
      name: String(wl["name"] ?? ""),
      email: String(wl["email"] ?? ""),
      phone: String(wl["phone"] ?? ""),
      regNo: regKey,
      seats: [seat],
      amount,
      upiRef: "WAITLIST",
      screenshotUrl: "",
      status: "pending",
      allocatedBy: allocatorEmail,
      allocatedFromWaitlist: code,
    });
    if (regKey) tx.update(doc(db(), REGS, regKey), { code: bookingCode, kind: "booking" });
    tx.delete(wlRef);
  });

  return { code: bookingCode, seat, amount };
}

/** Organiser-only: remove a waitlist entry and free its seat. */
export async function adminRemoveWaitlist(code: string) {
  requireBackend();
  const wlRef = doc(db(), WAITLIST, code);
  const wlSnap = await getDoc(wlRef);
  if (!wlSnap.exists()) throw new Error("Waitlist entry not found");
  const wl = wlSnap.data() as Record<string, unknown>;
  const seat = String(wl["seat"] ?? "");
  const regKey = String(wl["regNo"] ?? "");

  await runTransaction(db(), async (tx) => {
    tx.delete(wlRef);
    if (regKey) tx.delete(doc(db(), REGS, regKey));
    if (seat) tx.delete(doc(db(), SEATS, seat));
  });
  return { code };
}

/* ---------------- organiser (Google sign-in) ---------------- */

export function isAdminEmail(email: string | null | undefined) {
  return Boolean(email && ADMIN_EMAILS.includes(email.toLowerCase()));
}

export async function adminSignIn() {
  requireBackend();
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth(), provider);
  if (!isAdminEmail(cred.user.email)) {
    await signOut(auth());
    throw new Error("This Google account is not an organiser account.");
  }
  return cred.user;
}

export async function adminSignOut() {
  requireBackend();
  await signOut(auth());
}

export function watchAdmin(cb: (user: User | null) => void) {
  if (!isFirebaseConfigured) return () => {};
  return onAuthStateChanged(auth(), (user) => cb(isAdminEmail(user?.email) ? user : null));
}

export async function adminList(): Promise<{ bookings: BookingRecord[] }> {
  requireBackend();
  const snap = await getDocs(collection(db(), BOOKINGS));
  const bookings = snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return {
      code: String(data["code"] ?? d.id),
      createdAt: toIso(data["createdAt"]),
      name: String(data["name"] ?? ""),
      email: String(data["email"] ?? ""),
      phone: String(data["phone"] ?? ""),
      regNo: String(data["regNo"] ?? ""),
      seats: (data["seats"] as string[]) ?? [],
      amount: Number(data["amount"] ?? 0),
      upiRef: String(data["upiRef"] ?? ""),
      screenshotUrl: String(data["screenshotUrl"] ?? ""),
      status: String(data["status"] ?? "pending") as BookingRecord["status"],
    };
  });
  bookings.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { bookings };
}

/** Organiser-only: fetch the Cloudinary URL (or legacy data URL) for one booking. */
export async function adminScreenshot(code: string): Promise<string> {
  requireBackend();
  const snap = await getDoc(doc(db(), SHOTS, code));
  if (!snap.exists()) throw new Error("No screenshot stored for this booking");
  const data = snap.data() as { screenshotUrl?: string; dataUrl?: string };
  return data.screenshotUrl ?? data.dataUrl ?? "";
}

export async function adminSetStatus(code: string, status: BookingRecord["status"]) {
  requireBackend();
  const bookingRef = doc(db(), BOOKINGS, code);
  const snap = await getDoc(bookingRef);
  if (!snap.exists()) throw new Error("Booking not found");
  const seats = ((snap.data() as { seats?: string[] }).seats ?? []) as string[];

  await updateDoc(bookingRef, { status });
  // Rejecting a booking puts its seats back on sale.
  if (status === "rejected") {
    await Promise.all(seats.map((s) => deleteDoc(doc(db(), SEATS, s))));
  }
  return { code, status };
}

/**
 * Organiser-only: fully remove a booking so the person can register again.
 * Deletes the booking, its screenshot link and the registration-number lock,
 * and frees its seats — all in one transaction. The Cloudinary image itself is
 * left in place (deleting it needs the Admin API secret); remove it from the
 * Cloudinary dashboard if needed.
 */
export async function adminDeleteBooking(code: string) {
  requireBackend();
  const bookingRef = doc(db(), BOOKINGS, code);
  const snap = await getDoc(bookingRef);
  if (!snap.exists()) throw new Error("Booking not found");
  const data = snap.data() as { regNo?: string; seats?: string[] };
  const regNo = data.regNo ?? "";
  const seats = data.seats ?? [];

  await runTransaction(db(), async (tx) => {
    tx.delete(bookingRef);
    tx.delete(doc(db(), SHOTS, code));
    if (regNo) tx.delete(doc(db(), REGS, regNo));
    for (const s of seats) tx.delete(doc(db(), SEATS, s));
  });

  return { code };
}

/* ---------------- screenshot helper ---------------- */

/**
 * The screenshot is resized and re-encoded as a JPEG blob before it is sent
 * to Cloudinary, so uploads stay small and fast.
 */
export function compressImage(file: File, maxSide = 1200, quality = 0.7): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That file is not a readable image"));
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Could not process that image"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Could not compress that image"));
            resolve(blob);
          },
          "image/jpeg",
          quality,
        );
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
