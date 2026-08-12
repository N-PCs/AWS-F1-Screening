/**
 * EDIT ME — exact AB-02 seat layout.
 *
 * Each row: id (letter), how many seats, and its tier.
 * Seats are numbered 1..count, split around a centre aisle.
 * Current total: 250 seats.
 */
export type TierId = "premium" | "standard" | "economy";

export type Tier = {
  id: TierId;
  name: string;
  price: number;
  /** tailwind-ish token names used by the seat map */
  tone: string;
  /** one-line description shown on the landing page */
  blurb: string;
};

export const TIERS: Record<TierId, Tier> = {
  premium: {
    id: "premium",
    name: "Pit Lane",
    price: 199,
    tone: "tier-premium",
    blurb: "Front rows. Screen fills your vision, sound hits hardest.",
  },
  standard: {
    id: "standard",
    name: "Grandstand",
    price: 149,
    tone: "tier-standard",
    blurb: "Middle of the auditorium — the best all-round view.",
  },
  economy: {
    id: "economy",
    name: "Back Straight",
    price: 99,
    tone: "tier-economy",
    blurb: "Rear rows, cheapest tickets, same race.",
  },
};

export type RowDef = { row: string; count: number; tier: TierId };

export const ROWS: RowDef[] = [
  { row: "A", count: 25, tier: "premium" },
  { row: "B", count: 25, tier: "premium" },
  { row: "C", count: 25, tier: "premium" },
  { row: "D", count: 25, tier: "standard" },
  { row: "E", count: 25, tier: "standard" },
  { row: "F", count: 25, tier: "standard" },
  { row: "G", count: 25, tier: "standard" },
  { row: "H", count: 25, tier: "economy" },
  { row: "I", count: 25, tier: "economy" },
  { row: "J", count: 25, tier: "economy" },
];

export const TOTAL_SEATS = ROWS.reduce((n, r) => n + r.count, 0);

export function seatId(row: string, n: number) {
  return `${row}${n}`;
}

export function tierForSeat(id: string): Tier | null {
  const row = id.replace(/[0-9]/g, "");
  const def = ROWS.find((r) => r.row === row);
  return def ? TIERS[def.tier] : null;
}

export function priceForSeat(id: string): number {
  return tierForSeat(id)?.price ?? 0;
}

export function totalPrice(ids: string[]): number {
  return ids.reduce((sum, id) => sum + priceForSeat(id), 0);
}

/** Seats in a row, split into left/right blocks around the centre aisle. */
export function rowBlocks(def: RowDef): [number[], number[]] {
  const half = Math.floor(def.count / 2);
  const all = Array.from({ length: def.count }, (_, i) => i + 1);
  return [all.slice(0, half), all.slice(half)];
}