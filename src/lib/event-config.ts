/**
 * EDIT ME — event configuration.
 * Backend keys live in .env as VITE_FIREBASE_* (see firebase/README.md).
 */

/** Only @vitbhopal.ac.in accounts are allowed to sign in and book. */
export const ALLOWED_DOMAIN = "vitbhopal.ac.in";

/** Only these Google accounts can open /admin and read registrations. */
export const ADMIN_EMAILS = [
  "neel.24bce10303@vitbhopal.ac.in",
  "neelpandeyofficial@gmail.com",
];

export const EVENT = {
  club: "AWS Club VITB",
  title: "F1 Grand Prix Screening",
  venue: "Auditorium, AB-02",
  campus: "VIT Bhopal",
  /** ISO date-time of the screening (local). EDIT ME. */
  startsAt: "2026-09-06T17:30:00+05:30",
  dateLabel: "Sunday, 6 September",
  timeLabel: "5:30 PM IST",
  maxSeatsPerBooking: 6,
};

export const UPI = {
  /** EDIT ME — your UPI ID */
  id: "awsclubvitb@upi",
  payeeName: "AWS Club VITB",
  /**
   * EDIT ME — put your QR image at public/upi-qr.png (or set a full URL).
   * Until then a generated placeholder is shown.
   */
  qrImage: "/upi-qr.png",
};