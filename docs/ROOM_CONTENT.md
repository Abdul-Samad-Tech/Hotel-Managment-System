# Room content (amenities, policies, reviews)

Public room detail and Home guest stories are admin-driven — not static marketing copy (except offline fallback).

## Amenities (per room type)

| Who | Where |
|-----|--------|
| Admin / manager | Inventory → Room types → Amenities chips (add / remove) |

- Stored on `RoomType.amenities` (`string[]`).
- Public catalog (`roomCatalog`) uses API amenities only when the type loads from API; empty list shows “No amenities listed” (no silent static substitute).
- Static `frontend/src/data/rooms.js` amenities apply only when the whole catalog falls back (API down).

## Stay policies (hotel-wide)

| Who | Where |
|-----|--------|
| Admin only | Settings → Stay policies |

- Stored as `Setting` key `stayPolicies`: `[{ id, title, body }, …]`.
- Public: `GET /api/v1/public/stay-policies` (no auth).
- Room detail Accordion loads this list; if fetch fails, uses static defaults once.
- Defaults seeded via `ensureDefaults` / seed (`DEFAULT_STAY_POLICIES`).

## Reviews (hotel-wide + moderation)

| Who | Where |
|-----|--------|
| Guest | Your stay → Send feedback |
| Admin / manager | Overview → Guest reviews (Publish / Hide) |

- Model: `Feedback` (`rating`, `title`, `comment`, `guestId`, `published`).
- New guest submissions: **`published: false`** until staff publishes.
- Public: `GET /api/v1/feedback` → published only (Home + room detail).
- Staff: `GET /api/v1/feedback/manage`, `PATCH /api/v1/feedback/:id` `{ published }`.
- Seed demo feedback is published so viva has at least one live story.

No per-room-type review link — same published set on every room page and Home.

## Related

- `docs/ADMIN_PORTAL_GUIDE.md`
- `docs/ACCESS_MATRIX.md`
- `docs/PUBLIC_UX_AND_MEDIA.md`
- `docs/SUBMISSION_TEST_GUIDE.md`
