import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Ticket,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Lock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { EVENT, UPI } from "@/lib/event-config";
import { isFirebaseConfigured } from "@/lib/firebase";
import { uploadImage } from "@/lib/cloudinary";
import { roomForSeat, tierForSeat } from "@/lib/seat-layout";
import {
  compressImage,
  searchTickets,
  submitWaitlistPayment,
  type BookingRecord,
  type WaitlistRecord,
} from "@/lib/booking-api";
import { generateTicketPdf } from "@/lib/pdf-ticket";

export const Route = createFileRoute("/tickets")({
  head: () => ({
    meta: [
      { title: "My Tickets & Status — F1 Grand Prix Screening | AWS SBG VITB" },
      {
        name: "description",
        content:
          "Lookup your F1 Grand Prix screening ticket or waitlist status. Download verified PDF tickets directly.",
      },
    ],
  }),
  component: TicketsPage,
});

function TicketsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");

  // Pre-fill user email if logged in
  useEffect(() => {
    if (user?.email && !activeQuery) {
      setSearchQuery(user.email);
      setActiveQuery(user.email);
    }
  }, [user?.email, activeQuery]);

  const query = useQuery({
    queryKey: ["searchTickets", activeQuery],
    queryFn: () => searchTickets(activeQuery),
    enabled: isFirebaseConfigured && Boolean(activeQuery.trim()),
    retry: false,
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActiveQuery(searchQuery.trim());
    }
  };

  const hasResults =
    query.data &&
    (query.data.bookings.length > 0 || query.data.waitlists.length > 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12 pb-24">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <div className="flex items-center gap-2 text-xs font-bold tracking-[0.25em] text-primary uppercase">
          <Ticket className="h-4 w-4" aria-hidden />
          <span>Ticket Portal</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold uppercase sm:text-4xl">
          My Tickets & Status
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
          Enter your Email, Registration Number (e.g. 23BCE1001), or Code (e.g. F1-ABC123) to view your ticket and download your verified PDF pass.
        </p>
      </div>

      {/* Search Bar */}
      <form
        onSubmit={handleSearchSubmit}
        className="mt-6 flex flex-col sm:flex-row gap-3 rounded-lg border border-border bg-card p-4 shadow-sm"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Enter Email, Reg No (e.g. 23BCE1001), or Code (F1-XXXXXX / WL-XXXXXX)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 text-sm"
          />
        </div>
        <Button type="submit" className="font-bold uppercase tracking-wider">
          Find Tickets
        </Button>
      </form>

      {/* Quick suggestions if logged in */}
      {user?.email && searchQuery !== user.email && (
        <p className="mt-2 text-xs text-muted-foreground">
          Quick search:{" "}
          <button
            type="button"
            onClick={() => {
              setSearchQuery(user.email!);
              setActiveQuery(user.email!);
            }}
            className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
          >
            Search using logged in email ({user.email})
          </button>
        </p>
      )}

      {/* Loading state */}
      {query.isLoading && (
        <div className="mt-10 text-center py-12 border border-dashed border-border rounded-lg">
          <Clock className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Searching for your tickets…
          </p>
        </div>
      )}

      {/* Empty State / Not Searched yet */}
      {!activeQuery && !query.isLoading && (
        <div className="mt-10 rounded-lg border border-dashed border-border bg-card/50 p-8 text-center sm:p-12">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Ticket className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-bold uppercase">Search Your Ticket</h3>
          <p className="mt-1.5 max-w-md mx-auto text-xs sm:text-sm text-muted-foreground">
            Type your registration number, VIT email address, or booking reference code in the search bar above to look up your confirmation status.
          </p>
        </div>
      )}

      {/* No Results Found */}
      {activeQuery && !query.isLoading && !hasResults && (
        <div className="mt-10 rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="text-base font-bold uppercase text-destructive">
            No Tickets Found
          </p>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            We couldn't find any booking or waitlist records for{" "}
            <span className="font-semibold text-foreground">"{activeQuery}"</span>. Please double-check your registration number or email address.
          </p>
        </div>
      )}

      {/* Results Section */}
      {hasResults && (
        <div className="mt-8 space-y-8">
          {/* Booked Tickets List */}
          {query.data!.bookings.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold uppercase tracking-wide flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Booked Passes ({query.data!.bookings.length})
              </h2>

              <div className="grid gap-6">
                {query.data!.bookings.map((booking) => (
                  <BookingTicketCard
                    key={booking.code}
                    booking={booking}
                    onRefresh={() => void query.refetch()}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Waitlisted Tickets List */}
          {query.data!.waitlists.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-border">
              <h2 className="text-lg font-bold uppercase tracking-wide flex items-center gap-2">
                <Lock className="h-5 w-5 text-waitlist" />
                Waitlisted Seats ({query.data!.waitlists.length})
              </h2>

              <div className="grid gap-6">
                {query.data!.waitlists.map((wl) => (
                  <WaitlistTicketCard key={wl.code} waitlist={wl} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Component to display a Booked Ticket Card with Status Badge and Download PDF button */
function BookingTicketCard({
  booking,
  onRefresh,
}: {
  booking: BookingRecord;
  onRefresh?: () => void;
}) {
  const isPendingPayment = booking.status === "pending_payment";
  const isVerified = booking.status === "verified";
  const isRejected = booking.status === "rejected";
  const isPending = booking.status === "pending";

  const [upiRef, setUpiRef] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

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
        code: booking.code,
        upiRef: cleanUpi,
        screenshot,
      });
      toast.success("Payment submitted! Organisers will verify your receipt shortly.");
      if (onRefresh) onRefresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Payment submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-sm transition hover:border-primary/40">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <span className="text-[0.65rem] font-bold tracking-[0.25em] text-muted-foreground uppercase">
            Booking Reference
          </span>
          <p className="font-mono text-xl sm:text-2xl font-bold text-foreground">
            {booking.code}
          </p>
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-2">
          {isPendingPayment && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/40 bg-purple-500/10 px-3.5 py-1.5 text-xs font-bold text-purple-400">
              <Lock className="h-4 w-4" />
              Allocated — Payment Required
            </span>
          )}

          {isVerified && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-bold text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              Verified by Organisers
            </span>
          )}

          {isRejected && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/10 px-3.5 py-1.5 text-xs font-bold text-red-400">
              <XCircle className="h-4 w-4" />
              Rejected by Organiser
            </span>
          )}

          {isPending && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3.5 py-1.5 text-xs font-bold text-amber-400">
              <Clock className="h-4 w-4" />
              Pending Verification
            </span>
          )}
        </div>
      </div>

      {/* Grid details */}
      <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 text-sm">
        <div>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Attendee
          </span>
          <p className="font-semibold text-foreground">{booking.name}</p>
          <p className="text-xs text-muted-foreground">{booking.regNo}</p>
        </div>

        <div>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Contact
          </span>
          <p className="text-xs text-foreground truncate">{booking.email}</p>
          <p className="text-xs text-muted-foreground">{booking.phone}</p>
        </div>

        <div>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Seats Reserved
          </span>
          <p className="font-semibold text-primary">
            {booking.seats
              .map((s) => {
                const room = roomForSeat(s)?.name;
                const tier = tierForSeat(s)?.name;
                return `${s} (${[room, tier].filter(Boolean).join(" · ")})`;
              })
              .join(", ")}
          </p>
        </div>

        <div>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Payment Info
          </span>
          <p className="font-semibold text-foreground">₹{booking.amount}</p>
          <p className="text-xs text-muted-foreground">
            UPI Ref: {booking.upiRef || "Pending Payment"}
          </p>
        </div>

        <div>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Event Date & Venue
          </span>
          <p className="text-xs font-semibold">{EVENT.dateLabel}</p>
          <p className="text-xs text-muted-foreground">{EVENT.venue}</p>
        </div>

        <div>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Booked On
          </span>
          <p className="text-xs font-semibold text-muted-foreground">
            {new Date(booking.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Allocated Pending Payment Form Section */}
      {isPendingPayment && (
        <div className="mt-5 rounded-lg border border-purple-500/30 bg-purple-500/5 p-4 sm:p-5">
          <h3 className="font-bold text-sm uppercase text-purple-400 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Seat Allocated! Complete Payment to Confirm Your Ticket
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Your seat <strong>{booking.seats.join(", ")}</strong> has been allocated from the waitlist.
            Scan the QR code below, pay <strong>₹{booking.amount}</strong> via UPI, enter your reference number, and upload the payment screenshot to submit for organiser verification.
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
                <p className="text-purple-400 font-bold text-sm">Amount: ₹{booking.amount}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor={`upiRef-${booking.code}`} className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  UPI Ref / UTR Number
                </label>
                <Input
                  id={`upiRef-${booking.code}`}
                  type="text"
                  placeholder="e.g. 423456789012"
                  value={upiRef}
                  onChange={(e) => setUpiRef(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div>
                <label htmlFor={`screenshot-${booking.code}`} className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Payment Screenshot
                </label>
                <Input
                  id={`screenshot-${booking.code}`}
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

      {/* Action Footer */}
      <div className="mt-6 pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {isVerified
            ? "Your payment is verified! Download your official PDF ticket pass below."
            : isRejected
              ? "Payment verification was rejected by organisers. Please contact support if you need assistance."
              : isPendingPayment
                ? "Payment required: Complete payment form above to request verification."
                : "Organisers are reviewing your payment screenshot. Check back soon!"}
        </p>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Download PDF button */}
          <Button
            type="button"
            onClick={() => generateTicketPdf(booking, false)}
            disabled={!isVerified}
            title={!isVerified ? "Ticket PDF download is available after admin verification" : "Download PDF Ticket"}
            className={
              isVerified
                ? "w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold tracking-wider uppercase text-xs"
                : "w-full sm:w-auto font-bold tracking-wider uppercase text-xs"
            }
          >
            <Download className="mr-1.5 h-4 w-4" />
            {isVerified ? "Download PDF Ticket" : "PDF Pass (Pending Admin)"}
          </Button>

          <Link
            to="/booking/$code"
            params={{ code: booking.code }}
            className="inline-flex items-center justify-center rounded-md border border-border px-3 py-2 text-xs font-bold uppercase tracking-wider hover:bg-secondary shrink-0"
          >
            Details <ExternalLink className="ml-1 h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Component to display a Waitlisted Ticket Card */
function WaitlistTicketCard({ waitlist }: { waitlist: WaitlistRecord }) {
  return (
    <div className="rounded-xl border border-waitlist/40 bg-waitlist/5 p-5 sm:p-6 shadow-sm transition hover:border-waitlist/60">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-waitlist/20 pb-4">
        <div>
          <span className="text-[0.65rem] font-bold tracking-[0.25em] text-waitlist uppercase">
            Waitlist Code
          </span>
          <p className="font-mono text-xl sm:text-2xl font-bold text-foreground">
            {waitlist.code}
          </p>
        </div>

        {/* Waitlist Badge */}
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/40 bg-purple-500/10 px-3.5 py-1.5 text-xs font-bold text-purple-400">
            <Lock className="h-4 w-4" />
            Waitlisted (Seat Reserved)
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 text-sm">
        <div>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Attendee
          </span>
          <p className="font-semibold text-foreground">{waitlist.name}</p>
          <p className="text-xs text-muted-foreground">{waitlist.regNo}</p>
        </div>

        <div>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Contact
          </span>
          <p className="text-xs text-foreground truncate">{waitlist.email}</p>
          <p className="text-xs text-muted-foreground">{waitlist.phone}</p>
        </div>

        <div>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Reserved Seat
          </span>
          <p className="font-semibold text-waitlist">{waitlist.seat} (AB02-127)</p>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-waitlist/20 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          No payment was required yet. When AB02-127 opens, organisers will allocate your reserved seat!
        </p>

        <Button
          type="button"
          onClick={() => generateTicketPdf(waitlist, true)}
          variant="outline"
          className="w-full sm:w-auto font-bold tracking-wider uppercase text-xs border-waitlist/50 text-waitlist hover:bg-waitlist/10"
        >
          <Download className="mr-1.5 h-4 w-4" />
          Download Waitlist Pass
        </Button>
      </div>
    </div>
  );
}
