# Plan — Guest Housekeeping Requests (Room care)

Status: **Implemented** (see `docs/HOUSEKEEPING.md` and WORKLOG).

## Constraints

- Do not break Front desk, Dining, Messages, Inventory, admin Staff/Settings, or existing checkout→HK flow.
- Additive changes only; reuse Azure Bay design system (navy / gold / cream, `bay-field`, `Panel`).
- Update docs with every phase (`WORKLOG`, guides, new `HOUSEKEEPING.md`).
- Unrelated bugs: report only (see bottom).

## Locked product model

| Actor | Responsibility |
|-------|----------------|
| **Guest (`checked_in` only)** | **Make up room** or **Do not disturb**; see status |
| **Housekeeping role** | Execute on existing kanban |
| **Manager / Admin** | Assign + supervise |
| **Receptionist** | View board; check-out still auto-creates turn-downs |

**Out of scope this slice:** timed ETA windows, “on the way” GPS, paid turndown products, redesigning ServiceRequest (laundry/transport).

## Current reuse

- Checkout → `HousekeepingTask` `checkout-clean` → room `cleaning` → complete → `available` (`reservations.js`, `operations.js`).
- Board: `HouseKanban.jsx` + portal Housekeeping tab.
- Guest stay service form stays; add a separate **Room care** block.

## Critical fix (ship with feature)

`PATCH /housekeeping/tasks/:id` today always sets room `available` on complete — correct for **checkout-clean**, **wrong** for in-house guest makeup (room must stay **`occupied`**).

| Task type | On complete |
|-----------|-------------|
| `checkout-clean` | Room → `available` |
| `guest_makeup` (stay still in house) | Do **not** free the room |
| `dnd` clear/close | No room → available |

## Domain (additive)

Extend `HousekeepingTask`:

- `reservationId`, `guestId` (optional)
- `source`: `checkout` | `guest` | `desk`
- Types: keep `checkout-clean`; add `guest_makeup`, `dnd`

**DND:** Guest sets DND → task `type: "dnd"`, status `blocked` (board: Do not enter). While active, reject new makeup with 409. Guest **Clear DND** closes it.

**Makeup:** Guest → creates `guest_makeup` task linked to in-house room/reservation; notify housekeeping + manager; `publish("housekeeping")`.

**Eligibility:** Thin `resolveInHouseStay(user)` (checked_in + room). Do not break dining eligibility.

## API (additive)

| Method | Path | Who |
|--------|------|-----|
| GET | `/housekeeping/my-requests` | Guest — own recent for stay |
| POST | `/housekeeping/guest-request` | Guest — `{ action: "makeup" \| "dnd" \| "clear_dnd", notes? }` |
| Existing GET/PATCH | `/housekeeping/tasks` | Staff — present new labels/fields |

Guests never PATCH the staff board.

## Client

1. **GuestStay** — Room care card: gate copy if not in house; Makeup / DND / Clear DND; status list (Requested → In progress → Done / DND active).
2. **HouseKanban** — Badge Guest vs Check-out; empty copy mentions guest requests.
3. Notifications → `?tab=housekeeping` (portal already supports tab query).

## Phases

1. **A — Backend:** schema, APIs, room-complete fix, notifications  
2. **B — Guest UI:** Room care card  
3. **C — Staff UI:** kanban badges/copy  
4. **D — Docs:** `HOUSEKEEPING.md` + WORKLOG + ADMIN + GUEST_STAY_POLICY + SUBMISSION_TEST_GUIDE  

## Risk controls

- Server-side checked_in on every guest mutate  
- Guests only see own `guestId` tasks  
- Branched room-status on complete  
- Additive defaults so old checkout tasks keep working  

## Known unrelated issues (do not fix here)

- Client proxy `ECONNREFUSED 127.0.0.1:5000` when API is down — all logins fail until `server` runs.
- Seed creates `house@azurebay.test` only on **empty** DB; otherwise create via Admin → Staff.

## Demo accounts (after API up)

- Housekeeping: `house@azurebay.test` / `AzureBay#2025` → `/staff`  
- Manager assign: `manager@azurebay.test`  
