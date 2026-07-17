# API Documentation

Base URL (local): `http://localhost:3000/api`
Base URL (deployed): `https://konvo-media-locker.onrender.com/api`

All authenticated routes require a header: `Authorization: Bearer <token>`

---

## Auth

### `POST /auth/register`
Creates a new user with a starting wallet balance of 100 coins.

**Body**
```json
{ "email": "user@example.com", "password": "yourpassword" }
```

**Response `201`**
```json
{ "token": "<jwt>", "walletBalance": 100 }
```

**Errors**
- `400` — missing email or password
- `409` — email already registered

---

### `POST /auth/login`

**Body**
```json
{ "email": "user@example.com", "password": "yourpassword" }
```

**Response `200`**
```json
{ "token": "<jwt>", "walletBalance": 100 }
```

**Errors**
- `401` — invalid email or password (same message for both cases, intentionally, to prevent email enumeration)

---

## Media

### `POST /media/upload` 🔒
Multipart form upload. Generates a blurred/low-res preview automatically via `sharp`.

**Headers:** `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`

**Form fields**
| Field | Type | Notes |
|---|---|---|
| `image` | file | the image to upload |
| `price` | integer | unlock price in coins, ≥ 0 |

**Response `201`**
```json
{ "id": "uuid", "previewUrl": "/previews/xxxx.jpg", "price": 50 }
```

**Errors**
- `400` — missing image or invalid price

---

### `GET /media/feed` 🔒
Returns all uploaded media with lock status relative to the requesting user.

**Response `200`**
```json
[
  {
    "id": "uuid",
    "price": 50,
    "previewUrl": "/previews/xxxx.jpg",
    "isOwner": false,
    "isUnlocked": false
  }
]
```
Note: the original file path/URL is never included in this response, regardless of unlock status. The client must call `GET /media/:id/original` separately, which re-checks access.

---

### `POST /media/:id/unlock` 🔒
Spends coins to unlock a specific media item. Atomic — wrapped in a DB transaction.

**Response `200`**
```json
{ "success": true }
```

**Errors**
- `400` — you already own this media
- `402` — not enough coins
- `404` — media not found
- `409` — already unlocked (duplicate purchase attempt)

---

### `GET /media/:id/original` 🔒
Streams the original full-resolution file. Only succeeds if the requester owns or has purchased the media.

**Response `200`** — binary image data

**Errors**
- `403` — media exists but hasn't been unlocked by this user
- `404` — media not found

---

## Wallet

### `GET /wallet` 🔒
**Response `200`**
```json
{ "walletBalance": 100 }
```

### `GET /wallet/transactions` 🔒
**Response `200`**
```json
[
  { "id": "uuid", "userId": "uuid", "amount": -50, "mediaId": "uuid", "createdAt": "2026-07-17T10:00:00.000Z" }
]
```
`amount` is negative for coins spent.

---

## Health

### `GET /health`
No auth required. Used to verify the server is running (also used by Render's health checks).

**Response `200`**
```json
{ "status": "ok" }
```
