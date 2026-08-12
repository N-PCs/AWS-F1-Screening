# AWS F1 Screening - Ticket Booking Application

A high-performance ticket booking web application built for the F1 Grand Prix Screening hosted by AWS Club VITB.

## Features

- **Real-Time Seat Booking**: Live seat selection with transaction locks powered by Firebase Firestore, preventing double-bookings.
- **Seat Mapping**: Interactive grid layout of the screening hall with tiered pricing.
- **Student Verification**: Validation mechanism allowing only one booking per registration number.
- **Admin Dashboard**: Secure organiser access to verify payments and manage bookings.

## Technologies Used

- **Framework**: TanStack Start (React, TypeScript, SSR)
- **Styling**: Tailwind CSS
- **Database & Auth**: Firebase (Firestore, Authentication, Storage)
- **Bundler**: Vite
- **Deployment**: Vercel

## Local Development

To run the application locally, you will need Node.js and npm installed.

1. **Clone the repository**:
   ```sh
   git clone <repository-url>
   cd AWS-F1-Screening
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the root directory and specify the Firebase API configuration (see [firebase/README.md](file:///firebase/README.md) for details).

3. **Install dependencies**:
   ```sh
   npm install
   ```

4. **Run the development server**:
   ```sh
   npm run dev
   ```

## Production Build

To build the application for deployment:
```sh
npm run build
```
