import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { SeatLegend, SeatMap } from "@/components/f1/SeatMap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EVENT, UPI } from "@/lib/event-config";
import { isFirebaseConfigured } from "@/lib/firebase";
import { TIERS, TOTAL_SEATS, tierForSeat, totalPrice } from "@/lib/seat-layout";
import {
  attendeeSchema,
  compressImage,
  createBooking,
  getAvailability,
  getHoldId,
  holdSeats,
  releaseSeats,
  type Attendee,
} from "@/lib/booking-api";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "Book Your Seat — F1 Grand Prix Screening | AWS Club VITB" },
      {
        name: "description",
        content:
          "Pick your seat for the AWS Club VITB Formula 1 Grand Prix screening in AB-02. Front rows ₹199, mid ₹149, rear ₹99. Pay by UPI.",
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

function BookPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [holdExpiresAt, setHoldExpiresAt] = useState<number | null>(null);
  const [holdBusy, setHoldBusy] = useState(false);
  const holdIdRef = useRef<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState<Attendee>({
    name: "",
    email: "",
    phone: "",
    regNo: "",
    upiRef: "",
  });

  const availability = useQuery({
    queryKey: ["availability"],
    queryFn: getAvailability,
    refetchInterval: 15000,
    retry: false,
    enabled: isFirebaseConfigured,
  });

  const taken = useMemo(
    () => new Set(availability.data?.taken ?? []),
    [availability.data],
  );

  useEffect(() => {
    holdIdRef.current = getHoldId();
  }, []);

  /** Seats another visitor is holding right now (our own holds excluded). */
  const heldByOthers = useMemo(() => {
    const mine = holdIdRef.current;
    const now = Date.now();
    return new Set(
      (availability.data?.held ?? [])
        .filter((h) => h.holdId !== mine && h.expiresAt > now)
        .map((h) => h.seat),
    );
  }, [availability.data]);

  // Drop any selection that someone else just booked.
  useEffect(() => {
    setSelected((prev) => {
      const kept = prev.filter((id) => !taken.has(id) && !heldByOthers.has(id));
      if (kept.length !== prev.length) {
        toast.error("Some of your seats were just taken by someone else.");
      }
      return kept;
    });
  }, [taken, heldByOthers]);

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
      toast.error(err instanceof Error ? err.message : "Could not hold those seats");
      return false;
    } finally {
      setHoldBusy(false);
    }
  }, []);

  const toggle = useCallback(
    async (id: string) => {
      const isSelected = selected.includes(id);
      let next: string[];
      if (isSelected) {
        next = selected.filter((s) => s !== id);
      } else {
        if (selected.length >= EVENT.maxSeatsPerBooking) {
          toast.error(`Maximum ${EVENT.maxSeatsPerBooking} seats per booking.`);
          return;
        }
        next = [...selected, id].sort();
      }
      const previous = selected;
      setSelected(next);
      const held = await syncHold(next);
      if (!held) {
        setSelected(previous);
        void availability.refetch();
      }
    },
    [selected, syncHold, availability],
  );

  // Keep our hold alive while the tab is open, and hand the seats back on close.
  useEffect(() => {
    if (!selected.length || !isFirebaseConfigured) return;
    const timer = window.setInterval(() => {
      void syncHold(selected);
    }, HOLD_RENEW_MS);
    return () => window.clearInterval(timer);
  }, [selected, syncHold]);

  useEffect(() => {
    function handleUnload() {
      const holdId = holdIdRef.current;
      if (!holdId || !isFirebaseConfigured || !selected.length) return;
      // best-effort release so the seats free up as soon as the tab closes
      void releaseSeats(holdId).catch(() => {});
    }
    window.addEventListener("pagehide", handleUnload);
    return () => window.removeEventListener("pagehide", handleUnload);
  }, [selected]);

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
      setHoldExpiresAt(null);
      toast.error("Your seat hold expired. Please pick your seats again.");
      void availability.refetch();
    }
  }, [secondsLeft, holdExpiresAt, submitting, availability]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    if (!selected.length) {
      toast.error("Pick at least one seat first.");
      return;
    }
    const parsed = attendeeSchema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        next[String(issue.path[0])] = issue.message;
      }
      setErrors(next);
      toast.error("Please fix the highlighted fields.");
      return;
    }
    if (!file) {
      setErrors({ screenshot: "Upload your UPI payment screenshot" });
      toast.error("Payment screenshot is required.");
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

    setSubmitting(true);
    try {
      const screenshotDataUrl = await compressImage(file);
      const result = await createBooking({
        seats: selected,
        attendee: parsed.data,
        screenshotDataUrl,
        holdId: holdIdRef.current,
      });
      setHoldExpiresAt(null);
      toast.success("Seats confirmed. See you at the race!");
      await navigate({ to: "/booking/$code", params: { code: result.code } });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Booking failed";
      toast.error(message);
      void availability.refetch();
    } finally {
      setSubmitting(false);
    }
  }

  const bookedCount = taken.size;
  const holdClock = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="border-b border-border pb-6">
        <p className="text-xs font-bold tracking-[0.3em] text-primary uppercase">
          Grid Selection
        </p>
        <h1 className="mt-2 text-3xl font-bold uppercase sm:text-4xl">Book your seat</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {EVENT.venue} · {EVENT.dateLabel} · {EVENT.timeLabel} · {TOTAL_SEATS} seats total
          {availability.data ? ` · ${TOTAL_SEATS - bookedCount} still open` : ""}
        </p>
      </header>

      {!isFirebaseConfigured && (
        <p className="mt-6 rounded-md border border-accent/50 bg-accent/10 p-4 text-sm">
          <strong className="font-bold">Setup pending:</strong> the organiser still has to add
          the Firebase keys (<code>VITE_FIREBASE_*</code>) — see{" "}
          <code>firebase/README.md</code>. Seat availability and bookings stay offline until then.
        </p>
      )}
      {availability.isError && (
        <p className="mt-6 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm">
          Could not load seat availability. Refresh the page, or contact the organisers if it
          keeps failing.
        </p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <section className="rounded-md border border-border bg-card p-4 sm:p-6">
          <SeatMap
            taken={taken}
            held={heldByOthers}
            selected={selected}
            onToggle={(id) => void toggle(id)}
            disabled={submitting || holdBusy}
          />
          <div className="mt-6 border-t border-border pt-4">
            <SeatLegend />
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-md border border-border bg-card p-5">
            <h2 className="text-lg font-bold uppercase">Your selection</h2>
            {holdExpiresAt && secondsLeft > 0 && (
              <p className="mt-2 rounded-sm border border-primary/50 bg-primary/10 px-3 py-2 text-xs font-semibold">
                Seats held for you · <span className="tabular-nums">{holdClock}</span> left to
                finish payment
              </p>
            )}
            {selected.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                No seats picked yet. Front rows are the premium spots.
              </p>
            ) : (
              <ul className="mt-3 space-y-1.5 text-sm">
                {selected.map((id) => (
                  <li key={id} className="flex items-center justify-between">
                    <span className="font-semibold">
                      Seat {id}{" "}
                      <span className="font-normal text-muted-foreground">
                        · {tierForSeat(id)?.name}
                      </span>
                    </span>
                    <span>₹{tierForSeat(id)?.price}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-base font-bold">
              <span>Total</span>
              <span className="text-primary">₹{amount}</span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {Object.values(TIERS)
                .map((t) => `${t.name} ₹${t.price}`)
                .join(" · ")}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-5 rounded-md border border-border bg-card p-5">
            <div>
              <h2 className="text-lg font-bold uppercase">Your details</h2>
              <div className="mt-4 space-y-3">
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
              <h2 className="text-lg font-bold uppercase">Pay ₹{amount} by UPI</h2>
              <div className="mt-3 flex items-center gap-4">
                <QrPanel />
                <div className="text-sm">
                  <p className="font-semibold">{UPI.payeeName}</p>
                  <p className="font-mono text-xs break-all text-muted-foreground">{UPI.id}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Scan, pay the exact amount, then upload the screenshot below.
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
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
              {submitting ? "Confirming…" : `Confirm ${selected.length || ""} seat${selected.length === 1 ? "" : "s"}`}
            </Button>
            <p className="text-xs text-muted-foreground">
              Picking a seat locks it for you for a few minutes — nobody else can book it while
              your timer runs. Leave the page or let the timer run out and it goes back on sale.
            </p>
          </form>
        </aside>
      </div>
    </div>
  );
}

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
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string | undefined;
  type?: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5"
      />
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}