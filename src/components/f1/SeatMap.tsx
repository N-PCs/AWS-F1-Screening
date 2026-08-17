import {
  ROOM_ROWS,
  ROOM_SEAT_COUNT,
  TIERS,
  roomForId,
  rowBlocks,
  seatId,
  seatNum,
  tierForSeat,
  type RoomId,
  type RowDef,
  type TierId,
} from "@/lib/seat-layout";
import { cn } from "@/lib/utils";

type Props = {
  room: RoomId;
  taken: Set<string>;
  /** seats another visitor is holding right now */
  held?: Set<string>;
  /** seats reserved through the waiting list (permanently off sale until opened) */
  waitlisted?: Set<string>;
  selected: string[];
  onToggle: (id: string) => void;
  disabled?: boolean | undefined;
};

export function SeatMap({ room, taken, held, waitlisted, selected, onToggle, disabled }: Props) {
  const selectedSet = new Set(selected);
  const heldSet = held ?? new Set<string>();
  const waitlistedSet = waitlisted ?? new Set<string>();
  const rows = ROOM_ROWS[room];
  const roomInfo = roomForId(room);
  const bands = rows.reduce<{ tier: TierId; rows: RowDef[] }[]>((acc, def) => {
    const last = acc[acc.length - 1];
    if (last && last.tier === def.tier) last.rows.push(def);
    else acc.push({ tier: def.tier, rows: [def] });
    return acc;
  }, []);

  return (
    <div className="overflow-x-auto scroll-smooth overscroll-x-contain">
      {/* Mobile scroll hint */}
      <div className="mb-2 flex items-center justify-center gap-2 rounded-md border border-border bg-secondary/50 py-1.5 text-[0.65rem] text-muted-foreground sm:hidden">
        <span aria-hidden>←</span>
        <span>Scroll sideways to see all seats</span>
        <span aria-hidden>→</span>
      </div>

      {/* Room banner — room accent makes AB02-127 / AB02-128 instantly distinct */}
      <div
        className={cn(
          "mb-3 flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1 rounded-sm border px-2 sm:px-3 py-1.5 sm:py-2",
          roomPanel[roomInfo.tone],
        )}
      >
        <span
          className={cn(
            "flex items-center gap-1.5 sm:gap-2 text-[0.6rem] sm:text-xs font-bold tracking-[0.2em] uppercase",
            roomText[roomInfo.tone],
          )}
        >
          <span className={cn("h-2 w-2 rounded-full", roomDot[roomInfo.tone])} aria-hidden />
          {roomInfo.label} · {roomInfo.name}
        </span>
        <span className="ml-auto text-[0.55rem] sm:text-[0.65rem] tracking-widest text-muted-foreground uppercase">
          {ROOM_SEAT_COUNT} seats
        </span>
      </div>

      <div className="min-w-[680px] space-y-4 pb-2">
        <div className="mx-auto w-3/4">
          <div
            className={cn(
              "rounded-t-[50%] border-t-2 bg-linear-to-b to-transparent py-3 text-center text-xs font-semibold tracking-[0.35em] uppercase",
              roomScreen[roomInfo.tone],
            )}
          >
            Screen
          </div>
        </div>

        <div className="space-y-4">
          {bands.map((band) => {
            const tier = TIERS[band.tier];
            const seatCount = band.rows.reduce((n, r) => n + r.count, 0);
            const openCount = band.rows.reduce(
              (n, r) =>
                n +
                Array.from({ length: r.count }, (_, i) => seatId(room, r.row, i + 1)).filter(
                  (id) => !taken.has(id) && !heldSet.has(id) && !waitlistedSet.has(id),
                ).length,
              0,
            );
            return (
              <section key={band.tier} className="space-y-1.5">
                <header className="flex items-center gap-3">
                  <span className={cn("h-3 w-1.5 rounded-full", bandBar[band.tier])} aria-hidden />
                  <h3 className="text-[0.7rem] font-bold tracking-[0.25em] uppercase">
                    {tier.name}
                  </h3>
                  <span className="text-[0.65rem] tracking-widest text-muted-foreground uppercase">
                    Rows {band.rows[0]?.row}–{band.rows[band.rows.length - 1]?.row}
                  </span>
                  <span className="h-px flex-1 bg-border" aria-hidden />
                  <span className="text-[0.65rem] text-muted-foreground">
                    {openCount}/{seatCount} open
                  </span>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[0.65rem] font-bold tabular-nums",
                      bandBadge[band.tier],
                    )}
                  >
                    ₹{tier.price}
                  </span>
                </header>
                {band.rows.map((def) => (
                  <SeatRow
                    key={def.row}
                    room={room}
                    roomName={roomInfo.name}
                    def={def}
                    taken={taken}
                    heldSet={heldSet}
                    waitlistedSet={waitlistedSet}
                    selectedSet={selectedSet}
                    onToggle={onToggle}
                    disabled={disabled}
                  />
                ))}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const roomPanel: Record<string, string> = {
  "room-1": "border-room-1/40 bg-room-1/10",
  "room-2": "border-room-2/40 bg-room-2/10",
};

const roomDot: Record<string, string> = {
  "room-1": "bg-room-1",
  "room-2": "bg-room-2",
};

const roomText: Record<string, string> = {
  "room-1": "text-room-1",
  "room-2": "text-room-2",
};

const roomScreen: Record<string, string> = {
  "room-1": "border-room-1 text-room-1 from-room-1/25",
  "room-2": "border-room-2 text-room-2 from-room-2/25",
};

const bandBar: Record<string, string> = {
  premium: "bg-tier-premium",
  standard: "bg-tier-standard",
  economy: "bg-tier-economy",
};

const bandBadge: Record<string, string> = {
  premium: "border-tier-premium/70 bg-tier-premium/20 text-tier-premium",
  standard: "border-tier-standard/70 bg-tier-standard/20 text-tier-standard",
  economy: "border-tier-economy/70 bg-tier-economy/20 text-tier-economy",
};

function SeatRow({
  room,
  roomName,
  def,
  taken,
  heldSet,
  waitlistedSet,
  selectedSet,
  onToggle,
  disabled,
}: {
  room: RoomId;
  roomName: string;
  def: RowDef;
  taken: Set<string>;
  heldSet: Set<string>;
  waitlistedSet: Set<string>;
  selectedSet: Set<string>;
  onToggle: (id: string) => void;
  disabled?: boolean | undefined;
}) {
  const [left, right] = rowBlocks(def);
  const tier = TIERS[def.tier];

  return (
    <div className="flex items-center gap-3">
      <span className="w-6 shrink-0 text-center text-xs font-bold text-muted-foreground">
        {def.row}
      </span>
      <div className="flex flex-1 items-center justify-center gap-1">
        {left.map((n) => (
          <Seat
            key={n}
            id={seatId(room, def.row, n)}
            label={`${roomName} · ${tier.name} row ${def.row} seat ${n} — ₹${tier.price}`}
            taken={taken.has(seatId(room, def.row, n))}
            held={heldSet.has(seatId(room, def.row, n))}
            waitlisted={waitlistedSet.has(seatId(room, def.row, n))}
            selected={selectedSet.has(seatId(room, def.row, n))}
            onToggle={onToggle}
            disabled={disabled}
          />
        ))}
        <span className="w-6 shrink-0" aria-hidden />
        {right.map((n) => (
          <Seat
            key={n}
            id={seatId(room, def.row, n)}
            label={`${roomName} · ${tier.name} row ${def.row} seat ${n} — ₹${tier.price}`}
            taken={taken.has(seatId(room, def.row, n))}
            held={heldSet.has(seatId(room, def.row, n))}
            waitlisted={waitlistedSet.has(seatId(room, def.row, n))}
            selected={selectedSet.has(seatId(room, def.row, n))}
            onToggle={onToggle}
            disabled={disabled}
          />
        ))}
      </div>
      <span className="flex w-16 shrink-0 items-center justify-end gap-1.5">
        <span className="text-[0.6rem] tabular-nums text-muted-foreground">₹{tier.price}</span>
        <span className="text-xs font-bold text-muted-foreground">{def.row}</span>
      </span>
    </div>
  );
}

const tierClass: Record<string, string> = {
  premium: "bg-tier-premium/25 border-tier-premium/70 hover:bg-tier-premium/50",
  standard: "bg-tier-standard/20 border-tier-standard/70 hover:bg-tier-standard/45",
  economy: "bg-tier-economy/20 border-tier-economy/70 hover:bg-tier-economy/45",
};

const waitlistedClass = "cursor-not-allowed border-waitlist/70 bg-waitlist/20 text-waitlist";

function Seat({
  id,
  label,
  taken,
  held,
  waitlisted,
  selected,
  onToggle,
  disabled,
}: {
  id: string;
  label: string;
  taken: boolean;
  held?: boolean;
  waitlisted?: boolean;
  selected: boolean;
  onToggle: (id: string) => void;
  disabled?: boolean | undefined;
}) {
  const tier = tierForSeat(id)?.id ?? "premium";
  return (
    <button
      type="button"
      aria-label={
        taken
          ? `${label} — already booked`
          : held
            ? `${label} — on hold by another visitor`
            : waitlisted
              ? `${label} — reserved for the waiting list`
              : label
      }
      aria-pressed={selected}
      disabled={taken || held || waitlisted || disabled}
      onClick={() => onToggle(id)}
      className={cn(
        "h-6 w-6 rounded-t-md border text-[0.55rem] font-bold transition-colors",
        taken
          ? "cursor-not-allowed border-border bg-seat-taken text-muted-foreground/50"
          : held
            ? "cursor-not-allowed border-dashed border-accent/70 bg-accent/15 text-muted-foreground"
            : waitlisted
              ? waitlistedClass
              : tierClass[tier],
        selected &&
          "border-foreground bg-foreground text-background ring-2 ring-primary ring-offset-1 ring-offset-background",
        disabled && !taken && "opacity-60",
      )}
    >
      {seatNum(id)}
    </button>
  );
}

export function SeatLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-5 gap-y-1.5 sm:gap-y-2 text-[0.65rem] sm:text-xs">
      {Object.values(TIERS).map((t) => (
        <span key={t.id} className="flex items-center gap-1.5 sm:gap-2">
          <span
            className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-t-md border", tierClass[t.id])}
            aria-hidden
          />
          {t.name} ₹{t.price}
        </span>
      ))}
      <span className="flex items-center gap-1.5 sm:gap-2">
        <span
          className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-t-md border border-foreground bg-foreground"
          aria-hidden
        />
        Selected
      </span>
      <span className="flex items-center gap-1.5 sm:gap-2">
        <span
          className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-t-md border border-border bg-seat-taken"
          aria-hidden
        />
        Booked
      </span>
      <span className="flex items-center gap-1.5 sm:gap-2">
        <span
          className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-t-md border border-dashed border-accent/70 bg-accent/15"
          aria-hidden
        />
        On hold
      </span>
      <span className="flex items-center gap-1.5 sm:gap-2">
        <span
          className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-t-md border border-waitlist/70 bg-waitlist/20"
          aria-hidden
        />
        Waitlist reserved
      </span>
    </div>
  );
}
