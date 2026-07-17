# Paid Media Locker

A backend + React Native (Expo) app where users upload images, set an unlock price, and other users spend coins from a wallet to unlock the original file. Built for the Konvo backend intern assignment.

## Live Demo

- **Backend:** https://konvo-media-locker.onrender.com
- **Demo login:** `demo@konvo.test` / `demo1234` (starts with 100 coins)
- **APK:** see `/apk` folder (or the link provided in the submission email)

> Note: the backend is hosted on Render's free tier, which spins down after inactivity. The first request after idle time can take 30-50 seconds to respond — this is expected, not a bug.

## Tech Stack

| Layer | Choice |
|---|---|
| Backend | Node.js + Express |
| Database | PostgreSQL (hosted on Neon) |
| ORM | Prisma |
| Auth | JWT (bcrypt-hashed passwords) |
| Image processing | sharp (blur + resize for previews) |
| Frontend | React Native + Expo (SDK 57) |
| Navigation | React Navigation (native stack) |
| Secure token storage | expo-secure-store |

## Project Structure

```
backend/
  prisma/schema.prisma   - DB schema (User, Media, Purchase, Transaction)
  prisma/seed.js         - creates the demo account
  src/routes/            - auth, media, wallet endpoints
  src/middleware/auth.js - JWT verification
  src/storage/           - originals/ (private) and previews/ (public) folders
mobile/
  App.js
  src/api/client.js       - shared axios instance, auto-attaches JWT
  src/context/AuthContext.js
  src/navigation/         - screen routing
  src/screens/            - Login, Feed, Upload, MediaDetail
docs/
  API.md
  DB_SCHEMA.md
```

## Running the Backend Locally

```
cd backend
cp .env.example .env       # fill in your own Neon DATABASE_URL and a JWT_SECRET
npm install
npm run prisma:migrate     # creates tables
node prisma/seed.js        # creates the demo account
npm run dev                # starts on http://localhost:3000
```

Verify it's running: `curl http://localhost:3000/health` should return `{"status":"ok"}`.

## Running the Mobile App Locally

```
cd mobile
npm install
```
Edit `src/config.js` to point at either your local backend (using your machine's LAN IP if testing on a physical device, or `10.0.2.2` for an Android emulator) or the live Render URL.
```
npx expo start
```

## Security Decisions

These are the specific choices made to satisfy the assignment's security requirements:

- **Original files are never served statically.** Only `backend/src/storage/previews/` is exposed via `express.static()`. There is no equivalent line for `storage/originals/` anywhere in the codebase — originals can only be reached through the authenticated `GET /api/media/:id/original` route, which re-checks ownership/purchase on every single request.
- **Ownership validation happens server-side, not client-side.** The mobile app never decides whether a user is allowed to see an original image — it just calls the API and displays whatever comes back (or a 403).
- **Duplicate purchases are prevented at the database level**, not just in application code. `Purchase` has a `@@unique([userId, mediaId])` constraint in the Prisma schema, so even two simultaneous unlock requests can't both succeed.
- **Unlock is wrapped in a database transaction** (balance check + deduction + purchase record), preventing race conditions where a user could spend coins they don't have by firing two requests at once.
- **Passwords are bcrypt-hashed** (10 salt rounds), never stored or logged in plaintext.
- **JWTs are stored in expo-secure-store** on the device (encrypted), not AsyncStorage or plain state.
- **Login/register return the same generic error** for "no such user" and "wrong password", so the endpoint can't be used to enumerate which emails are registered.
- **File paths sent to `res.sendFile()` are always built from database values, never raw user input**, closing off path traversal as an attack vector.

## Known Limitations / Bonus Items Not Implemented

Given the assignment's time constraint, these bonus-tier items were intentionally deprioritized in favor of getting the core flow fully correct and secure:
- Media is stored on local disk (originals/previews folders) rather than S3.
- No rate limiting, caching, or audit logging.
- No automated test suite.
- No CI/CD pipeline.

The assignment explicitly states a working, secure, well-structured solution is preferred over a feature-heavy one — these were left out deliberately, not missed.
