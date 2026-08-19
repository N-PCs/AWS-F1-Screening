/**
 * EDIT ME — exact AB-02 seat layout, split across two rooms.
 *
 * Each room has 16 rows (A..P), 17 seats per row, split into three
 * blocks: 4 left | gap | 9 centre | gap | 4 right.
 * Seat ids are room-prefixed so both rooms can share row letters:
 *   - Room 1 (AB02-127): R1-A1 … R1-P17
 *   - Room 2 (AB02-126): R2-A1 … R2-P17
 * Current total: 544 seats (272 per room).
 */
export type TierId = "redbull" | "ferrari" | "premium" | "standard" | "economy";

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
  redbull: {
    id: "redbull",
    name: "Red Bull Fanzone",
    price: 249,
    tone: "tier-redbull",
    blurb: "R1, R2 & R3 left block. Pure Red Bull Racing energy.",
  },
  ferrari: {
    id: "ferrari",
    name: "Ferrari Fanzone",
    price: 249,
    tone: "tier-ferrari",
    blurb: "R1, R2 & R3 right block. Tifosi passion in full voice.",
  },
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
    price: 129,
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
  { id: "R1", label: "Room 1", name: "AB02-127", tone: "room-1" },
  { id: "R2", label: "Room 2", name: "AB02-126", tone: "room-2" },
];

export type RowDef = { row: string; count: number; tier: TierId };

/** Rows in a single room (272 seats). */
export const ROOM_ROWS: Record<RoomId, RowDef[]> = {
  R1: [
    { row: "A", count: 17, tier: "premium" },
    { row: "B", count: 17, tier: "premium" },
    { row: "C", count: 17, tier: "premium" },
    { row: "D", count: 17, tier: "premium" },
    { row: "E", count: 17, tier: "premium" },
    { row: "F", count: 17, tier: "standard" },
    { row: "G", count: 17, tier: "standard" },
    { row: "H", count: 17, tier: "standard" },
    { row: "I", count: 17, tier: "standard" },
    { row: "J", count: 17, tier: "standard" },
    { row: "K", count: 17, tier: "standard" },
    { row: "L", count: 17, tier: "standard" },
    { row: "M", count: 17, tier: "standard" },
    { row: "N", count: 17, tier: "economy" },
    { row: "O", count: 17, tier: "economy" },
    { row: "P", count: 17, tier: "economy" },
  ],
  R2: [
    { row: "A", count: 17, tier: "premium" },
    { row: "B", count: 17, tier: "premium" },
    { row: "C", count: 17, tier: "premium" },
    { row: "D", count: 17, tier: "premium" },
    { row: "E", count: 17, tier: "premium" },
    { row: "F", count: 17, tier: "standard" },
    { row: "G", count: 17, tier: "standard" },
    { row: "H", count: 17, tier: "standard" },
    { row: "I", count: 17, tier: "standard" },
    { row: "J", count: 17, tier: "standard" },
    { row: "K", count: 17, tier: "standard" },
    { row: "L", count: 17, tier: "standard" },
    { row: "M", count: 17, tier: "standard" },
    { row: "N", count: 17, tier: "economy" },
    { row: "O", count: 17, tier: "economy" },
    { row: "P", count: 17, tier: "economy" },
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

/** The display label shown on the seat button — lowercase letter (a–q). */
export function seatNum(id: string): string {
  const num = seatParts(id)?.num;
  if (num == null) return id;
  return String.fromCharCode(96 + num); // 1→a, 2→b, …, 17→q
}

/**
 * Human-readable seat ID for tickets and summaries: R{rowNumber}C{colNumber}.
 * e.g. internal "R1-A1" → "R1C1", "R2-P16" → "R16C16".
 */
export function seatDisplayId(id: string): string {
  const parts = seatParts(id);
  if (!parts) return id;
  const rowNum = parts.row.charCodeAt(0) - 64; // A→1, B→2, …, P→16
  return `R${rowNum}C${parts.num}`;
}

export function roomForSeat(id: string): Room | null {
  const parts = seatParts(id);
  return parts ? roomForId(parts.room) : null;
}

export function tierForSeat(id: string): Tier | null {
  const parts = seatParts(id);
  if (!parts) return null;
  const { row, num } = parts;

  // Red Bull Fanzone: R1, R2 & R3 (rows A, B & C), Left block only (seats 1..4) -> ₹249
  if ((row === "A" || row === "B" || row === "C") && num >= 1 && num <= 4) {
    return TIERS.redbull;
  }

  // Ferrari Fanzone: R1, R2 & R3 (rows A, B & C), Right block only (seats 13..16) -> ₹249
  if ((row === "A" || row === "B" || row === "C") && num >= 13 && num <= 16) {
    return TIERS.ferrari;
  }

  // Pit Lane: remaining front row seats (rows A, B, C, D, E) -> ₹199
  if (row === "A" || row === "B" || row === "C" || row === "D" || row === "E") {
    return TIERS.premium;
  }

  // Grandstand: middle rows R6..R13 (rows F, G, H, I, J, K, L, M) -> ₹99
  if (["F", "G", "H", "I", "J", "K", "L", "M"].includes(row)) {
    return TIERS.standard;
  }

  // Back Straight: rear rows R14..R16 (rows N, O, P) -> ₹85
  return TIERS.economy;
}

export function priceForSeat(id: string): number {
  return tierForSeat(id)?.price ?? 0;
}

export function totalPrice(ids: string[]): number {
  return ids.reduce((sum, id) => sum + priceForSeat(id), 0);
}

/** Convert row letter (A–P) to display label (R1–R16). */
export function rowDisplayLabel(row: string): string {
  return `R${row.charCodeAt(0) - 64}`;
}

/**
 * Seats in a row, split into three blocks: 4 left | 9 centre | 4 right.
 * Matches the physical AB-02 auditorium aisle layout.
 */
export function rowBlocks(def: RowDef): [number[], number[], number[]] {
  const all = Array.from({ length: def.count }, (_, i) => i + 1);
  return [all.slice(0, 4), all.slice(4, 13), all.slice(13, 17)];
}
