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
import { priceForSeat } from "./seat-layout";
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
    .refine(
      (email) => email.toLowerCase().endsWith("@vitbhopal.ac.in"),
      { message: "Only VIT Bhopal emails (@vitbhopal.ac.in) are allowed" }
    ),
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

type SeatDoc = {
  status: "held" | "booked";
  holdId?: string;
  expiresAt?: number;
  code?: string;
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
  const now = Date.now();
  snap.forEach((d) => {
    const data = d.data() as SeatDoc;
    if (data.status === "booked") taken.push(d.id);
    else if (data.status === "held" && (data.expiresAt ?? 0) > now) {
      held.push({ seat: d.id, holdId: data.holdId ?? "", expiresAt: data.expiresAt ?? 0 });
    }
  });
  return { taken, held, holdTtlMs: HOLD_TTL_MS, updatedAt: new Date().toISOString() };
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
      if (data.status === "booked") clash.push(seats[i] as string);
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
      if (data.status === "booked") clash.push(seats[i] as string);
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
      code: String(data['code'] ?? d.id),
      createdAt: toIso(data['createdAt']),
      name: String(data['name'] ?? ""),
      email: String(data['email'] ?? ""),
      phone: String(data['phone'] ?? ""),
      regNo: String(data['regNo'] ?? ""),
      seats: (data['seats'] as string[]) ?? [],
      amount: Number(data['amount'] ?? 0),
      upiRef: String(data['upiRef'] ?? ""),
      screenshotUrl: String(data['screenshotUrl'] ?? ""),
      status: (String(data['status'] ?? "pending") as BookingRecord["status"]),
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
