import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Clock, Download, Ticket, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EVENT, UPI } from "@/lib/event-config";
import { isFirebaseConfigured } from "@/lib/firebase";
import { uploadImage } from "@/lib/cloudinary";
import { roomForSeat, seatDisplayId, tierForSeat } from "@/lib/seat-layout";
import { compressImage, getBooking, submitWaitlistPayment } from "@/lib/booking-api";
import { generateTicketPdf } from "@/lib/pdf-ticket";

export const Route = createFileRoute("/booking/$code")({
  head: () => ({
    meta: [
      { title: "Your Booking — F1 Grand Prix Screening | AWS SBG VITB" },
      {
        name: "description",
        content:
          "Your seat confirmation for the AWS SBG VITB Formula 1 Grand Prix screening in AB-02.",
      },
      { property: "og:title", content: "Your Booking — F1 Grand Prix Screening" },
      {
        property: "og:description",
        content: "Seat confirmation for the AWS SBG VITB F1 screening in AB-02.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BookingPage,
});

function BookingPage() {
  const { code } = Route.useParams();
  const query = useQuery({
    queryKey: ["booking", code],
    queryFn: () => getBooking(code),
    retry: false,
    enabled: isFirebaseConfigured,
  });

  const [upiRef, setUpiRef] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const isPendingPayment = query.data?.status === "pending_payment";
  const isVerified = query.data?.status === "verified";
  const isRejected = query.data?.status === "rejected";
  const isPending = query.data?.status === "pending";

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const cleanUpi = upiRef.trim();
    if (!cleanUpi || cleanUpi.length < 6) {
      setFormError("Please enter a valid UPI transaction / reference ID (UTR).");
      return;
    }
    if (!file) {
      setFormError("Please select your payment screenshot image.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setFormError("The selected file is not an image.");
      return;
    }
    setSubmitting(true);
    try {
      const screenshotBlob = await compressImage(file);
      const screenshot = await uploadImage(screenshotBlob);
      await submitWaitlistPayment({
        code,
        upiRef: cleanUpi,
        screenshot,
      });
      toast.success("Payment submitted! Organisers will verify your receipt shortly.");
      void query.refetch();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Payment submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14 pb-24">
      <div className="checkers h-2 w-24 opacity-80" aria-hidden />
      <h1 className="mt-5 text-3xl font-bold uppercase sm:text-4xl">Booking Details</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Screenshot this page or keep the link. Show your booking code at the AB-02 door.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-md border border-primary/40 bg-primary/10 p-5">
        <div>
          <p className="text-xs font-bold tracking-[0.3em] uppercase">Booking code</p>
          <p className="mt-1 font-mono text-2xl font-bold break-all">{code}</p>
        </div>

        {query.data && (
          <div>
            {isPendingPayment && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/40 bg-purple-500/10 px-3.5 py-1.5 text-xs font-bold text-purple-400">
                <Lock className="h-4 w-4" />
                Allocated — Payment Required
              </span>
            )}
            {isVerified && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                Verified by organisers
              </span>
            )}
            {isRejected && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/10 px-3.5 py-1.5 text-xs font-bold text-red-400">
                <XCircle className="h-4 w-4" />
                Rejected by organiser
              </span>
            )}
            {isPending && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3.5 py-1.5 text-xs font-bold text-amber-400">
                <Clock className="h-4 w-4" />
                Pending verification
              </span>
            )}
          </div>
        )}
      </div>

      {query.isLoading && (
        <p className="mt-6 text-sm text-muted-foreground">Loading your booking…</p>
      )}
      {query.isError && (
        <p className="mt-6 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm">
          We could not find a booking with this code. Double-check the link, or contact the
          organisers with your UPI reference.
        </p>
      )}

      {query.data && (
        <>
          <dl className="mt-6 divide-y divide-border rounded-md border border-border bg-card px-5">
            <Row label="Name" value={query.data.name} />
            <Row label="Registration no." value={query.data.regNo} />
            <Row label="Email" value={query.data.email} />
            <Row label="Phone" value={query.data.phone} />
            <Row
              label="Seats"
              value={query.data.seats
                .map((s) => {
                  const room = roomForSeat(s)?.name;
                  const tier = tierForSeat(s)?.name;
                  return `${seatDisplayId(s)} (${[room, tier].filter(Boolean).join(" · ") || "—"})`;
                })
                .join(", ")}
            />
            <Row label="Amount" value={`₹${query.data.amount}`} />
            <Row label="UPI reference" value={query.data.upiRef || "Pending Payment"} />
            <Row
              label="Payment status"
              value={
                isVerified ? (
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" /> Verified by organisers
                  </span>
                ) : isRejected ? (
                  <span className="inline-flex items-center gap-1 font-bold text-red-400">
                    <XCircle className="h-4 w-4" /> Rejected by organiser
                  </span>
                ) : isPendingPayment ? (
                  <span className="inline-flex items-center gap-1 font-bold text-purple-400">
                    <Lock className="h-4 w-4" /> Allocated — Payment Required
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-bold text-amber-400">
                    <Clock className="h-4 w-4" /> Pending verification
                  </span>
                )
              }
            />
          </dl>

          {/* Allocated Pending Payment Form Section */}
          {isPendingPayment && (
            <div className="mt-6 rounded-lg border border-purple-500/30 bg-purple-500/5 p-5">
              <h3 className="font-bold text-sm uppercase text-purple-400 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Seat Allocated! Complete Payment to Confirm Your Pass
              </h3>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Your seat <strong>{query.data.seats.map(seatDisplayId).join(", ")}</strong> in AB02-127 has been allocated for you. Please scan the QR code below, pay <strong>₹{query.data.amount}</strong> via UPI, enter your reference number, and upload the payment screenshot to submit for organiser verification.
              </p>

              <form onSubmit={handlePaySubmit} className="mt-4 space-y-4 border-t border-purple-500/20 pt-4">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <img
                    src={UPI.qrImage}
                    alt={`UPI QR code for ${UPI.payeeName}`}
                    className="h-28 w-28 shrink-0 rounded-md border border-border bg-background object-contain p-1"
                  />
                  <div className="text-xs text-center sm:text-left space-y-1">
                    <p className="font-bold text-foreground">{UPI.payeeName}</p>
                    <p className="font-mono text-xs text-muted-foreground">{UPI.id}</p>
                    <p className="text-purple-400 font-bold text-sm">Amount: ₹{query.data.amount}</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="booking-upiRef" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      UPI Ref / UTR Number
                    </label>
                    <Input
                      id="booking-upiRef"
                      type="text"
                      placeholder="e.g. 423456789012"
                      value={upiRef}
                      onChange={(e) => setUpiRef(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <label htmlFor="booking-screenshot" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      Payment Screenshot
                    </label>
                    <Input
                      id="booking-screenshot"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                      className="text-xs"
                    />
                  </div>
                </div>

                {formError && <p className="text-xs text-destructive font-medium">{formError}</p>}

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase text-xs tracking-wider"
                >
                  {submitting ? "Uploading & Submitting..." : "Submit Payment for Verification"}
                </Button>
              </form>
            </div>
          )}

          {/* Download PDF section */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-md border border-border bg-card p-5">
            <div>
              <p className="font-bold uppercase text-xs tracking-wider">PDF Ticket Pass</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {isVerified
                  ? "Your payment is verified! Download your official PDF pass for entry."
                  : "PDF download is unlocked once organisers verify your payment."}
              </p>
            </div>
            <Button
              type="button"
              onClick={() => generateTicketPdf(query.data!, false)}
              disabled={!isVerified}
              className={
                isVerified
                  ? "w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold tracking-wider uppercase text-xs"
                  : "w-full sm:w-auto font-bold tracking-wider uppercase text-xs"
              }
            >
              <Download className="mr-1.5 h-4 w-4" />
              {isVerified ? "Download PDF Ticket" : "PDF Pass (Pending Admin)"}
            </Button>
          </div>
        </>
      )}

      <div className="mt-8 rounded-md border border-border bg-card p-5 text-sm">
        <p className="font-bold uppercase">{EVENT.title}</p>
        <p className="mt-1 text-muted-foreground">
          {EVENT.dateLabel} · {EVENT.timeLabel} · {EVENT.venue}, {EVENT.campus}
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          Arrive 15 minutes early. Seats are held only for the person named above.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-4">
        <Link
          to="/"
          className="inline-flex items-center rounded-sm border border-border px-4 py-2 text-sm font-bold tracking-wide uppercase hover:bg-secondary"
        >
          Back to home
        </Link>
        <Link
          to="/tickets"
          className="inline-flex items-center rounded-sm border border-primary bg-primary/10 px-4 py-2 text-sm font-bold tracking-wide uppercase text-primary hover:bg-primary/20"
        >
          <Ticket className="mr-1.5 h-4 w-4" /> All My Tickets
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="text-xs font-bold tracking-widest text-muted-foreground uppercase">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}
