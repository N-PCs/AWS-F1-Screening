import { ROWS, TIERS, rowBlocks, seatId, type RowDef, type TierId } from "@/lib/seat-layout";
import { cn } from "@/lib/utils";

type Props = {
  taken: Set<string>;
  /** seats another visitor is holding right now */
  held?: Set<string>;
  selected: string[];
  onToggle: (id: string) => void;
  disabled?: boolean | undefined;
};

export function SeatMap({ taken, held, selected, onToggle, disabled }: Props) {
  const selectedSet = new Set(selected);
  const heldSet = held ?? new Set<string>();
  const bands = ROWS.reduce<{ tier: TierId; rows: RowDef[] }[]>((acc, def) => {
    const last = acc[acc.length - 1];
    if (last && last.tier === def.tier) last.rows.push(def);
    else acc.push({ tier: def.tier, rows: [def] });
    return acc;
  }, []);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[720px] space-y-4 pb-2">
        <div className="mx-auto w-3/4">
          <div className="rounded-t-[50%] border-t-2 border-primary/70 bg-linear-to-b from-primary/25 to-transparent py-3 text-center text-xs font-semibold tracking-[0.35em] uppercase">
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
                Array.from({ length: r.count }, (_, i) => seatId(r.row, i + 1)).filter(
                  (id) => !taken.has(id) && !heldSet.has(id),
                ).length,
              0,
            );
            return (
              <section key={band.tier} className="space-y-1.5">
                <header className="flex items-center gap-3">
                  <span
                    className={cn("h-3 w-1.5 rounded-full", bandBar[band.tier])}
                    aria-hidden
                  />
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
                    def={def}
                    taken={taken}
                    heldSet={heldSet}
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
  def,
  taken,
  heldSet,
  selectedSet,
  onToggle,
  disabled,
}: {
  def: RowDef;
  taken: Set<string>;
  heldSet: Set<string>;
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
            id={seatId(def.row, n)}
            tier={def.tier}
            label={`${tier.name} row ${def.row} seat ${n} — ₹${tier.price}`}
            taken={taken.has(seatId(def.row, n))}
            held={heldSet.has(seatId(def.row, n))}
            selected={selectedSet.has(seatId(def.row, n))}
            onToggle={onToggle}
            disabled={disabled}
          />
        ))}
        <span className="w-6 shrink-0" aria-hidden />
        {right.map((n) => (
          <Seat
            key={n}
            id={seatId(def.row, n)}
            tier={def.tier}
            label={`${tier.name} row ${def.row} seat ${n} — ₹${tier.price}`}
            taken={taken.has(seatId(def.row, n))}
            held={heldSet.has(seatId(def.row, n))}
            selected={selectedSet.has(seatId(def.row, n))}
            onToggle={onToggle}
            disabled={disabled}
          />
        ))}
      </div>
      <span className="flex w-16 shrink-0 items-center justify-end gap-1.5">
        <span className="text-[0.6rem] tabular-nums text-muted-foreground">
          ₹{tier.price}
        </span>
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

function Seat({
  id,
  tier,
  label,
  taken,
  held,
  selected,
  onToggle,
  disabled,
}: {
  id: string;
  tier: string;
  label: string;
  taken: boolean;
  held?: boolean;
  selected: boolean;
  onToggle: (id: string) => void;
  disabled?: boolean | undefined;
}) {
  return (
    <button
      type="button"
      aria-label={
        taken ? `${label} — already booked` : held ? `${label} — on hold by another visitor` : label
      }
      aria-pressed={selected}
      disabled={taken || held || disabled}
      onClick={() => onToggle(id)}
      className={cn(
        "h-6 w-6 rounded-t-md border text-[0.55rem] font-bold transition-colors",
        taken
          ? "cursor-not-allowed border-border bg-seat-taken text-muted-foreground/50"
          : held
            ? "cursor-not-allowed border-dashed border-accent/70 bg-accent/15 text-muted-foreground"
            : tierClass[tier],
        selected &&
          "border-foreground bg-foreground text-background ring-2 ring-primary ring-offset-1 ring-offset-background",
        disabled && !taken && "opacity-60",
      )}
    >
      {id.replace(/[A-Z]/g, "")}
    </button>
  );
}

export function SeatLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
      {Object.values(TIERS).map((t) => (
        <span key={t.id} className="flex items-center gap-2">
          <span
            className={cn("h-4 w-4 rounded-t-md border", tierClass[t.id])}
            aria-hidden
          />
          {t.name} · ₹{t.price}
        </span>
      ))}
      <span className="flex items-center gap-2">
        <span className="h-4 w-4 rounded-t-md border border-foreground bg-foreground" aria-hidden />
        Selected
      </span>
      <span className="flex items-center gap-2">
        <span className="h-4 w-4 rounded-t-md border border-border bg-seat-taken" aria-hidden />
        Booked
      </span>
      <span className="flex items-center gap-2">
        <span
          className="h-4 w-4 rounded-t-md border border-dashed border-accent/70 bg-accent/15"
          aria-hidden
        />
        On hold
      </span>
    </div>
  );
}