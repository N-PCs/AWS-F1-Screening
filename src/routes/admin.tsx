import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TIERS, TOTAL_SEATS, tierForSeat } from "@/lib/seat-layout";
import { ADMIN_EMAILS } from "@/lib/event-config";
import { isFirebaseConfigured } from "@/lib/firebase";
import {
  adminList,
  adminScreenshot,
  adminSetStatus,
  adminSignIn,
  adminSignOut,
  watchAdmin,
  type BookingRecord,
} from "@/lib/booking-api";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Organiser Access — AWS Club VITB Screening" },
      {
        name: "description",
        content: "Restricted registrations dashboard for AWS Club VITB screening organisers.",
      },
      { property: "og:title", content: "Organiser Access — AWS Club VITB Screening" },
      {
        property: "og:description",
        content: "Restricted registrations dashboard for screening organisers.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  // Access is decided by Firebase Auth + Firestore rules, not by this UI.
  const [email, setEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const stop = watchAdmin((user) => {
      setEmail(user?.email ?? null);
      setChecking(false);
    });
    return () => stop();
  }, []);

  const unlocked = Boolean(email);

  useEffect(() => {
    if (unlocked) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked]);

  async function load() {
    setBusy(true);
    try {
      const data = await adminList();
      setBookings(data.bookings);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load registrations");
    } finally {
      setBusy(false);
    }
  }

  async function signIn() {
    setBusy(true);
    try {
      await adminSignIn();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(code: string, status: BookingRecord["status"]) {
    setBusy(true);
    try {
      await adminSetStatus(code, status);
      setBookings((prev) =>
        prev.map((b) => (b.code === code ? { ...b, status } : b)),
      );
      toast.success(`Booking ${code} marked ${status}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return bookings;
    return bookings.filter((b) =>
      [b.code, b.name, b.email, b.phone, b.regNo, b.upiRef, b.seats.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [bookings, filter]);

  const stats = useMemo(() => {
    const active = bookings.filter((b) => b.status !== "rejected");
    const perTier: Record<string, number> = { premium: 0, standard: 0, economy: 0 };
    let seats = 0;
    let revenue = 0;
    for (const b of active) {
      seats += b.seats.length;
      revenue += b.amount;
      for (const s of b.seats) {
        const t = tierForSeat(s);
        if (t) perTier[t.id] = (perTier[t.id] ?? 0) + 1;
      }
    }
    return { seats, revenue, perTier, remaining: TOTAL_SEATS - seats };
  }, [bookings]);

  function exportCsv() {
    const header = [
      "Code",
      "Created",
      "Name",
      "Email",
      "Phone",
      "Reg No",
      "Seats",
      "Amount",
      "UPI Ref",
      "Status",
      "Screenshot URL",
    ];
    const rows = visible.map((b) => [
      b.code,
      b.createdAt,
      b.name,
      b.email,
      b.phone,
      b.regNo,
      b.seats.join(" "),
      String(b.amount),
      b.upiRef,
      b.status,
      b.screenshotUrl,
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `f1-screening-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!unlocked) {
    return (
      <div className="mx-auto max-w-sm px-4 py-20">
        <h1 className="text-2xl font-bold uppercase">Organiser access</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in with your organiser Google account. Only{" "}
          {ADMIN_EMAILS.join(" and ")} can read registrations.
        </p>
        {!isFirebaseConfigured && (
          <p className="mt-4 rounded-md border border-accent/50 bg-accent/10 p-3 text-xs">
            Firebase keys not configured yet — see <code>firebase/README.md</code>.
          </p>
        )}
        <Button
          className="mt-6 w-full font-bold uppercase"
          disabled={busy || checking || !isFirebaseConfigured}
          onClick={() => void signIn()}
        >
          {checking ? "Checking…" : busy ? "Signing in…" : "Sign in with Google"}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div>
          <p className="text-xs font-bold tracking-[0.3em] text-primary uppercase">Pit Wall</p>
          <h1 className="mt-1 text-3xl font-bold uppercase">Registrations</h1>
          <p className="mt-1 text-xs text-muted-foreground">{email}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void load()} disabled={busy}>
            Refresh
          </Button>
          <Button variant="outline" onClick={exportCsv}>
            Export CSV
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setBookings([]);
              void adminSignOut();
            }}
          >
            Sign out
          </Button>
        </div>
      </header>

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <Stat label="Bookings" value={String(bookings.length)} />
        <Stat label="Seats sold" value={`${stats.seats} / ${TOTAL_SEATS}`} />
        <Stat label="Revenue" value={`₹${stats.revenue}`} />
        <Stat label="Seats left" value={String(stats.remaining)} />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {Object.values(TIERS)
          .map((t) => `${t.name}: ${stats.perTier[t.id] ?? 0}`)
          .join(" · ")}
      </p>

      <Input
        placeholder="Search name, email, reg no., seat, UPI ref…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="mt-6 max-w-sm"
      />

      <div className="mt-4 overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-card text-left text-xs tracking-widest uppercase">
            <tr>
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Attendee</th>
              <th className="px-3 py-2">Contact</th>
              <th className="px-3 py-2">Seats</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Payment</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visible.map((b) => (
              <tr key={b.code} className="align-top">
                <td className="px-3 py-3 font-mono text-xs">
                  {b.code}
                  <span className="mt-1 block text-muted-foreground">{b.createdAt}</span>
                </td>
                <td className="px-3 py-3">
                  <span className="font-semibold">{b.name}</span>
                  <span className="block text-xs text-muted-foreground">{b.regNo}</span>
                </td>
                <td className="px-3 py-3 text-xs">
                  <span className="block">{b.email}</span>
                  <span className="block text-muted-foreground">{b.phone}</span>
                </td>
                <td className="px-3 py-3 text-xs">{b.seats.join(", ")}</td>
                <td className="px-3 py-3">₹{b.amount}</td>
                <td className="px-3 py-3 text-xs">
                  <span className="block font-mono">{b.upiRef}</span>
                  <ScreenshotCell code={b.code} initialUrl={b.screenshotUrl} />
                </td>
                <td className="px-3 py-3">
                  <span
                    className={
                      b.status === "verified"
                        ? "font-bold text-tier-economy"
                        : b.status === "rejected"
                          ? "font-bold text-destructive"
                          : "font-bold text-tier-standard"
                    }
                  >
                    {b.status}
                  </span>
                  <div className="mt-2 flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => void setStatus(b.code, "verified")}
                    >
                      Verify
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => void setStatus(b.code, "rejected")}
                    >
                      Reject
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                  No registrations yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Rejecting a booking releases its seats back onto the public seat map.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

/**
 * Shows the Cloudinary screenshot as a clickable thumbnail. New bookings carry
 * the URL on the booking doc; older ones fall back to reading the screenshots
 * collection directly.
 */
function ScreenshotCell({ code, initialUrl }: { code: string; initialUrl: string }) {
  const [url, setUrl] = useState(initialUrl);
  const [missing, setMissing] = useState(Boolean(initialUrl));

  useEffect(() => {
    if (url) return;
    let alive = true;
    adminScreenshot(code)
      .then((u) => {
        if (!alive) return;
        setUrl(u);
        setMissing(Boolean(u));
      })
      .catch(() => {
        if (alive) setMissing(false);
      });
    return () => {
      alive = false;
    };
  }, [code, url]);

  if (!url) {
    return (
      <span className="mt-1 block text-muted-foreground">
        {missing ? "Loading…" : "No screenshot"}
      </span>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="mt-1 inline-flex items-center gap-2 text-primary underline"
      title={`Open payment screenshot for ${code}`}
    >
      <img
        src={url}
        alt={`Payment screenshot ${code}`}
        className="h-12 w-12 rounded-sm border border-border bg-background object-cover"
        loading="lazy"
      />
      View
    </a>
  );
}