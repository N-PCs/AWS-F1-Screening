/**
 * EDIT ME — exact AB-02 seat layout, split across two rooms.
 *
 * Each room has 10 rows (A..J), 25 seats per row, split around a centre
 * aisle. Seat ids are room-prefixed so both rooms can share row letters:
 *   - Room 1 (AB02-126): R1-A1 … R1-J25
 *   - Room 2 (AB02-127): R2-A1 … R2-J25
 * Current total: 500 seats (250 per room).
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

export type RoomId = "R1" | "R2";

export type Room = {
  id: RoomId;
  /** "Room 1" / "Room 2" — human label */
  label: string;
  /** AB02-126 / AB02-127 — the actual room number in AB-02 */
  name: string;
  /** tailwind token used to tint this room's booking flow */
  tone: string;
};

export const ROOMS: Room[] = [
  { id: "R1", label: "Room 1", name: "AB02-126", tone: "room-1" },
  { id: "R2", label: "Room 2", name: "AB02-127", tone: "room-2" },
];

export type RowDef = { row: string; count: number; tier: TierId };

/** Rows in a single room (250 seats). */
export const ROOM_ROWS: Record<RoomId, RowDef[]> = {
  R1: [
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
  ],
  R2: [
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
  ],
};

export const ROOM_SEAT_COUNT = (ROOM_ROWS.R1 ?? []).reduce((n, r) => n + r.count, 0);

/** Every seat across every room (for landing-page tier summaries). */
export const ROWS: RowDef[] = Object.values(ROOM_ROWS).flat();

export const TOTAL_SEATS = ROWS.reduce((n, r) => n + r.count, 0);

export function roomForId(id: RoomId): Room {
  return ROOMS.find((r) => r.id === id) ?? (ROOMS[0] as Room);
}

export function seatId(room: RoomId, row: string, n: number) {
  return `${room}-${row}${n}`;
}

export type SeatParts = { room: RoomId; row: string; num: number };

const SEAT_ID_RE = /^(R\d+)-([A-Z])(\d+)$/;

export function seatParts(id: string): SeatParts | null {
  const m = SEAT_ID_RE.exec(id);
  if (!m) return null;
  const room = m[1] as RoomId;
  if (!ROOM_ROWS[room]) return null;
  return { room, row: m[2] as string, num: Number(m[3]) };
}

/** The plain seat number shown on the seat button (drops room + row). */
export function seatNum(id: string): string {
  return seatParts(id)?.num.toString() ?? id;
}

export function roomForSeat(id: string): Room | null {
  const parts = seatParts(id);
  return parts ? roomForId(parts.room) : null;
}

export function tierForSeat(id: string): Tier | null {
  const parts = seatParts(id);
  if (!parts) return null;
  const def = (ROOM_ROWS[parts.room] ?? []).find((r) => r.row === parts.row);
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
