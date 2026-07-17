# Database Schema

PostgreSQL, hosted on Neon. Managed via Prisma (`backend/prisma/schema.prisma` is the source of truth — this document explains it).

## Entity-Relationship Overview

```
User ──< Media          (one user owns many media items)
User ──< Purchase >── Media   (many-to-many via Purchase, tracks who unlocked what)
User ──< Transaction     (one user has many wallet transaction records)
```

## Tables

### User
| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| email | string | unique |
| password | string | bcrypt hash |
| walletBalance | int | defaults to 100 on creation |
| createdAt | datetime | |

### Media
| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| ownerId | uuid | foreign key → User.id |
| price | int | unlock cost in coins |
| previewPath | string | filename in `storage/previews/`, publicly servable |
| originalPath | string | filename in `storage/originals/`, never served statically |
| createdAt | datetime | |

### Purchase
| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| userId | uuid | foreign key → User.id |
| mediaId | uuid | foreign key → Media.id |
| createdAt | datetime | |

**Constraint:** `@@unique([userId, mediaId])` — a single database-level rule that makes duplicate purchases impossible, rather than relying on an application-level check that could race under concurrent requests.

### Transaction
| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| userId | uuid | foreign key → User.id |
| amount | int | negative = coins spent |
| mediaId | uuid? | nullable, which media this was for |
| createdAt | datetime | |

## Why a separate Purchase and Transaction table?

`Purchase` answers "does this user have access to this media?" — it's what `GET /media/:id/original` checks.
`Transaction` answers "what happened to this user's wallet, and when?" — it's a pure audit log, not used for access control. Keeping them separate means the access-control check (`Purchase`) stays a simple, fast lookup, independent of however much transaction history accumulates over time.
