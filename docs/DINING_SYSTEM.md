# Dining / F&B system

Full F&B merge for Azure Bay. Guests order and reserve tables **only while checked in**. Charges post to the stay invoice.

## Stay gate (hard rule)

Server helper: `backend/src/lib/diningEligibility.js`.

| Reservation status | Can order / book table? |
|--------------------|-------------------------|
| `checked_in` | Yes |
| `pending` / `confirmed` | No — “after check-in” |
| `checked_out` | No — closed after check-out |
| cancelled / no_show | No |

UI messaging on `/dining` mirrors this; API returns **403** if a guest tries anyway.

On **check-out**, any dining orders still in `placed` are auto-cancelled and their invoice dining lines reversed.

## Models

- `DiningMenuCategory` / `DiningMenuItem` — admin-managed menu (seeded from former static `dining.js` data).
- `DiningOrder` + embedded lines (name/price snapshots) — kitchen pipeline.
- `DiningTable` / `DiningTableBooking` — seating floor + guest requests.

## API (`/api/v1/dining`)

| Method | Path | Who |
|--------|------|-----|
| GET | `/menu` | Public (active items) |
| GET | `/menu/admin` | Desk |
| POST/PATCH | `/categories`, `/items` | Admin / manager |
| GET | `/eligibility` | Guest |
| GET/POST | `/orders` | Guest own / desk all |
| POST | `/orders/:id/cancel` | Guest (`placed` only) or desk |
| PATCH | `/orders/:id` | Desk status advances |
| GET/POST/PATCH | `/tables`, `/table-bookings` | Desk; guest create booking |
| GET | `/reports/summary` | Admin / manager |

## Billing

On place order → open invoice for that reservation → one `InvoiceItem` with `category: "dining"` (description lists dishes). Totals + reservation `totalAmount` updated like Front desk **Add charge**.

Cancel (before delivered) reverses those lines.

## Portal

Nav **Dining** — least privilege (`docs/ACCESS_MATRIX.md`):

| Sub-tab | admin | manager | receptionist |
|---------|:-----:|:-------:|:------------:|
| Menu | ✓ | ✓ | |
| Kitchen | ✓ | ✓ | ✓ |
| Tables | ✓ | ✓ | ✓ (seat; add table = manager) |
| Reports | ✓ | ✓ | |

API: menu admin GET/CRUD + reports = `admin` \| `manager` only.

## Public site

`/dining` — marketing + live menu + gate banner + cart (in-house) + table request (in-house).

## Not the same as booking add-ons

Booking flow checkboxes (e.g. “Ocean dining”) remain **desk notes** in `specialRequests` — they are **not** F&B orders and do **not** create invoice dining lines. Real orders go through `/dining` after check-in.

## Related

- `docs/FRONT_DESK.md` — check-in / check-out  
- `docs/GUEST_STAY_POLICY.md`  
- `docs/ACCESS_MATRIX.md`  
- `docs/ADMIN_PORTAL_GUIDE.md`  
- `docs/WORKLOG.md`  
