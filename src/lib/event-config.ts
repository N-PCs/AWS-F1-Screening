/**
 * EDIT ME — event configuration.
 * Backend keys live in .env as VITE_FIREBASE_* (see firebase/README.md).
 */

/** Only @vitbhopal.ac.in accounts are allowed to sign in and book. */
export const ALLOWED_DOMAIN = "vitbhopal.ac.in";

/** Only these Google accounts can open /admin and read registrations. */
export const ADMIN_EMAILS = ["neel.24bce10303@vitbhopal.ac.in", "neelpandeyofficial@gmail.com"];

export const EVENT = {
  club: "AWS SBG VITB",
  title: "F1 Grand Prix Screening",
  venue: "Auditorium, AB-02",
  campus: "VIT Bhopal",
  /** ISO date-time of the screening (local). EDIT ME. */
  startsAt: "2026-09-13T17:30:00+05:30",
  dateLabel: "Sunday, 13 September",
  timeLabel: "6:30 PM IST",
  maxSeatsPerBooking: 10,
  /** When AB02-127 is locked, this many waitlist entries unlock it (organiser opens it manually). */
  waitlistCapacity: 100,
};

export const UPI = {
  /** EDIT ME — your UPI ID */
  id: "awssbg1@indianbnk",
  payeeName: "AWS SBG VITB",
  /**
   * EDIT ME — put your QR image at public/upi-qr.png (or set a full URL).
   * Until then a generated placeholder is shown.
   */
  qrImage: "/qr.png",
};
