# F1 Grand Prix Screening — AWS Club VITB Ticketing Site

Race-day themed site for the AB02 screening: F1 info up front, a seat map with tier pricing,
UPI payment + screenshot upload, and a locked admin view for registrations.

No Lovable backend services. Everything server-side runs in a **Google Apps Script web app**
that you deploy from your own Google account, writing to your own Sheet and Drive folder.
The website itself is plain frontend code that talks to that one Apps Script URL.

## Pages

- `/` — Hero with F1 energy (dark carbon/asphalt base, racing red accent, bold display type,
  checkered-flag and speed-line motifs), event details (date, time, AB02), countdown, and a
  "Book Seats" CTA.
- `/f1` — What is F1: race weekend format (practice, qualifying, race), points system, teams
  and drivers, glossary (DRS, pit stop, safety car, undercut).
- `/book` — Seat selection + booking flow.
- `/booking/$code` — Confirmation page with booking code and seat list, shareable/keepable.
- `/admin` — Registrations dashboard behind a password gate.

## Seat map + pricing

Layout lives in one editable config file (`src/lib/seat-layout.ts`) so the exact AB02 rows
and seat counts drop in later. Starting layout totals 250 seats:

```text
   Tier         Rows      Seats/row   Price
   Premium      A-C       25          Rs 199
   Standard     D-G       25          Rs 149
   Economy      H-J       25          Rs  99
```

Each row splits around a centre aisle. Seat states: available, selected, taken (greyed,
unclickable). Legend plus a running total panel beside the map.

## Booking flow (guest, no login)

1. Pick seats — up to 6 per booking. Taken seats come from the Sheet via Apps Script.
2. Enter name, email, phone, registration number.
3. Payment step shows your UPI QR and UPI ID, then requires a payment-screenshot upload and
   the UPI transaction reference.
4. Submit — Apps Script takes a script lock, re-checks that none of the chosen seats are
   already taken, saves the screenshot to Drive, appends the booking row, and returns the
   booking code. If a seat was taken in the meantime nothing is written and the map refreshes
   with a clear message.

The map refetches availability periodically so two people booking at once see each other's
picks within seconds.

## Where the data lives (all yours)

- **Bookings** → your Google Sheet, tab `Bookings`: booking code, timestamp, name, email,
  phone, reg no., seats, tier breakdown, amount, UPI reference, screenshot link, status
  (pending / verified / rejected).
- **Payment screenshots** → your Google Drive folder, one image per booking named with the
  booking code; the Sheet row links to it.
- Nothing is stored on Lovable or any third-party service. You can open the Sheet and the
  Drive folder directly at any time.

## Admin

`/admin` asks for an admin password. The password is checked **inside Apps Script**, not in
the website code, so the browser never holds the secret and the page reveals nothing without
it. Give the password only to yourself (neel.24bce10303@vitbhopal.ac.in) and
neelpandeyofficial@gmail.com. Once in, admin can:

- See every registration: name, email, phone, reg no., seats, tier, amount, UPI reference,
  timestamp.
- Open each payment screenshot.
- Mark a booking verified or rejected (rejecting frees the seats back to the map).
- Search/filter and download a CSV.
- See totals: seats sold per tier, revenue, remaining capacity.

## Technical notes

- The Apps Script web app exposes a few actions: `availability`, `book`, `booking` (by code),
  `adminList`, `adminSetStatus`. Deployed as "Execute as me / Anyone", so no Google login is
  forced on attendees.
- I'll write the complete Apps Script code and give it to you to paste into
  script.google.com, along with step-by-step deploy instructions. You paste the resulting
  web-app URL into one config file in the project.
- Concurrency uses `LockService` inside Apps Script plus the pre-write re-check, so two
  simultaneous bookings for the same seat cannot both succeed.
- Screenshots are sent as base64 in the booking request and written to Drive by the script.
  Images only, size capped client-side and re-checked in the script.
- The admin session is kept only for the current browser tab; every admin request re-sends
  the password to Apps Script for verification, so nothing trusts the browser.
- Zod validation on every field client-side, plus validation again in the Apps Script.
  Booking codes are random and unguessable, so confirmation links cannot be enumerated.
- Honest limitations of a Sheets backend: Apps Script has daily execution quotas (generous
  for one 250-seat event) and requests are slower than a database, so the UI shows clear
  loading states.

## What I need from you

- A Google Sheet (I'll tell you the exact tab and column setup, or the script creates it).
- A Drive folder for screenshots, and its folder ID.
- Your UPI QR image and UPI ID (placeholder until then).
- The admin password you want.
- Event date and time for the countdown.
- Exact AB02 row/seat counts if they differ from the starting layout.
