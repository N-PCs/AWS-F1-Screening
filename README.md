# 🏎️ AWS F1 Screening - Ticket Booking System

[![TanStack Start](https://img.shields.io/badge/Framework-TanStack%20Start-ff4154?style=flat-square&logo=react)](https://tanstack.com/router)
[![React 19](https://img.shields.io/badge/React-19.0-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Bundler-Vite%206-646cff?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Styling-Tailwind%20v4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Backend-Firebase%20Firestore-ffca28?style=flat-square&logo=firebase)](https://firebase.google.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

A full-stack, high-performance ticket booking web application designed for the **F1 Grand Prix Screening** event hosted by **AWS Club VITB**. Built on modern full-stack web standards, the system delivers real-time seat reservation, double-booking prevention using Firebase Firestore ACID transactions, instant client-side image compression for UPI payment screenshots, and a secure Google-authenticated admin verification dashboard.

---

## 🌟 Key Features

- **⚡ Real-Time Seat Reservation with Locks**: Interactive screening hall seating grid with tiered pricing (VIP, Executive, General). Seats are temporarily locked for 8 minutes during checkout using atomic Firestore transactions to avoid double bookings.
- **🔒 Single Booking Enforcement**: Enforces a strict "one booking per registration number" lock at the database level to prevent duplicate ticket claims.
- **🎓 Email Domain Verification**: Restricts participant authentication and ticket booking exclusively to `@vitbhopal.ac.in` Google accounts.
- **📸 Compressed UPI Screenshot Uploads**: Client-side image canvas compression reduces payment verification screenshots down to ~80KB before storing, ensuring high speed and remaining well within free tier limits.
- **🛡️ Secure Admin Verification Dashboard**: Role-based access control allowing designated organizers to review incoming bookings, inspect payment screenshots, approve bookings, or reject invalid claims (releasing seats back to the pool).
- **🎨 Glassmorphic Modern UI**: Dynamic F1-themed UI built with Tailwind CSS v4, Lucide icons, Radix UI primitives, smooth micro-interactions, and toast alerts via Sonner.

---

## 🛠️ Tech Stack & Architecture

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | [TanStack Start](https://tanstack.com/router/latest/docs/framework/react/overview) | Full-stack SSR framework powered by TanStack Router |
| **UI Library** | [React 19](https://react.dev/) | Component architecture with modern hooks |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) & Radix UI | Modern utility-first styling with accessible UI primitives |
| **Database & Auth** | [Firebase Firestore](https://firebase.google.com/docs/firestore) & Auth | Atomic transaction locks and OAuth Google Sign-In |
| **State & API** | [@tanstack/react-query](https://tanstack.com/query) | Async state fetching, caching, and cache invalidation |
| **Validation** | [Zod](https://zod.dev/) & React Hook Form | Schema validation for forms and payload integrity |
| **Build System** | [Vite 6](https://vitejs.dev/) | Instant HMR dev server and optimized production bundler |

---

## 📁 Repository Structure

```
AWS-F1-Screening/
├── firebase/
│   ├── firestore.rules       # Security rules enforcing auth & transaction constraints
│   └── README.md             # Firebase project & database setup guide
├── src/
│   ├── components/
│   │   ├── f1/               # Core F1 domain components (SeatMap, AuthGate, UserBadge)
│   │   └── ui/               # Reusable UI primitives (Button, Card, Dialog, Toast, etc.)
│   ├── hooks/                # Custom React hooks (useAuth, useSeatSelection)
│   ├── lib/
│   │   ├── auth-context.tsx  # React Context for Firebase Google Auth state
│   │   ├── booking-api.ts    # Firestore transaction logic & database operations
│   │   ├── error-capture.ts  # Centralized error logging & diagnostic utilities
│   │   ├── event-config.ts   # Main event metadata, admin emails & UPI config
│   │   ├── firebase.ts       # Firebase app initialization & SDK export
│   │   └── seat-layout.ts    # Seat tier definitions, prices & layout geometry
│   ├── routes/
│   │   ├── __root.tsx        # Top-level app shell with Header, AuthGate & Toaster
│   │   ├── index.tsx         # Landing page / hero section
│   │   ├── book.tsx          # Seat selection & checkout flow page
│   │   ├── admin.tsx         # Organizer verification dashboard
│   │   └── booking.$code.tsx # Ticket view & booking confirmation status
│   ├── routeTree.gen.ts      # Auto-generated TanStack Router tree
│   └── styles.css            # Tailwind CSS v4 directives & custom utilities
├── .env.example              # Environment variables template
├── package.json              # Dependencies and scripts
└── vite.config.ts            # Vite & TanStack Router configuration
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed on your machine:
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher (or `pnpm` / `yarn`)

---

### Step-by-Step Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/AWS-Club-VITB/AWS-F1-Screening.git
   cd AWS-F1-Screening
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to create a `.env` file:
   ```bash
   cp .env.example .env
   ```

   Fill in your Firebase project credentials in `.env`:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

   > 💡 Refer to [firebase/README.md](file:///firebase/README.md) for step-by-step instructions on setting up your Firebase project and deploying Security Rules.

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` (or the URL printed in the terminal) in your browser.

---

## 📜 Available NPM Scripts

- `npm run dev` — Launches the Vite development server with Hot Module Replacement (HMR).
- `npm run build` — Builds the application for production deployment.
- `npm run preview` — Locally previews the compiled production build.
- `npm run lint` — Runs ESLint across all TypeScript files.
- `npm run format` — Formats source code using Prettier.

---

## ⚙️ Configuration & Customization

All event-specific metadata is centralized in [`src/lib/event-config.ts`](file:///src/lib/event-config.ts):

```typescript
export const ALLOWED_DOMAIN = "vitbhopal.ac.in"; // Domain restriction for sign-in

export const ADMIN_EMAILS = [
  "neel.24bce10303@vitbhopal.ac.in",
  "neelpandeyofficial@gmail.com",
]; // Organizers authorized to open /admin

export const EVENT = {
  club: "AWS Club VITB",
  title: "F1 Grand Prix Screening",
  venue: "Auditorium, AB-02",
  campus: "VIT Bhopal",
  startsAt: "2026-09-06T17:30:00+05:30",
  dateLabel: "Sunday, 6 September",
  timeLabel: "5:30 PM IST",
  maxSeatsPerBooking: 10,
};
```

To modify seat grid layout or tier pricing, edit [`src/lib/seat-layout.ts`](file:///src/lib/seat-layout.ts).

---

## 🤝 Contributing

We welcome contributions! Please refer to [CONTRIBUTING.md](file:///CONTRIBUTING.md) for code standards, branch naming conventions, and pull request guidelines.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](file:///LICENSE) file for details.
