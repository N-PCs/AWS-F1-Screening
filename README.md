# 🏎️ AWS F1 Screening — Ticket Booking System

<div align="center">

![React](https://img.shields.io/badge/React-19-333333?style=for-the-badge&logo=react&logoColor=black&labelColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-333333?style=for-the-badge&logo=typescript&logoColor=white&labelColor=3178C6)
![TanStack](https://img.shields.io/badge/TanStack_Start-1.168-333333?style=for-the-badge&logo=tanstack&logoColor=white&labelColor=EF4444)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.2-333333?style=for-the-badge&logo=tailwindcss&logoColor=white&labelColor=06B6D4)
![Vite](https://img.shields.io/badge/Vite-8.0-333333?style=for-the-badge&logo=vite&logoColor=white&labelColor=646CFF)
![Firebase](https://img.shields.io/badge/Firebase-Auth_+_DB-333333?style=for-the-badge&logo=firebase&logoColor=black&labelColor=FFCA28)
![Cloudinary](https://img.shields.io/badge/Cloudinary-Upload-333333?style=for-the-badge&logo=cloudinary&logoColor=white&labelColor=3448C5)
![Zod](https://img.shields.io/badge/Zod-Validation-333333?style=for-the-badge&logo=zod&logoColor=white&labelColor=3068B7)
![Vercel](https://img.shields.io/badge/Vercel-Deploy-333333?style=for-the-badge&logo=vercel&logoColor=white&labelColor=000000)

<br />

A full-stack ticket booking system for the **F1 Grand Prix Screening** hosted by **AWS Club VITB** at VIT Bhopal. Real-time seat reservation with ACID Firestore transactions, Cloudinary-powered payment screenshot uploads, and a secure organiser verification dashboard.

**Live → [f1gp-aws.vercel.app](https://f1gp-aws.vercel.app)**

</div>

---

## Key Features

- **Real-Time Seat Reservation** — Interactive 500-seat layout across two rooms — **AB02-127 & AB02-128** (250 seats each) — with tiered seating (Pit Lane / Grandstand / Back Straight) and 8-minute atomic Firestore locks to prevent double-booking.
- **One Registration, One Booking** — Database-level uniqueness lock per registration number — no duplicate claims possible.
- **VIT Bhopal Only** — Sign-in restricted to `@vitbhopal.ac.in` Google accounts.
- **Cloudinary Screenshot Uploads** — Client-side compression + unsigned upload to Cloudinary; Firestore stores only the URL, not the image, keeping docs tiny and free-tier friendly.
- **Admin Dashboard** — Google-authenticated organiser panel to verify/reject bookings, view screenshot thumbnails, delete registrants, and export CSV with Cloudinary links.
- **F1-Themed UI** — Glassmorphic design with Tailwind CSS v4, shadcn/ui + Radix primitives, Lucide icons, and Sonner toast alerts.

---

## Workflow Diagram

```mermaid
flowchart TD
    User([Student]) --> Browser[Browser]

    subgraph Browser
        Auth[Sign in with Google\n@vitbhopal.ac.in]
        SeatGrid[Interactive 500-Seat Grid\nRooms AB02-127 & AB02-128]
        Checkout[Checkout + UPI Screenshot\ncompressed via canvas]
        Confirmation[Confirmation Page /booking/:code]
    end

    Browser -->|Sign in / Verify domain| FirebaseAuth[Firebase Auth]

    subgraph Server
        HoldSeat[Seat Hold\nFirestore lock 8 min]
        CreateBooking[createBooking\nACID Transaction]
        Organiser[Verify / Reject Booking]
    end

    Browser -->|Select seats| HoldSeat
    Browser -->|Upload screenshot| Cloudinary[(Cloudinary\nUnsigned Upload)]
    Cloudinary -->|secureUrl| Browser
    Browser -->|Form + screenshotUrl| CreateBooking

    HoldSeat -->|hold seats| Firestore[(Firestore\nSeats + Bookings + RLS)]
    CreateBooking -->|lock reg no + write booking| Firestore

    Admin([Organiser]) --> Organiser
    Organiser -->|verify → stays booked / reject → release seats| Firestore
    Organiser -->|export CSV with screenshot links| Firestore

    style User fill:#FBF9F4,stroke:#18181b,stroke-width:2px
    style FirebaseAuth fill:#FFCA28,color:#18181b,stroke:#18181b
    style Firestore fill:#FFCA28,color:#18181b,stroke:#18181b
    style Cloudinary fill:#3448C5,color:#fff,stroke:#18181b
    style Server fill:#8B5CF6,color:#fff,stroke:#18181b
```

### Student Booking Flow

```mermaid
sequenceDiagram
    actor Student
    participant App as AWS F1 (TanStack Start)
    participant Auth as Firebase Auth
    participant DB as Firestore
    participant CD as Cloudinary

    Student->>App: Open site → / (Landing)
    Student->>Auth: Sign in with Google (@vitbhopal.ac.in)
    Auth-->>App: Authenticated session

    Student->>App: Open /book → interactive seat grid
    App->>DB: Select seat → write 8-min hold
    DB-->>App: Hold confirmed (react-query re-polls)
    App->>DB: Reservation polled in real time
    DB-->>App: Seat availability updated

    Student->>App: Fill form (name, email, phone, reg no, UPI ref)
    Student->>App: Upload UPI payment screenshot
    App->>CD: compressImage -> uploadImage (unsigned preset)
    CD-->>App: { secureUrl, publicId }

    Student->>App: Confirm booking
    App->>DB: createBooking() -> atomic transaction
    DB->>DB: Book seats + lock reg no + write booking & screenshotUrl
    DB-->>App: Booking code
    App-->>Student: /booking/:code confirmation page
```

### Organiser Verification Flow

```mermaid
sequenceDiagram
    actor Organiser
    participant App as Admin Dashboard (TanStack Start)
    participant DB as Firestore
    participant CD as Cloudinary

    Organiser->>App: Sign in with Google
    App->>DB: Check UID against ADMIN_EMAILS
    DB-->>App: Grant / Deny admin access

    Organiser->>App: Open /admin
    App->>DB: list bookings + screenshot metadata
    DB-->>App: Bookings + thumbnails

    Organiser->>App: Preview payment screenshot
    App->>CD: Load secureUrl
    CD-->>App: Full image

    Organiser->>App: Verify booking
    App->>DB: verified = true (seats stay booked)
    DB-->>App: Status updated

    Organiser->>App: Reject booking
    App->>DB: Mark rejected + release seats back to grid
    DB-->>App: Seats freed for other students

    Organiser->>App: Export CSV
    App->>DB: Download bookings + Cloudinary links
    App-->>Organiser: CSV file
```

### Auth Flow

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant Auth as Firebase Auth

    Note over User,Auth: Sign In
    User->>Browser: Click "Sign in with Google"
    Browser->>Auth: signInWithPopup()
    Auth-->>Browser: Token + user profile
    Browser->>Browser: Enforce @vitbhopal.ac.in domain check

    Note over User,Auth: Admin Gate
    User->>Browser: Navigate to /admin
    Browser->>Auth: Read Google account (admin email list)
    Auth-->>Browser: Allowed -> dashboard / Denied -> redirect
```

---

## Tech Stack

| Layer | Technology | Free Tier |
|-------|-----------|-----------|
| Framework | [TanStack Start](https://tanstack.com/start) + React 19 + Tailwind v4 | Yes |
| UI | [shadcn/ui](https://ui.shadcn.com) + Radix primitives | Yes |
| Auth + Database | [Firebase](https://firebase.google.com) (Google OAuth, Firestore, security rules) | 1 GB storage, 50k reads/day |
| Image Upload | [Cloudinary](https://cloudinary.com) (unsigned preset, client-side compress) | 25 GB storage & bandwidth/mo |
| Validation | [Zod](https://zod.dev) + [React Hook Form](https://react-hook-form.com) | Free |
| State | [@tanstack/react-query](https://tanstack.com/query) | Free |
| Build | [Vite 8](https://vitejs.dev) | Free |
| Hosting | [Vercel](https://vercel.com) (Hobby tier) | 100 GB bandwidth/mo |

**Total cost: $0** for personal use.

---

## Repository Structure

```
AWS-F1-Screening/
├── firebase/
│   ├── firestore.rules           # Security rules (auth, transactions, admin gating)
│   └── README.md                 # Firebase + Cloudinary setup walkthrough
├── src/
│   ├── components/
│   │   ├── f1/                   # Domain components (SeatMap, AuthGate, UserBadge)
│   │   └── ui/                   # shadcn/ui primitives (Button, Card, Dialog, etc.)
│   ├── hooks/                    # Custom hooks (useMobile)
│   ├── lib/
│   │   ├── auth-context.tsx      # Firebase Auth React Context
│   │   ├── booking-api.ts        # Firestore transactions, booking CRUD, screenshot helpers
│   │   ├── cloudinary.ts         # Cloudinary unsigned upload client
│   │   ├── event-config.ts       # Event metadata, admin emails, UPI config
│   │   ├── firebase.ts           # Firebase app initialization
│   │   ├── seat-layout.ts        # 2-room layout (AB02-127/128), tiers, pricing
│   │   ├── error-capture.ts      # Centralized error logging
│   │   └── error-page.ts         # Error boundary UI
│   ├── routes/
│   │   ├── __root.tsx            # App shell, Header, AuthGate, Toaster
│   │   ├── index.tsx             # Landing page / hero section
│   │   ├── f1.tsx                # F1 theme / event info page
│   │   ├── book.tsx              # Seat selection + checkout + Cloudinary upload
│   │   ├── admin.tsx             # Organiser dashboard (verify / reject / delete / CSV)
│   │   └── booking.$code.tsx     # Booking confirmation status page
│   └── styles.css                # Tailwind CSS v4 + custom F1 theme
├── .env.example                  # Environment variables template
├── components.json               # shadcn/ui config
├── package.json
└── vite.config.ts
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **npm** >= 9 (or pnpm / yarn)
- A **Firebase** project (Firestore + Google Auth enabled)
- A **Cloudinary** account (free plan)

### 1. Clone & Install

```bash
git clone https://github.com/N-PCs/AWS-F1-Screening.git
cd AWS-F1-Screening
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Fill in `.env` with your credentials:

```env
# Firebase (from Firebase console → Project settings → Your apps)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_SENDER_ID=

# Cloudinary (from Cloudinary dashboard)
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

### 3. Set Up Firebase

1. Create a Firestore database (Standard edition, `asia-south1`, production mode)
2. Enable Google sign-in (Authentication → Sign-in method → Google)
3. Paste `firebase/firestore.rules` into the Rules tab → **Publish**
4. Add your domain to Authorized Domains

> Full walkthrough: [`firebase/README.md`](firebase/README.md)

### 4. Set Up Cloudinary

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Note your **Cloud name** → set as `VITE_CLOUDINARY_CLOUD_NAME`
3. Create an **unsigned** upload preset (Settings → Upload → Upload presets → Add)
4. Set the preset name as `VITE_CLOUDINARY_UPLOAD_PRESET`

### 5. Start Dev Server

```bash
npm run dev
```

Open `http://localhost:3000`.

### Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Production build (Vercel preset) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for branch naming, code standards, and PR guidelines.

<div align="center">

<a href="https://github.com/N-PCs/AWS-F1-Screening/graphs/contributors">
    <img src="https://contrib.rocks/image?repo=naiteekpapriwal/AWS-F1-Screening" />
</a>

</div>

---

## License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.
