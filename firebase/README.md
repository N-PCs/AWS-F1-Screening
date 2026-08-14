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
| `bookings`       | booking code, name, email, phone, reg no., seats, amount, UPI ref, **screenshot URL**, status |
| `registrations`  | one doc per registration number — the "one booking per student" lock  |
| `screenshots`    | links the Cloudinary payment screenshot (`screenshotUrl` + `cloudinaryPublicId`) to the booking code, organiser-readable only |

Flow: browser picks seats → Firestore transaction holds them for 8 minutes →
screenshot is uploaded to **Cloudinary** (so Firestore never holds images) →
form + the returned Cloudinary URL are written in a second transaction that also
creates the `registrations/<REGNO>` lock → `/admin` (Google sign-in) verifies
or rejects each booking. Rejecting frees the seats again.

Everything above stays inside the free tier: no Cloud Storage, no Blaze card,
no server to keep alive — Cloudinary has its own free plan.

---

## 6. Cloudinary setup (payment screenshots)

The site uploads payment screenshots straight to Cloudinary and stores *only the
URL* in Firestore, so admins can view them without hitting Firestore's 1 MB doc
limit. Uploads use an **unsigned preset**, so no API secret is ever exposed.

1. Sign up at <https://cloudinary.com> (free plan).
2. On the dashboard, copy your **Cloud Name** (e.g. `aws-f1-vitb`) into `.env`:
   ```
   VITE_CLOUDINARY_CLOUD_NAME=aws-f1-vitb
   ```
3. Create the upload preset:
   **Settings → Upload → Upload presets → Add upload preset → Enable unsigned**.
   Recommended settings: **Folder** = `f1-screening/screenshots`,
   **Allowed formats** = jpg / png / webp, **Transformation** = optional auto-optimisation.
   Copy the preset **name** (which you chose, e.g. `f1_screenshots`) into `.env`:
   ```
   VITE_CLOUDINARY_UPLOAD_PRESET=f1_screenshots
   ```
4. `npm run dev`, then restart the dev server so it picks up the new `.env`.
   The "Setup pending" warning on `/book` disappears.

Note on privacy: the uploaded images are unlisted (random `public_id`s), but
Cloudinary serves them at guess-proof URLs. Firestore rules decide who may *see
that a screenshot exists* — the organiser-only `screenshots` collection. To
delete an image later, either remove it in the Cloudinary dashboard or use the
Admin API (needs your API secret, keep it server-side).

## Changing the seat layout or prices

Edit `ROWS` / `TIERS` in `src/lib/seat-layout.ts` — prices are computed from
that file, so nothing else has to change.
