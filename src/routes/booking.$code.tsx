import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Clock, Download, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EVENT } from "@/lib/event-config";
import { isFirebaseConfigured } from "@/lib/firebase";
import { roomForSeat, tierForSeat } from "@/lib/seat-layout";
import { getBooking } from "@/lib/booking-api";
import { generateTicketPdf } from "@/lib/pdf-ticket";

export const Route = createFileRoute("/booking/$code")({
  head: () => ({
    meta: [
      { title: "Your Booking — F1 Grand Prix Screening | AWS Club VITB" },
      {
        name: "description",
        content:
          "Your seat confirmation for the AWS Club VITB Formula 1 Grand Prix screening in AB-02.",
      },
      { property: "og:title", content: "Your Booking — F1 Grand Prix Screening" },
      {
        property: "og:description",
        content: "Seat confirmation for the AWS Club VITB F1 screening in AB-02.",
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

  const isVerified = query.data?.status === "verified";
  const isRejected = query.data?.status === "rejected";
  const isPending = query.data?.status === "pending";

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
                  return `${s} (${[room, tier].filter(Boolean).join(" · ") || "—"})`;
                })
                .join(", ")}
            />
            <Row label="Amount paid" value={`₹${query.data.amount}`} />
            <Row label="UPI reference" value={query.data.upiRef} />
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
                ) : (
                  <span className="inline-flex items-center gap-1 font-bold text-amber-400">
                    <Clock className="h-4 w-4" /> Pending verification
                  </span>
                )
              }
            />
          </dl>

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
