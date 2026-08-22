/**
 * EDIT ME — exact AB-02 seat layout, split across two rooms.
 *
 * Each room has 16 rows (A..P), 18 seats per row, split into four
 * sections/blocks: 4 left | 8 middle | 2 chairs | 4 right.
 * Seat ids are room-prefixed so both rooms can share row letters:
 *   - Room 1 (AB02-127): R1-A1 … R1-P18
 *   - Room 2 (AB02-126): R2-A1 … R2-P18
 * Current total: 576 seats (288 per room).
 */
export type TierId = "redbull" | "ferrari" | "generalfanzone" | "aisle" | "premium" | "standard" | "economy";

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
    blurb: "R1, R2 & R3 left block (seats 1..4). Pure Red Bull Racing energy.",
  },
  ferrari: {
    id: "ferrari",
    name: "Ferrari Fanzone",
    price: 249,
    tone: "tier-ferrari",
    blurb: "R1, R2 & R3 right block (seats 15..18). Tifosi passion in full voice.",
  },
  generalfanzone: {
    id: "generalfanzone",
    name: "General Fanzone",
    price: 249,
    tone: "tier-generalfanzone",
    blurb: "R1 & R2 middle & chairs (seats 6..14). Premium front centre seats.",
  },
  aisle: {
    id: "aisle",
    name: "Normal Seats",
    price: 99,
    tone: "tier-aisle",
    blurb: "Seats e & n (seats 5 & 14) — flat ₹99 across every row.",
  },
  premium: {
    id: "premium",
    name: "Pit Lane",
    price: 179,
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

/**
 * AB02-126 (R2) has its own pricing.
 * Same tier names & tones, different prices:
 *   Pit Lane ₹199, Grandstand ₹149, all Fanzones ₹279, Back Straight ₹99.
 */
export const R2_TIERS: Record<TierId, Tier> = {
  redbull:        { ...TIERS.redbull, price: 279 },
  ferrari:        { ...TIERS.ferrari, price: 279 },
  generalfanzone: { ...TIERS.generalfanzone, price: 279 },
  aisle:          { ...TIERS.aisle, price: 99 },
  premium:        { ...TIERS.premium, price: 199 },
  standard:       { ...TIERS.standard, price: 149 },
  economy:        { ...TIERS.economy, price: 99 },
};

/** Look up a tier, returning R2-specific pricing when the seat is in AB02-126. */
function tierByRoom(tierId: TierId, room: RoomId): Tier {
  return room === "R2" ? R2_TIERS[tierId] : TIERS[tierId];
}

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

/** Rows in a single room (288 seats). */
export const ROOM_ROWS: Record<RoomId, RowDef[]> = {
  R1: [
    { row: "A", count: 18, tier: "premium" },
    { row: "B", count: 18, tier: "premium" },
    { row: "C", count: 18, tier: "premium" },
    { row: "D", count: 18, tier: "premium" },
    { row: "E", count: 18, tier: "premium" },
    { row: "F", count: 18, tier: "standard" },
    { row: "G", count: 18, tier: "standard" },
    { row: "H", count: 18, tier: "standard" },
    { row: "I", count: 18, tier: "standard" },
    { row: "J", count: 18, tier: "standard" },
    { row: "K", count: 18, tier: "standard" },
    { row: "L", count: 18, tier: "standard" },
    { row: "M", count: 18, tier: "standard" },
    { row: "N", count: 18, tier: "economy" },
    { row: "O", count: 18, tier: "economy" },
    { row: "P", count: 18, tier: "economy" },
  ],
  R2: [
    { row: "A", count: 18, tier: "premium" },
    { row: "B", count: 18, tier: "premium" },
    { row: "C", count: 18, tier: "premium" },
    { row: "D", count: 18, tier: "premium" },
    { row: "E", count: 18, tier: "premium" },
    { row: "F", count: 18, tier: "standard" },
    { row: "G", count: 18, tier: "standard" },
    { row: "H", count: 18, tier: "standard" },
    { row: "I", count: 18, tier: "standard" },
    { row: "J", count: 18, tier: "standard" },
    { row: "K", count: 18, tier: "standard" },
    { row: "L", count: 18, tier: "standard" },
    { row: "M", count: 18, tier: "standard" },
    { row: "N", count: 18, tier: "economy" },
    { row: "O", count: 18, tier: "economy" },
    { row: "P", count: 18, tier: "economy" },
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

/** Check if a seat number falls in the right block of its row (per rowBlocks logic). */
function isRightBlockSeat(room: RoomId, row: string, num: number): boolean {
  const def = ROOM_ROWS[room]?.find((r) => r.row === row);
  if (!def) return false;
  const [, , , right] = rowBlocks(def);
  return right.includes(num);
}

/** The display label shown on the seat button — lowercase letter (a–r). */
export function seatNum(id: string): string {
  const num = seatParts(id)?.num;
  if (num == null) return id;
  return String.fromCharCode(96 + num); // 1→a, 2→b, …, 18→r
}

/**
 * Human-readable seat ID for tickets and summaries: R{rowNumber}C{colNumber}.
 * e.g. internal "R1-A1" → "R1C1", "R2-P18" → "R16C18".
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
  const { room, row, num } = parts;

  // Aisle Special / Normal Seats: seat 5 (label 'e') and seat 14 (label 'n') across ALL rows → flat ₹99
  if (num === 5 || num === 14) {
    return tierByRoom("aisle", room);
  }

  // General Fanzone: Row R1 (Row 'A') & Row R2 (Row 'B'), middle & chairs seats 6..14
  if ((row === "A" || row === "B") && num >= 6 && num <= 14) {
    return tierByRoom("generalfanzone", room);
  }

  // Red Bull Fanzone: R1, R2 & R3 (rows A, B & C), Left block only (seats 1..4)
  if ((row === "A" || row === "B" || row === "C") && num >= 1 && num <= 4) {
    return tierByRoom("redbull", room);
  }

  // Ferrari Fanzone: R1, R2 & R3 (rows A, B & C), Right block only
  if (row === "A" || row === "B" || row === "C") {
    if (isRightBlockSeat(room, row, num)) {
      return tierByRoom("ferrari", room);
    }
  }

  // Pit Lane: remaining front row seats (rows A, B, C, D, E)
  if (row === "A" || row === "B" || row === "C" || row === "D" || row === "E") {
    return tierByRoom("premium", room);
  }

  // Grandstand: middle rows R6..R13 (rows F, G, H, I, J, K, L, M)
  if (["F", "G", "H", "I", "J", "K", "L", "M"].includes(row)) {
    return tierByRoom("standard", room);
  }

  // Back Straight: rear rows R14..R16 (rows N, O, P)
  return tierByRoom("economy", room);
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
 * Seats in a row, split into four sections.
 * Layout per row (18 seats total):
 *   - 4 left (seats 1..4)
 *   - 8 middle (seats 5..12)
 *   - 2 chairs (seats 13..14)
 *   - 4 right (seats 15..18)
 */
export function rowBlocks(def: RowDef): [number[], number[], number[], number[]] {
  const all = Array.from({ length: def.count }, (_, i) => i + 1);
  return [all.slice(0, 4), all.slice(4, 12), all.slice(12, 14), all.slice(14)];
}
