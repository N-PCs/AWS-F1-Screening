import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROOMS, TIERS, TOTAL_SEATS, roomForSeat, seatDisplayId, tierForSeat } from "@/lib/seat-layout";
import { ADMIN_EMAILS, EVENT } from "@/lib/event-config";
import { isFirebaseConfigured } from "@/lib/firebase";
import {
  adminAllocateWaitlist,
  adminDeleteBooking,
  adminList,
  adminRebuildAvailability,
  adminRebuildLookups,
  adminRemoveWaitlist,
  adminScreenshot,
  adminSetRoomOpen,
  adminSetStatus,
  adminSignIn,
  adminSignOut,
  adminWaitlistList,
  getRoomState,
  watchAdmin,
  type BookingRecord,
  type WaitlistRecord,
} from "@/lib/booking-api";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Organiser Access — AWS SBG VITB Screening" },
      {
        name: "description",
        content: "Restricted registrations dashboard for AWS SBG VITB screening organisers.",
      },
      { property: "og:title", content: "Organiser Access — AWS SBG VITB Screening" },
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
  const [deleteCode, setDeleteCode] = useState<string | null>(null);
  const [waitlist, setWaitlist] = useState<WaitlistRecord[]>([]);
  const [r2Open, setR2Open] = useState(false);
  const [roomBusy, setRoomBusy] = useState(false);

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
      const [data, wl, rooms] = await Promise.all([
        adminList(),
        adminWaitlistList(),
        getRoomState(),
      ]);
      setBookings(data.bookings);
      setWaitlist(wl.entries);
      setR2Open(Boolean(rooms.R2));
      // Keep the public email/reg lookup index in sync so tickets created
      // before it existed are still findable on /tickets.
      if (data.bookings.length || wl.entries.length) {
        await adminRebuildLookups().catch(() => {});
      }
      // Also rebuild the availability aggregate so the seat map is accurate
      // for tickets created before this index existed.
      await adminRebuildAvailability().catch(() => {});
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
      setBookings((prev) => prev.map((b) => (b.code === code ? { ...b, status } : b)));
      toast.success(`Booking ${code} marked ${status}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function removeBooking(code: string) {
    setBusy(true);
    try {
      await adminDeleteBooking(code);
      setBookings((prev) => prev.filter((b) => b.code !== code));
      toast.success(`Booking ${code} deleted. Seats released.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
      setDeleteCode(null);
    }
  }

  async function toggleRoom() {
    setRoomBusy(true);
    try {
      const res = await adminSetRoomOpen("R2", !r2Open);
      setR2Open(res.open);

      if (res.open) {
        const { entries } = await adminWaitlistList();
        for (const entry of entries) {
          try {
            await adminAllocateWaitlist(entry.code, email ?? "");
            toast.success(`Waitlist ${entry.code} → booking allocated for ${entry.name}.`);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : `Allocation failed for ${entry.code}`);
          }
        }
      }

      toast.success(`AB02-126 ${res.open ? "opened for booking." : "locked again."}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setRoomBusy(false);
    }
  }

  /** Turn a waitlist entry into a real booking — the seat is already reserved for them. */
  async function allocateWaitlist(code: string) {
    setRoomBusy(true);
    try {
      const res = await adminAllocateWaitlist(code, email ?? "");
      toast.success(`Waitlist ${code} → booking ${res.code} (${seatDisplayId(res.seat)}, ₹${res.amount}).`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Allocation failed");
    } finally {
      setRoomBusy(false);
    }
  }

  async function removeWaitlist(code: string) {
    setRoomBusy(true);
    try {
      await adminRemoveWaitlist(code);
      toast.success(`Waitlist ${code} removed. Seat released.`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Removal failed");
    } finally {
      setRoomBusy(false);
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
    const perTier: Record<string, number> = { redbull: 0, ferrari: 0, premium: 0, standard: 0, economy: 0 };
    const perRoom: Record<string, number> = {};
    let seats = 0;
    let revenue = 0;
    for (const b of active) {
      seats += b.seats.length;
      revenue += b.amount;
      for (const s of b.seats) {
        const t = tierForSeat(s);
        if (t) perTier[t.id] = (perTier[t.id] ?? 0) + 1;
        const room = roomForSeat(s);
        if (room) perRoom[room.name] = (perRoom[room.name] ?? 0) + 1;
      }
    }
    return { seats, revenue, perTier, perRoom, remaining: TOTAL_SEATS - seats };
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
      b.seats.map(seatDisplayId).join(" "),
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

async function downloadWaitlistCSV() {
    const { entries } = await adminWaitlistList();
    const header = ["Seat", "Registration No", "Waitlist Code", "Created At"];
    const rows = entries.map((e) => [
      seatDisplayId(e.seat),
      e.regNo,
      e.code,
      e.createdAt ?? "",
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `f1-screening-waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!unlocked) {
    return (
      <div className="mx-auto max-w-sm px-4 py-20">
        <h1 className="text-2xl font-bold uppercase">Organiser access</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in with your organiser Google account. Only {ADMIN_EMAILS.join(" and ")} can read
          registrations.
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
      <p className="mt-1 text-xs text-muted-foreground">
        {ROOMS.map((r) => `${r.name}: ${stats.perRoom[r.name] ?? 0} sold`).join(" · ")}
      </p>

      {/* ── AB02-126 waiting list ── */}
      <section className="mt-8 overflow-hidden rounded-md border border-waitlist/40">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest">AB02-126 waiting list</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {waitlist.length} / {EVENT.waitlistCapacity} entries ·{" "}
              {r2Open ? (
                <span className="font-semibold text-tier-economy">
                  room is OPEN — waitlisted seats stay reserved until you allocate them
                </span>
              ) : (
                <span className="font-semibold text-waitlist">room locked for now</span>
              )}
            </p>
          </div>
<Button variant="outline" disabled={roomBusy || busy} onClick={() => void toggleRoom()}>
            {r2Open ? "Lock AB02-126" : "Open AB02-126 for booking"}
          </Button>
        {/* Download waitlist CSV */}
        <div className="mt-2">
          <Button variant="outline" onClick={() => downloadWaitlistCSV()} disabled={roomBusy || busy}>
            Download waitlist CSV
          </Button>
        </div>
      </header>

      <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs tracking-widest uppercase">
              <tr>
                <th className="px-3 py-2">Code</th>
                <th className="px-3 py-2">Person</th>
                <th className="px-3 py-2">Contact</th>
                <th className="px-3 py-2">Seat</th>
                <th className="px-3 py-2">Added</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {waitlist.map((w) => (
                <tr key={w.code} className="align-top">
                  <td className="px-3 py-3 font-mono text-xs">
                    {w.code}
                    <span className="mt-1 block text-muted-foreground">{w.createdAt}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="font-semibold">{w.name}</span>
                    <span className="block text-xs text-muted-foreground">{w.regNo}</span>
                  </td>
                  <td className="px-3 py-3 text-xs">
                    <span className="block">{w.email}</span>
                    <span className="block text-muted-foreground">{w.phone}</span>
                  </td>
                  <td className="px-3 py-3 text-xs font-mono">
                    {seatDisplayId(w.seat)}
                    <span className="block text-muted-foreground">
                      {tierForSeat(w.seat)?.name} · ₹{tierForSeat(w.seat)?.price}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs">{w.createdAt}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={roomBusy}
                        onClick={() => void allocateWaitlist(w.code)}
                        className="border-tier-economy/60 text-tier-economy hover:text-tier-economy"
                      >
                        Allocate booking
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={roomBusy}
                        onClick={() => void removeWaitlist(w.code)}
                        className="text-destructive hover:text-destructive"
                      >
                        Remove
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {waitlist.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                    Nobody on the waiting list yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
          "Allocate booking" locks the reserved seat and moves the candidate to the overall Registrations list in unpaid status (`pending_payment`). The student completes payment on the Ticket Portal, uploads a screenshot, and you verify it here. "Remove" frees the seat and registration number.
        </p>
      </section>

      <Input
        placeholder="Search name, email, reg no., seat, UPI ref…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="mt-6 max-w-sm"
      />

      <div className="mt-4 overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
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
                <td className="px-3 py-3 text-xs">{b.seats.map(seatDisplayId).join(", ")}</td>
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
                          : b.status === "pending_payment"
                            ? "font-bold text-purple-400"
                            : "font-bold text-tier-standard"
                    }
                  >
                    {b.status === "pending_payment" ? "unpaid (allocated)" : b.status}
                  </span>
                  <div className="mt-2 flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy || b.status === "pending_payment" || !b.screenshotUrl}
                      title={
                        b.status === "pending_payment" || !b.screenshotUrl
                          ? "Student must submit payment & screenshot before verification"
                          : "Verify booking"
                      }
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
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteCode(b.code)}
                    >
                      Delete
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
        Rejecting a booking releases its seats back onto the public seat map. Deleting a booking
        removes it entirely so the person can register again.
      </p>

      <AlertDialog open={Boolean(deleteCode)} onOpenChange={(open) => !open && setDeleteCode(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete booking {deleteCode}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the booking, its screenshot link and the registration-number
              lock, and releases its seats. The person will be able to register again with the same
              registration number.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                if (deleteCode) void removeBooking(deleteCode);
              }}
            >
              {busy ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">{label}</p>
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
