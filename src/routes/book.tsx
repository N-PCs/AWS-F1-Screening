import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Lock, TicketCheck } from "lucide-react";
import { AuthGate } from "@/components/f1/AuthGate";
import { SeatLegend, SeatMap } from "@/components/f1/SeatMap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { isCloudinaryConfigured, uploadImage } from "@/lib/cloudinary";
import { EVENT, UPI } from "@/lib/event-config";
import { isFirebaseConfigured } from "@/lib/firebase";
import {
  ROOMS,
  ROOM_SEAT_COUNT,
  TIERS,
  TOTAL_SEATS,
  roomForId,
  roomForSeat,
  tierForSeat,
  totalPrice,
  type RoomId,
} from "@/lib/seat-layout";
import { cn } from "@/lib/utils";
import {
  attendeeSchema,
  compressImage,
  createBooking,
  getAvailability,
  getHoldId,
  getWaitlist,
  holdSeats,
  joinWaitlist,
  releaseSeats,
  waitlistSchema,
  type Attendee,
  type WaitlistRecord,
} from "@/lib/booking-api";

export const Route = createFileRoute("/book")({
  validateSearch: (search: Record<string, unknown>) => ({
    wl: search.wl ? String(search.wl) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Book Your Seat — F1 Grand Prix Screening | AWS Club VITB" },
      {
        name: "description",
        content:
          "Pick your seat for the AWS Club VITB Formula 1 Grand Prix screening across AB02-127 & AB02-128. Front rows ₹199, mid ₹149, rear ₹99. Pay by UPI.",
      },
      { property: "og:title", content: "Book Your Seat — F1 Grand Prix Screening" },
      {
        property: "og:description",
        content: "Live seat map for the AWS Club VITB F1 screening in AB-02. Pay by UPI.",
      },
    ],
  }),
  component: BookPage,
});

const MAX_FILE_BYTES = 4 * 1024 * 1024;
const HOLD_RENEW_MS = 90_000;
const WL_KEY = "f1-waitlist-code";

function BookPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [holdExpiresAt, setHoldExpiresAt] = useState<number | null>(null);
  const [holdBusy, setHoldBusy] = useState(false);
  const holdIdRef = useRef<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);
  const [activeRoom, setActiveRoom] = useState<RoomId>("R1");
  const [form, setForm] = useState<Attendee>({
    name: "",
    email: "",
    phone: "",
    regNo: "",
    upiRef: "",
  });

  const [wlOpen, setWlOpen] = useState(false);
  const [wlStep, setWlStep] = useState<"info" | "join" | "done">("info");
  const [wlBusy, setWlBusy] = useState(false);
  const [wlForm, setWlForm] = useState({
    name: "",
    email: "",
    phone: "",
    regNo: "",
  });
  const [wlErrors, setWlErrors] = useState<Record<string, string>>({});
  const [wlPicked, setWlPicked] = useState<string | null>(null);
  const [wlResult, setWlResult] = useState<{ code: string; seat: string } | null>(null);
  const [myWl, setMyWl] = useState<WaitlistRecord | null>(null);

  const availability = useQuery({
    queryKey: ["availability"],
    queryFn: getAvailability,
    refetchInterval: 15000,
    retry: false,
    enabled: isFirebaseConfigured,
  });

  useEffect(() => {
    holdIdRef.current = getHoldId();
  }, []);

  useEffect(() => {
    if (user?.email) {
      setForm((prev) => ({ ...prev, email: user.email! }));
      setWlForm((prev) => ({ ...prev, email: user.email! }));
    }
  }, [user?.email]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("wl=1")) {
      void openWaitlist();
    }
  }, []);

  // Stable ref for selected seats to avoid stale closure issues during fast toggles.
  const selectedRef = useRef<string[]>([]);
  selectedRef.current = selected;

  // Auth gate — must come AFTER all hooks so the hook order is stable across renders.
  if (!authLoading && !user) {
    return <AuthGate />;
  }
  if (authLoading) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-sm text-muted-foreground">Checking sign-in…</p>
      </div>
    );
  }

  // Serialize taken array to maintain stable Set reference unless taken seats actually change.
  const takenKey = (availability.data?.taken ?? []).slice().sort().join(",");
  const taken = useMemo(() => {
    return new Set(availability.data?.taken ?? []);
  }, [takenKey]);

  // Serialize heldByOthers array to maintain stable Set reference.
  const heldKey = (availability.data?.held ?? [])
    .filter((h) => h.holdId !== holdIdRef.current && h.expiresAt > Date.now())
    .map((h) => h.seat)
    .sort()
    .join(",");
  const heldByOthers = useMemo(() => {
    const mine = holdIdRef.current;
    const now = Date.now();
    return new Set(
      (availability.data?.held ?? [])
        .filter((h) => h.holdId !== mine && h.expiresAt > now)
        .map((h) => h.seat),
    );
  }, [heldKey]);

  // Seats reserved via the AB02-128 waiting list.
  const waitlistedKey = (availability.data?.waitlisted ?? []).slice().sort().join(",");
  const waitlistedSet = useMemo(
    () => new Set(availability.data?.waitlisted ?? []),
    [waitlistedKey],
  );
  const r2Open = Boolean(availability.data?.r2Open);
  const waitlistTotal = availability.data?.waitlistTotal ?? 0;
  const waitlistFull = waitlistTotal >= EVENT.waitlistCapacity;

  // Never show AB02-128 while it is locked for booking.
  const displayRoom: RoomId = !r2Open && activeRoom === "R2" ? "R1" : activeRoom;

  // Drop any selection that someone else just booked/held.
  useEffect(() => {
    if (!availability.data) return;
    setSelected((prev) => {
      const kept = prev.filter(
        (id) => !taken.has(id) && !heldByOthers.has(id) && !waitlistedSet.has(id),
      );
      if (kept.length === prev.length) {
        return prev; // Skip state mutation if nothing changed
      }
      toast.error("Some of your seats were just taken by someone else.", {
        id: "seats-taken-toast",
      });
      return kept;
    });
  }, [taken, heldByOthers, waitlistedSet, availability.data]);

  const amount = totalPrice(selected);

  /** Push the current selection to the backend as a temporary hold. */
  const syncHold = useCallback(async (next: string[]) => {
    const holdId = holdIdRef.current;
    if (!holdId || !isFirebaseConfigured) return true;
    setHoldBusy(true);
    try {
      if (next.length === 0) {
        await releaseSeats(holdId);
        setHoldExpiresAt(null);
        return true;
      }
      const res = await holdSeats(holdId, next);
      setHoldExpiresAt(res.expiresAt);
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not hold those seats", {
        id: "hold-error-toast",
      });
      return false;
    } finally {
      setHoldBusy(false);
    }
  }, []);

  // Queue to sequence rapid toggle operations cleanly without race conditions.
  const pendingSyncRef = useRef<Promise<boolean> | null>(null);

  const toggle = useCallback(
    async (id: string) => {
      const current = selectedRef.current;
      const isSelected = current.includes(id);
      let next: string[];
      if (isSelected) {
        next = current.filter((s) => s !== id);
      } else {
        if (current.length >= EVENT.maxSeatsPerBooking) {
          toast.error(`Maximum ${EVENT.maxSeatsPerBooking} seats per booking.`, {
            id: "max-seats-toast",
          });
          return;
        }
        next = [...current, id].sort();
      }
      const previous = current;
      setSelected(next);
      selectedRef.current = next;

      // Chain hold sync requests sequentially
      const doSync = async () => {
        if (pendingSyncRef.current) {
          await pendingSyncRef.current.catch(() => { });
        }
        return syncHold(selectedRef.current);
      };

      const syncPromise = doSync();
      pendingSyncRef.current = syncPromise;
      const held = await syncPromise;

      if (!held) {
        setSelected(previous);
        selectedRef.current = previous;
        void availability.refetch();
      }
    },
    [syncHold, availability],
  );

  // Keep our hold alive while the tab is open, and hand the seats back on close.
  useEffect(() => {
    if (!selected.length || !isFirebaseConfigured) return;
    const timer = window.setInterval(() => {
      void syncHold(selectedRef.current);
    }, HOLD_RENEW_MS);
    return () => window.clearInterval(timer);
  }, [selected.length, syncHold]);

  useEffect(() => {
    function handleUnload() {
      const holdId = holdIdRef.current;
      if (!holdId || !isFirebaseConfigured || !selectedRef.current.length) return;
      void releaseSeats(holdId).catch(() => { });
    }
    window.addEventListener("pagehide", handleUnload);
    return () => window.removeEventListener("pagehide", handleUnload);
  }, []);

  // Local countdown; when it hits zero the hold is gone server-side too.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!holdExpiresAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [holdExpiresAt]);

  const secondsLeft = holdExpiresAt ? Math.max(0, Math.floor((holdExpiresAt - now) / 1000)) : 0;

  useEffect(() => {
    if (holdExpiresAt && secondsLeft === 0 && !submitting) {
      setSelected([]);
      selectedRef.current = [];
      setHoldExpiresAt(null);
      toast.error("Your seat hold expired. Please pick your seats again.", {
        id: "hold-expired-toast",
      });
      void availability.refetch();
    }
  }, [secondsLeft, holdExpiresAt, submitting, availability]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    if (!selected.length) {
      toast.error("Pick at least one seat first.", { id: "submit-no-seats" });
      return;
    }
    const parsed = attendeeSchema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        next[String(issue.path[0])] = issue.message;
      }
      setErrors(next);
      toast.error("Please fix the highlighted fields.", { id: "submit-validation" });
      return;
    }
    if (!file) {
      setErrors({ screenshot: "Upload your UPI payment screenshot" });
      toast.error("Payment screenshot is required.", { id: "submit-no-screenshot" });
      return;
    }
    if (!file.type.startsWith("image/")) {
      setErrors({ screenshot: "That file is not an image" });
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setErrors({ screenshot: "Image must be under 4 MB" });
      return;
    }
    if (!isCloudinaryConfigured) {
      toast.error("Screenshot uploads are not configured yet.", {
        id: "submit-no-cloudinary",
      });
      return;
    }

    setSubmitting(true);
    try {
      const screenshotBlob = await compressImage(file);
      const screenshot = await uploadImage(screenshotBlob);
      const result = await createBooking({
        seats: selected,
        attendee: parsed.data,
        screenshot,
        holdId: holdIdRef.current,
      });
      setHoldExpiresAt(null);
      toast.success("Seats confirmed. See you at the race!");
      await navigate({ to: "/booking/$code", params: { code: result.code } });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Booking failed";
      toast.error(message, { id: "submit-error" });
      void availability.refetch();
    } finally {
      setSubmitting(false);
    }
  }

  const activeRoomInfo = roomForId(displayRoom);
  const holdClock = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`;

  /** Open the AB02-128 popup and check whether this browser is already on the list. */
  async function openWaitlist() {
    setWlOpen(true);
    setWlStep("info");
    setWlPicked(null);
    setWlResult(null);
    setWlErrors({});
    setMyWl(null);
    if (!isFirebaseConfigured || typeof window === "undefined") return;
    const code = window.sessionStorage.getItem(WL_KEY);
    if (!code) return;
    try {
      setMyWl(await getWaitlist(code));
    } catch {
      window.sessionStorage.removeItem(WL_KEY);
    }
  }

  /** Reserve a seat on the waiting list — no payment asked. */
  async function submitWaitlist() {
    setWlErrors({});
    const parsed = waitlistSchema.safeParse(wlForm);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        next[String(issue.path[0])] = issue.message;
      }
      setWlErrors(next);
      toast.error("Please fill in your details first.", { id: "wl-validation" });
      return;
    }
    if (!wlPicked) {
      toast.error("Pick a seat on the map first.", { id: "wl-no-seat" });
      return;
    }
    setWlBusy(true);
    try {
      const res = await joinWaitlist({ seat: wlPicked, attendee: parsed.data });
      window.sessionStorage.setItem(WL_KEY, res.code);
      setWlResult(res);
      setWlStep("done");
      void availability.refetch();
      toast.success("You're on the waiting list — your seat is reserved.", {
        id: "wl-joined",
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not join the waiting list", {
        id: "wl-join-error",
      });
      void availability.refetch();
    } finally {
      setWlBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-10 pb-24 lg:pb-10">
      <header className="border-b border-border pb-4 sm:pb-6">
        <p className="text-xs font-bold tracking-[0.3em] text-primary uppercase">Grid Selection</p>
        <h1 className="mt-2 text-2xl font-bold uppercase sm:text-4xl">Book your seat</h1>
        <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-muted-foreground">
          {EVENT.venue} · {EVENT.dateLabel} · {EVENT.timeLabel} · {TOTAL_SEATS} seats total ·{" "}
          {ROOMS.map((r) => r.name).join(" & ")}
        </p>
      </header>

      {!isFirebaseConfigured && (
        <p className="mt-4 sm:mt-6 rounded-md border border-accent/50 bg-accent/10 p-3 sm:p-4 text-xs sm:text-sm">
          <strong className="font-bold">Setup pending:</strong> the organiser still has to add the
          Firebase keys (<code>VITE_FIREBASE_*</code>) — see <code>firebase/README.md</code>. Seat
          availability and bookings stay offline until then.
        </p>
      )}
      {isFirebaseConfigured && !isCloudinaryConfigured && (
        <p className="mt-4 sm:mt-6 rounded-md border border-accent/50 bg-accent/10 p-3 sm:p-4 text-xs sm:text-sm">
          <strong className="font-bold">Setup pending:</strong> the organiser still has to add the
          Cloudinary keys (<code>VITE_CLOUDINARY_*</code>) — see <code>firebase/README.md</code>.
          Bookings stay disabled until then.
        </p>
      )}
      {availability.isError && (
        <p className="mt-4 sm:mt-6 rounded-md border border-destructive/50 bg-destructive/10 p-3 sm:p-4 text-xs sm:text-sm">
          Could not load seat availability. Refresh the page, or contact the organisers if it keeps
          failing.
        </p>
      )}

      {/* Room switcher — each room gets its own accent colour */}
      <div className="mt-4 sm:mt-6 grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2">
        {ROOMS.map((room) => {
          const isActive = activeRoom === room.id;
          const locked = room.id === "R2" && !r2Open;
          const takenInRoom = [...taken].filter((id) => id.startsWith(room.id + "-")).length;
          const heldInRoom = [...heldByOthers].filter((id) => id.startsWith(room.id + "-")).length;
          const waitlistedInRoom = [...waitlistedSet].filter((id) =>
            id.startsWith(room.id + "-"),
          ).length;
          const openInRoom = ROOM_SEAT_COUNT - takenInRoom - heldInRoom - waitlistedInRoom;
          return (
            <button
              key={room.id}
              type="button"
              onClick={() =>
                locked ? void openWaitlist() : setActiveRoom(room.id)
              }
              aria-pressed={isActive}
              className={cn(
                "rounded-md border-2 bg-card p-3 sm:p-4 text-left transition",
                isActive ? roomActive[room.tone] : "border-border hover:border-foreground/40",
                locked && !isActive && "border-waitlist/40 bg-waitlist/5",
              )}
            >
              <span
                className={cn(
                  "flex items-center gap-1.5 sm:gap-2 text-[0.6rem] sm:text-[0.65rem] font-bold tracking-[0.25em] uppercase",
                  isActive ? roomText[room.tone] : "text-muted-foreground",
                )}
              >
                <span className={cn("h-2 w-2 rounded-full", roomDot[room.tone])} aria-hidden />
                {room.label}
                {locked && <Lock className="h-3 w-3 text-waitlist" aria-hidden />}
              </span>
              <span className="mt-1 flex items-baseline justify-between gap-1 sm:gap-2">
                <span className="text-base sm:text-xl font-bold">{room.name}</span>
                {locked ? (
                  <span className="text-[0.6rem] sm:text-xs font-semibold text-waitlist">
                    Waitlist {waitlistTotal}/{EVENT.waitlistCapacity}
                  </span>
                ) : (
                  <span className="text-[0.6rem] sm:text-xs text-muted-foreground">
                    {openInRoom} open
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 sm:mt-6 grid gap-6 sm:gap-8 lg:grid-cols-[1fr_22rem]">
        {/* Seat map section */}
        <section
          id="seat-map-section"
          className={cn(
            "rounded-md border border-border bg-card p-3 sm:p-6 order-2 lg:order-1",
            roomTop[activeRoomInfo.tone],
          )}
        >
          <SeatMap
            room={displayRoom}
            taken={taken}
            held={heldByOthers}
            waitlisted={waitlistedSet}
            selected={selected}
            onToggle={(id) => void toggle(id)}
            disabled={submitting}
          />
          <div className="mt-4 sm:mt-6 border-t border-border pt-3 sm:pt-4">
            <SeatLegend />
          </div>
        </section>

        {/* Selection + form aside */}
        <aside className="space-y-4 sm:space-y-6 order-1 lg:order-2">
          {/* Quick mobile CTA to jump to seat map */}
          <a
            href="#seat-map-section"
            className="flex items-center justify-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-bold text-primary uppercase tracking-wider lg:hidden"
          >
            ↓ Pick seats on the map below
          </a>

          <div className="rounded-md border border-border bg-card p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold uppercase">Your selection</h2>
              {selected.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSelected([]);
                    selectedRef.current = [];
                    void syncHold([]);
                  }}
                  className="text-xs text-muted-foreground underline hover:text-foreground"
                >
                  Clear all ({selected.length})
                </button>
              )}
            </div>
            {holdExpiresAt && secondsLeft > 0 && (
              <p className="mt-2 rounded-sm border border-primary/50 bg-primary/10 px-3 py-2 text-xs font-semibold">
                Seats held for you · <span className="tabular-nums">{holdClock}</span> left to
                finish payment
              </p>
            )}
            {selected.length === 0 ? (
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                No seats picked yet. Front rows are the premium spots.
              </p>
            ) : (
              <ul className="mt-3 space-y-1.5 text-xs sm:text-sm">
                {selected.map((id) => (
                  <li key={id} className="flex items-center justify-between gap-2">
                    <span className="font-semibold min-w-0">
                      <span className="sm:hidden">Seat {id}</span>
                      <span className="hidden sm:inline">Seat {id}</span>{" "}
                      <span className="font-normal text-muted-foreground hidden sm:inline">
                        · {roomForSeat(id)?.name} · {tierForSeat(id)?.name}
                      </span>
                      <span className="font-normal text-muted-foreground sm:hidden text-[0.65rem]">
                        {tierForSeat(id)?.name}
                      </span>
                    </span>
                    <span className="shrink-0">₹{tierForSeat(id)?.price}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3 sm:mt-4 flex items-center justify-between border-t border-border pt-3 text-sm sm:text-base font-bold">
              <span>Total</span>
              <span className="text-primary">₹{amount}</span>
            </div>
            <p className="mt-2 sm:mt-3 text-[0.65rem] sm:text-xs text-muted-foreground">
              {Object.values(TIERS)
                .map((t) => `${t.name} ₹${t.price}`)
                .join(" · ")}
            </p>
          </div>

          <form
            id="booking-form"
            onSubmit={submit}
            className="space-y-4 sm:space-y-5 rounded-md border border-border bg-card p-4 sm:p-5"
          >
            <div>
              <h2 className="text-base sm:text-lg font-bold uppercase">Your details</h2>
              <div className="mt-3 sm:mt-4 space-y-3">
                <Field
                  id="name"
                  label="Full name"
                  value={form.name}
                  error={errors["name"]}
                  onChange={(v) => setForm({ ...form, name: v })}
                />
                <Field
                  id="email"
                  label="Email"
                  type="email"
                  value={form.email}
                  error={errors["email"]}
                  onChange={(v) => setForm({ ...form, email: v })}
                  readOnly={Boolean(user?.email)}
                />
                <Field
                  id="phone"
                  label="Phone"
                  value={form.phone}
                  error={errors["phone"]}
                  onChange={(v) => setForm({ ...form, phone: v })}
                />
                <Field
                  id="regNo"
                  label="Registration number"
                  value={form.regNo}
                  error={errors["regNo"]}
                  onChange={(v) => setForm({ ...form, regNo: v })}
                />
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <h2 className="text-base sm:text-lg font-bold uppercase">Pay ₹{amount} by UPI</h2>
              <div className="mt-3 flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:gap-4">
                <QrPanel />
                <div className="text-xs sm:text-sm text-center sm:text-left">
                  <p className="font-semibold">{UPI.payeeName}</p>
                  <p className="font-mono text-[0.65rem] sm:text-xs break-all text-muted-foreground">
                    {UPI.id}
                  </p>
                  <p className="mt-1.5 sm:mt-2 text-[0.65rem] sm:text-xs text-muted-foreground">
                    Scan, pay the exact amount, then upload the screenshot below.
                  </p>
                </div>
              </div>

              <div className="mt-3 sm:mt-4 space-y-3">
                <Field
                  id="upiRef"
                  label="UPI transaction / reference ID"
                  value={form.upiRef}
                  error={errors["upiRef"]}
                  onChange={(v) => setForm({ ...form, upiRef: v })}
                />
                <div>
                  <Label htmlFor="screenshot">Payment screenshot</Label>
                  <Input
                    id="screenshot"
                    type="file"
                    accept="image/*"
                    className="mt-1.5"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                  {errors["screenshot"] && (
                    <p className="mt-1 text-xs text-destructive">{errors["screenshot"]}</p>
                  )}
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting || !selected.length}
              className="w-full font-bold tracking-wide uppercase"
            >
              {submitting
                ? "Confirming…"
                : `Confirm ${selected.length || ""} seat${selected.length === 1 ? "" : "s"}`}
            </Button>
            <p className="text-[0.65rem] sm:text-xs text-muted-foreground">
              Picking a seat locks it for you for a few minutes — nobody else can book it while your
              timer runs. Leave the page or let the timer run out and it goes back on sale.
            </p>
          </form>
        </aside>
      </div>

      {/* ── Sticky mobile bottom bar ── */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur-md px-4 py-3 lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">
              {selected.length === 0
                ? "No seats selected"
                : `${selected.length} seat${selected.length > 1 ? "s" : ""} selected`}
            </p>
            <p className="text-base font-bold text-primary">₹{amount}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <a
              href="#seat-map-section"
              className="rounded-md border border-border bg-secondary px-3 py-2 text-xs font-bold uppercase tracking-wider text-foreground"
            >
              Map
            </a>
            {selected.length > 0 ? (
              <a
                href="#booking-form"
                className="rounded-md bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground"
              >
                Checkout →
              </a>
            ) : (
              <a
                href="#seat-map-section"
                className="rounded-md bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground"
              >
                Pick seats
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── AB02-128 waiting list popup ── */}
      <Dialog open={wlOpen} onOpenChange={(open) => !open && setWlOpen(false)}>
        <DialogContent className="max-w-7.5xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-waitlist" aria-hidden />
              AB02-128 is on the waiting list
            </DialogTitle>
            <DialogDescription>
              {myWl
                ? "You're already on the list."
                : "AB02-128 opens once the waiting list fills up — your seat gets locked in before anyone else can book."}
            </DialogDescription>
          </DialogHeader>

          {wlStep === "info" && (
            <div className="space-y-4">
              <div className="rounded-md border border-waitlist/40 bg-waitlist/10 p-4 text-sm">
                <p className="font-bold text-waitlist uppercase tracking-wider">
                  Waitlist {waitlistTotal} / {EVENT.waitlistCapacity}
                </p>
                <p className="mt-2 text-muted-foreground">
                  AB02-127 already holds 250 registrations, so AB02-128 is reserved for overflow.
                  Once <strong className="text-foreground">{EVENT.waitlistCapacity} people</strong>{" "}
                  join, the organisers open AB02-128 and{" "}
                  <strong className="text-foreground">
                    waitlisted members get their booked seats first
                  </strong>
                  .
                </p>
              </div>

              {myWl ? (
                <div className="rounded-md border border-waitlist/50 bg-card p-4">
                  <p className="font-bold uppercase tracking-wider">
                    You're on the list — seat {myWl.seat} reserved
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your waitlist code is{" "}
                    <span className="font-mono font-semibold text-foreground">{myWl.code}</span>. No
                    payment is needed yet. When the organisers open AB02-128, your seat is yours
                    first — just follow their payment instructions then.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    onClick={() => setWlStep("join")}
                    disabled={waitlistFull || wlBusy}
                    className="font-bold tracking-wide uppercase"
                  >
                    Join the waiting list
                  </Button>
                  {waitlistFull && (
                    <p className="self-center text-xs text-waitlist">
                      The list is full — AB02-128 bookings open soon.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {wlStep === "join" && (
            <div className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-[17rem_1fr]">
                <div className="space-y-3">
                  <Field
                    id="wl-name"
                    label="Full name"
                    value={wlForm.name}
                    error={wlErrors["name"]}
                    onChange={(v) => setWlForm((f) => ({ ...f, name: v }))}
                  />
                  <Field
                    id="wl-email"
                    label="Email"
                    type="email"
                    value={wlForm.email}
                    error={wlErrors["email"]}
                    onChange={(v) => setWlForm((f) => ({ ...f, email: v }))}
                    readOnly={Boolean(user?.email)}
                  />
                  <Field
                    id="wl-phone"
                    label="Phone"
                    value={wlForm.phone}
                    error={wlErrors["phone"]}
                    onChange={(v) => setWlForm((f) => ({ ...f, phone: v }))}
                  />
                  <Field
                    id="wl-regNo"
                    label="Registration number"
                    value={wlForm.regNo}
                    error={wlErrors["regNo"]}
                    onChange={(v) => setWlForm((f) => ({ ...f, regNo: v }))}
                  />
                  {wlPicked && (
                    <p className="rounded-sm border border-waitlist/50 bg-waitlist/10 px-3 py-2 text-xs font-semibold">
                      Reserved: {wlPicked} · {tierForSeat(wlPicked)?.name} · ₹
                      {tierForSeat(wlPicked)?.price} (pay only when AB02-128 opens)
                    </p>
                  )}
                </div>

                <div>
                  <p className="mb-2 text-xs font-bold tracking-widest text-muted-foreground uppercase">
                    Pick one seat to lock in for yourself
                  </p>
                  <div className="overflow-x-auto rounded-md border border-border">
                    <SeatMap
                      room="R2"
                      taken={taken}
                      held={heldByOthers}
                      waitlisted={waitlistedSet}
                      selected={wlPicked ? [wlPicked] : []}
                      onToggle={(id) => setWlPicked((prev) => (prev === id ? null : id))}
                      disabled={wlBusy}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  No payment now — your seat is marked reserved for you. One entry per registration
                  number.
                </p>
                <Button
                  onClick={() => void submitWaitlist()}
                  disabled={wlBusy || waitlistFull || !wlPicked}
                  className="shrink-0 font-bold tracking-wide uppercase"
                >
                  {wlBusy ? "Reserving…" : "Reserve my seat — no payment"}
                </Button>
              </div>
            </div>
          )}

          {wlStep === "done" && wlResult && (
            <div className="space-y-4">
              <div className="rounded-md border border-waitlist/50 bg-waitlist/10 p-4">
                <p className="flex items-center gap-2 font-bold uppercase tracking-wider">
                  <TicketCheck className="h-4 w-4" aria-hidden />
                  You're on the waiting list
                </p>
                <dl className="mt-3 space-y-1.5 text-sm">
                  <RowStub label="Waitlist code" value={wlResult.code} mono />
                  <RowStub
                    label="Seat reserved"
                    value={`${wlResult.seat} (${tierForSeat(wlResult.seat)?.name})`}
                  />
                  <RowStub
                    label="What happens next"
                    value="When the list reaches the organisers' target, AB02-128 opens and you pay for this exact seat — it can't be taken by anyone else."
                  />
                </dl>
              </div>
              <Button
                onClick={() => setWlOpen(false)}
                className="w-full font-bold tracking-wide uppercase"
              >
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const roomTop: Record<string, string> = {
  "room-1": "border-t-[3px] border-t-room-1",
  "room-2": "border-t-[3px] border-t-room-2",
};

const roomActive: Record<string, string> = {
  "room-1": "border-room-1 bg-room-1/10",
  "room-2": "border-room-2 bg-room-2/10",
};

const roomText: Record<string, string> = {
  "room-1": "text-room-1",
  "room-2": "text-room-2",
};

const roomDot: Record<string, string> = {
  "room-1": "bg-room-1",
  "room-2": "bg-room-2",
};

function QrPanel() {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return (
      <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-sm border border-dashed border-border p-2 text-center text-[0.65rem] text-muted-foreground">
        QR coming soon — pay to the UPI ID
      </div>
    );
  }
  return (
    <img
      src={UPI.qrImage}
      alt={`UPI QR code for ${UPI.payeeName}`}
      className="h-28 w-28 shrink-0 rounded-sm border border-border bg-background object-contain p-1"
      loading="lazy"
      onError={() => setBroken(true)}
    />
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  readOnly,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string | undefined;
  type?: string;
  readOnly?: boolean;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-1.5${readOnly ? " cursor-not-allowed opacity-70" : ""}`}
        readOnly={readOnly}
        tabIndex={readOnly ? -1 : undefined}
      />
      {readOnly && (
        <p className="mt-1 text-[0.65rem] text-muted-foreground">Auto-filled from your sign-in</p>
      )}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function RowStub({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className="shrink-0 text-[0.65rem] font-bold tracking-widest text-muted-foreground uppercase sm:w-40 sm:pt-0.5">
        {label}
      </dt>
      <dd className={cn("text-sm", mono && "font-mono font-semibold")}>{value}</dd>
    </div>
  );
}
