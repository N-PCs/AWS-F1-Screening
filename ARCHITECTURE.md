# 🏛️ Technical Architecture & System Design

This document details the architectural design, data models, state machines, and security mechanisms powering the **AWS F1 Screening Ticket Booking System**.

---

## 🏗️ System Overview

```mermaid
graph TD
    Client[Browser / React 19 Frontend]
    TanStack[TanStack Start SSR & Router]
    Auth[Firebase Auth - Google OAuth]
    Firestore[(Firebase Firestore DB)]
    Admin[Admin Verification Dashboard]

    Client -->|Renders Pages & Seat Grid| TanStack
    Client -->|Google Sign-In @vitbhopal.ac.in| Auth
    Client -->|Atomic Transactions: Holds & Bookings| Firestore
    Admin -->|Review & Verify / Reject Bookings| Firestore
```

The system is designed as a client-first, serverless web application using **TanStack Start** (React 19, TypeScript, Vite) connected directly to **Firebase Firestore** and **Firebase Auth**.

---

## 🗄️ Firestore Database Schema

Firestore collections are organized into 4 primary collections:

```
Firestore Root
├── 📁 seats/
│   └── 📄 {seatId}              (e.g., "A1", "B7")
│       ├── seatId: string       (e.g. "A1")
│       ├── row: string          (e.g. "A")
│       ├── number: number       (e.g. 1)
│       ├── tier: string         ("VIP" | "Executive" | "General")
│       ├── price: number        (e.g. 150)
│       ├── status: string       ("available" | "held" | "booked")
│       ├── heldBy: string       (User UID / RegNo)
│       ├── heldAt: Timestamp    (Creation time of hold)
│       └── expiresAt: Timestamp (8 minutes from heldAt)
│
├── 📁 bookings/
│   └── 📄 {bookingCode}         (e.g., "F1-X8K9L2")
│       ├── bookingCode: string  (Unique alphanumeric code)
│       ├── name: string
│       ├── email: string        (Must be @vitbhopal.ac.in)
│       ├── regNo: string        (Student registration number)
│       ├── phone: string
│       ├── seats: string[]      (Array of seat IDs, e.g. ["A1", "A2"])
│       ├── totalAmount: number
│       ├── upiRef: string       (12-digit transaction reference)
│       ├── screenshotUrl: string (Base64 JPEG data URL or Storage link)
│       ├── status: string       ("pending" | "confirmed" | "rejected")
│       ├── createdAt: Timestamp
│       └── verifiedBy: string   (Admin email upon review)
│
├── 📁 registrations/
│   └── 📄 {regNo}               (e.g., "24BCE10303")
│       ├── regNo: string
│       ├── bookingCode: string
│       ├── email: string
│       └── createdAt: Timestamp
│
└── 📁 screenshots/
    └── 📄 {bookingCode}
        ├── data: string         (Compressed JPEG canvas payload)
        └── uploadedAt: Timestamp
```

---

## ⚡ Concurrency & Transaction Flow

To guarantee zero double-bookings under heavy concurrent traffic during ticket launches, the system implements **ACID Transactions**:

```mermaid
sequenceDiagram
    autonumber
    actor Student
    participant UI as Seat Grid UI
    participant FS as Firestore Database
    actor Admin

    Student->>UI: Select Seats (e.g. A1, A2) & Click "Hold Seats"
    UI->>FS: Firestore Transaction 1: Lock Seats
    FS-->>FS: Read seat status & check expiresAt
    alt Any seat is booked or held by another user
        FS-->>UI: Abort & Fail Transaction
        UI-->>Student: Display error "Seats are no longer available"
    else All seats available or expired
        FS-->>FS: Update seat status = "held", set expiresAt = NOW + 8 mins
        FS-->>UI: Transaction Succeeded
        UI-->>Student: Start 8-minute countdown timer & show checkout form
    end

    Student->>UI: Fill form, submit UPI ref & screenshot
    UI->>FS: Firestore Transaction 2: Finalize Booking
    FS-->>FS: Check if registrations/{regNo} exists
    alt Registration already used
        FS-->>UI: Abort & Fail Transaction
        UI-->>Student: Display error "Registration number already used"
    else Registration new
        FS-->>FS: 1. Set seats status = "booked"<br/>2. Create bookings/{code}<br/>3. Create registrations/{regNo}
        FS-->>UI: Booking Created ("pending")
        UI-->>Student: Show Booking Confirmation Code
    end

    Admin->>FS: Review pending bookings in /admin
    alt Admin Approves
        Admin->>FS: Update status = "confirmed"
    else Admin Rejects
        Admin->>FS: Update status = "rejected", release seats back to "available"
    end
```

---

## 🛡️ Security & Role-Based Access Control

1. **Authentication**:
   - Google Sign-In enforces the domain restriction `ALLOWED_DOMAIN` (`vitbhopal.ac.in`).
2. **Authorization (`/admin`)**:
   - Organizers are verified against `ADMIN_EMAILS` defined in [`src/lib/event-config.ts`](file:///src/lib/event-config.ts) and backed up by `firebase/firestore.rules`.
3. **Database Security Rules**:
   - Participants can only create pending bookings for held seats during active transactions.
   - Only authenticated organizers can update booking statuses or read the `screenshots` collection.

---

## 🧰 Performance & Optimization Techniques

- **Canvas Screenshot Compression**: Payment proof images are compressed in browser memory to JPEG with quality scale ~0.65 and max width 800px before transit, guaranteeing fast uploads and zero cloud storage expenses.
- **Optimistic UI Updates & React Query**: Seat selections and status badges update dynamically with background sync.
- **Single-Pass Seat Pricing**: Layout and pricing tiers are calculated from a unified configuration map in [`src/lib/seat-layout.ts`](file:///src/lib/seat-layout.ts).
