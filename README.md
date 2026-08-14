# 🏎️ AWS F1 Screening — Ticket Booking System

<div align="center">

![React 19](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=white)
![TanStack Start](https://img.shields.io/badge/TanStack-Start-ff4154?style=flat&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?style=flat&logo=tailwindcss&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=flat&logo=firebase&logoColor=black)
![Cloudinary](https://img.shields.io/badge/Cloudinary-Image%20Upload-3448C5?style=flat&logo=cloudinary&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat&logo=typescript&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-Validation-3068B7?style=flat&logo=zod&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat)

<br />

A full-stack ticket booking system for the **F1 Grand Prix Screening** hosted by **AWS Club VITB** at VIT Bhopal. Real-time seat reservation with ACID transactions, Cloudinary-powered payment screenshot uploads, and a secure organiser verification dashboard.

**Live → [your-deployed-domain.vercel.app](https://your-deployed-domain.vercel.app)**

</div>

---

## 🌟 Key Features

- **⚡ Real-Time Seat Reservation** — Interactive 250-seat grid (Pit Lane / Grandstand / Back Straight tiers) with 8-minute atomic Firestore locks to prevent double-booking.
- **🔒 One Registration, One Booking** — Database-level uniqueness lock per registration number — no duplicate claims possible.
- **🎓 VIT Bhopal Only** — Sign-in restricted to `@vitbhopal.ac.in` Google accounts.
- **📸 Cloudinary Screenshot Uploads** — Client-side compression + unsigned upload to Cloudinary; Firestore stores only the URL, not the image, keeping docs tiny and free-tier friendly.
- **🛡️ Admin Dashboard** — Google-authenticated organiser panel to verify/reject bookings, view screenshot thumbnails, delete registrants, and export CSV with Cloudinary links.
- **🎨 F1-Themed UI** — Glassmorphic design with Tailwind CSS v4, Radix UI, Lucide icons, and Sonner toast alerts.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | [TanStack Start](https://tanstack.com/router) | Full-stack SSR framework powered by TanStack Router |
| **UI** | [React 19](https://react.dev/) + [Radix UI](https://www.radix-ui.com/) | Component architecture with accessible primitives |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Utility-first CSS with custom F1 theme tokens |
| **Database** | [Firebase Firestore](https://firebase.google.com/docs/firestore) | Atomic transactions, seat locks, registration uniqueness |
| **Auth** | [Firebase Auth](https://firebase.google.com/docs/auth) (Google OAuth) | Domain-restricted sign-in, organiser role gating |
| **Image Upload** | [Cloudinary](https://cloudinary.com/) (unsigned preset) | Payment screenshot hosting, URL-linked to Firestore |
| **State** | [@tanstack/react-query](https://tanstack.com/query) | Real-time availability polling, cache management |
| **Validation** | [Zod](https://zod.dev/) + React Hook Form | Schema validation for attendee forms |
| **Build** | [Vite 6](https://vitejs.dev/) | HMR dev server, production bundler |
| **Deploy** | [Vercel](https://vercel.com/) | Edge SSR, automatic previews |

---

## 📁 Repository Structure

```
AWS-F1-Screening/
├── firebase/
│   ├── firestore.rules           # Security rules (auth, transactions, admin gating)
│   └── README.md                 # Firebase + Cloudinary setup walkthrough
├── src/
│   ├── components/
│   │   ├── f1/                   # Domain components (SeatMap, AuthGate, UserBadge)
│   │   └── ui/                   # Reusable primitives (Button, Card, Dialog, etc.)
│   ├── hooks/                    # Custom hooks (useMobile)
│   ├── lib/
│   │   ├── auth-context.tsx      # Firebase Auth React Context
│   │   ├── booking-api.ts        # Firestore transactions, booking CRUD, screenshot helpers
│   │   ├── cloudinary.ts         # Cloudinary unsigned upload client
│   │   ├── event-config.ts       # Event metadata, admin emails, UPI config
│   │   ├── firebase.ts           # Firebase app initialization
│   │   ├── seat-layout.ts        # 250-seat grid, tiers, pricing
│   │   └── error-capture.ts      # Centralized error logging
│   ├── routes/
│   │   ├── __root.tsx            # App shell, Header, AuthGate, Toaster
│   │   ├── index.tsx             # Landing page / hero section
│   │   ├── book.tsx              # Seat selection + checkout + Cloudinary upload
│   │   ├── admin.tsx             # Organiser dashboard (verify / reject / delete / CSV)
│   │   └── booking.$code.tsx     # Booking confirmation status page
│   └── styles.css                # Tailwind CSS v4 + custom F1 theme
├── .env.example                  # Environment variables template
├── package.json
└── vite.config.ts
```

---

## 🔄 Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        STUDENT FLOW                                │
└─────────────────────────────────────────────────────────────────────┘

  / (Landing)
       │
       ▼
  Sign in with @vitbhopal.ac.in Google account (Firebase Auth)
       │
       ▼
  /book ──────────────────────────────────────────────────────┐
  │  1. Real-time seat map (react-query polls Firestore)     │
  │  2. Select seats (max 10) ──► Firestore holds (8 min)    │
  │  3. Fill form (name, email, phone, reg no, UPI ref)      │
  │  4. Upload UPI screenshot ──► compressImage (canvas)      │
  │     ──► uploadImage (Cloudinary unsigned preset)          │
  │     ──► returns { secureUrl, publicId }                   │
  │  5. Confirm booking ──► createBooking()                   │
  └─────────────────────────────────────┬─────────────────────┘
                                        │
                                        ▼
                              Firestore Transaction
                    ┌─────────────────────────────────┐
                    │  • seats/<id>  → status: booked  │
                    │  • registrations/<regNo> → code  │
                    │  • bookings/<code> → details     │
                    │    + screenshotUrl (Cloudinary)   │
                    │  • screenshots/<code> → URL       │
                    └─────────────────────────────────┘
                                        │
                                        ▼
                              /booking/$code ──► Confirmation page


┌─────────────────────────────────────────────────────────────────────┐
│                        ORGANISER FLOW                               │
└─────────────────────────────────────────────────────────────────────┘

  /admin ──► Sign in with Google (must be in ADMIN_EMAILS)
       │
       ▼
  Dashboard
  ├─ View all bookings (thumbnail + Cloudinary URL)
  ├─ Search / filter by name, email, reg no, seat, UPI ref
  ├─ Verify  ──► marks booking verified (seats stay booked)
  ├─ Reject  ──► marks rejected (seats released back to map)
  ├─ Delete  ──► full removal (booking + reg lock + seats freed)
  └─ Export CSV ──► includes Cloudinary screenshot URLs
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9 (or pnpm / yarn)
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

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for branch naming, code standards, and PR guidelines.

<div align="center">

<!-- contributor avatars — add <img> tags for each contributor -->

<a href="https://github.com/N-PCs/AWS-F1-Screening/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=N-PCs/AWS-F1-Screening" />
</a>

</div>

---

## 📄 License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.
