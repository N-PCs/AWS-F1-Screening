# Firebase setup (free Spark plan, your own Google account)

The site talks straight to your Firebase project. Firestore gives you real transactions, so a seat — and a
registration number — can only ever be claimed once.

## 1. Create the project

1. Go to <https://console.firebase.google.com> → **Add project**
   (name it e.g. `f1-screening-vitb`). Google Analytics can be off.
2. In the left menu: **Build → Firestore Database → Create database**
   → **Start in production mode** → pick a location like `asia-south1`.

## 2. Register the web app and copy the keys

1. Project overview → the **`</>`** (Web) icon → nickname `f1-site` → Register.
2. Copy the values from the `firebaseConfig` snippet into the project's `.env`:

```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=f1-screening-vitb.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=f1-screening-vitb
VITE_FIREBASE_APP_ID=1:1234567890:web:abc123
VITE_FIREBASE_STORAGE_BUCKET=f1-screening-vitb.appspot.com
VITE_FIREBASE_SENDER_ID=1234567890
```

These web keys are public by design — Firestore rules are what protect the
data, not the keys.

## 3. Turn on organiser sign-in

1. **Build → Authentication → Get started → Google → Enable → Save**.
2. **Authentication → Settings → Authorized domains → Add domain** for your
   published domain (e.g. `your-domain.vercel.app` or `localhost`).

Organiser accounts are the two Google accounts listed in
`src/lib/event-config.ts` (`ADMIN_EMAILS`). Nobody else can open `/admin`
or read registrations, even with the API keys.

## 4. Paste the security rules

**Firestore Database → Rules**, replace everything with the contents of
`firebase/firestore.rules`, then **Publish**. If you change the organiser
emails, change them in *both* that file and `src/lib/event-config.ts`.

## 5. Done — how the data is stored

| Collection       | What's inside                                                        |
| ---------------- | -------------------------------------------------------------------- |
| `seats`          | one doc per claimed seat (`A1`, `B7`…): `held` + expiry, or `booked`  |
| `bookings`       | booking code, name, email, phone, reg no., seats, amount, UPI ref, status |
| `registrations`  | one doc per registration number — the "one booking per student" lock  |
| `screenshots`    | the UPI payment screenshot (compressed JPEG), organiser-readable only |

Flow: browser picks seats → Firestore transaction holds them for 8 minutes →
form + compressed screenshot are written in a second transaction that also
creates the `registrations/<REGNO>` lock → `/admin` (Google sign-in) verifies
or rejects each booking. Rejecting frees the seats again.

Everything above stays inside the Spark free tier: no Cloud Storage, no Blaze
card, no server to keep alive.

## Changing the seat layout or prices

Edit `ROWS` / `TIERS` in `src/lib/seat-layout.ts` — prices are computed from
that file, so nothing else has to change.
