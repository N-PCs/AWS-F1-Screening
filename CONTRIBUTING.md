# 🛠️ Contributing to AWS F1 Screening

First off, thank you for considering contributing to the **AWS F1 Screening Ticket Booking System**! Projects like this rely on community contributions to stay fast, secure, and reliable during high-traffic ticket launches.

This document contains guidelines and standards to help you get started quickly and efficiently.

---

## 📋 Table of Contents

1. [Code of Conduct](#-code-of-conduct)
2. [Getting Started](#-getting-started)
3. [Development Workflow](#-development-workflow)
4. [Project Conventions & Rules](#-project-conventions--rules)
   - [TanStack Start Routing](#tanstack-start-routing)
   - [Firebase Firestore Security & Data Integrity](#firebase-firestore-security--data-integrity)
   - [Component & UI Architecture](#component--ui-architecture)
   - [State & Data Fetching](#state--data-fetching)
5. [Code Quality & Linting](#-code-quality--linting)
6. [Submitting a Pull Request](#-submitting-a-pull-request)

---

## 🤝 Code of Conduct

- Be respectful and constructive in all discussions, issues, and pull requests.
- Focus on what is best for the overall project security, performance, and user experience.
- Maintain confidentiality regarding internal organizer keys, secret tokens, or private configuration.

---

## 🚀 Getting Started

1. **Fork the repository** on GitHub.
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/AWS-F1-Screening.git
   cd AWS-F1-Screening
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Create a local `.env` file** based on `.env.example` (see [firebase/README.md](file:///firebase/README.md) for database setup).
5. **Start the local server**:
   ```bash
   npm run dev
   ```

---

## 🌿 Development Workflow

### Branch Naming Convention

Use descriptive branch names with appropriate prefixes:

- `feat/feature-description` (e.g., `feat/qr-code-download`)
- `fix/bug-description` (e.g., `fix/seat-timer-expiration`)
- `docs/documentation-update` (e.g., `docs/update-readme`)
- `refactor/component-name` (e.g., `refactor/booking-api`)

### Commit Messages

Follow clear, imperative commit messages:

- `feat: add ticket download option on booking confirmation page`
- `fix: prevent race condition in seat release transaction`
- `style: refine glassmorphic card styling on seat grid`
- `docs: update setup steps in CONTRIBUTING.md`

---

## 📐 Project Conventions & Rules

### TanStack Start Routing

This project uses **TanStack Start file-based routing**:

- **Do NOT create** Next.js style directories like `pages/`, `app/`, or `src/routes/_app/`.
- All routes live in `src/routes/`.
- `src/routes/__root.tsx` is the application shell (Header, Navigation, Toaster).
- Routes automatically compile into `src/routeTree.gen.ts`. Do **NOT** manually edit `routeTree.gen.ts`.
- Dynamic parameters use bare `$` (e.g., `src/routes/booking.$code.tsx` maps to `/booking/:code`).

### Firebase Firestore Security & Data Integrity

- **ACID Transactions**: Any operation involving seat reservation, registration numbers, or booking statuses MUST use Firestore `runTransaction()` to prevent race conditions.
- **Security Rules**: When introducing new collections or fields, update [`firebase/firestore.rules`](file:///firebase/firestore.rules) to maintain strict access control.
- **Client-Side Image Optimization**: Payments screenshots MUST be compressed using client-side canvas rendering before uploading to Firestore to stay within free-tier payload limits.

### Component & UI Architecture

- **UI Primitives**: Reusable atomic UI components belong in [`src/components/ui/`](file:///src/components/ui/) (Buttons, Cards, Dialogs, Inputs, Toasts).
- **Domain Components**: Event-specific domain components belong in [`src/components/f1/`](file:///src/components/f1/) (e.g., `SeatMap.tsx`, `AuthGate.tsx`).
- **Styling**: Use **Tailwind CSS v4** utility classes. Avoid inline style objects unless calculating dynamic layout coordinates.
- **Icons**: Import vector icons exclusively from `lucide-react`.

### State & Data Fetching

- Use `@tanstack/react-query` for asynchronous server state, Firestore listeners, and cache management.
- Keep UI components focused on rendering. Move complex database logic into [`src/lib/booking-api.ts`](file:///src/lib/booking-api.ts).

---

## 🧹 Code Quality & Linting

Before pushing your changes or opening a PR, ensure all linting and formatting checks pass clean:

```bash
# Run ESLint check
npm run lint

# Format code with Prettier
npm run format

# Run TypeScript type check / build verification
npm run build
```

---

## 📥 Submitting a Pull Request

1. Push your changes to your feature branch on GitHub:
   ```bash
   git push origin feat/your-feature-name
   ```
2. Open a **Pull Request** against the `main` branch of the primary repository.
3. Complete the PR template checklist:
   - [ ] Verified build succeeds locally with `npm run build`
   - [ ] ESLint passes without errors (`npm run lint`)
   - [ ] Tested seat reservation flow in local environment
   - [ ] Updated documentation if changing configuration options or API schemas
4. Wait for code review from maintainers!

Thank you for building with **AWS Club VITB**! 🚀🏎️
