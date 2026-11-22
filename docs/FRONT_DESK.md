# Front desk

Admin / manager / receptionist tab for live stays.

## UI layout (portal)

1. **Header** — short how-to + search (guest name / confirmation).
2. **Stays** — `BookingsTable` with status filter and bulk actions in one toolbar; row count above the table.
3. **Invoice panel** (when opened) — printable bill, add charge, record payment, print, email; **Close panel** clears it.

Design tokens match the rest of Azure Bay (navy / gold / cream, `bay-field`, rounded-full buttons).

## How it works

1. Loads `GET /api/v1/reservations` (optional `?q=` search).
2. Table shows guest, confirmation code, room, dates, status, total.
3. Socket `ops` events refresh the list **quietly** (no full loading skeleton) so open menus stay usable.

## ⋮ Actions menu

| Action | When | Effect |
|--------|------|--------|
| Details | Always | Opens stay sheet (summary; **Open invoice** / Copy code; **Move dates** if confirmed — other guests’ nights on this room disabled) |
| Check in | `confirmed` | `POST /reservations/:id/check-in` → in house |
| No-show | `confirmed` | Status `no_show` — dates free again for inventory |
| Check out | `checked_in` | `POST /reservations/:id/check-out` → departed; auto-cancels dining orders still `placed` and reverses those invoice lines |
| Invoice | Always | Loads invoice under the table (includes `dining` room charges from `/dining` orders) |

Bulk toolbar: **Copy codes**, **Check in selected** (all selected must be confirmed). Shows “N selected” when rows are checked.

## Move dates (confirmed only)

- Loads `GET /availability?roomType=&from=&to=&roomId=&ignoreReservationId=` so nights held by **other** stays on that room cannot be selected.
- Saves with `PATCH /reservations/:id` `{ checkIn, checkOut }` (overlap + re-price on server).
- Guests request changes via Messages / Contact; they do not move dates themselves (`docs/GUEST_STAY_POLICY.md`).

## Messages tab

- Portal **Messages** = desk inbox for guest threads (`docs/DESK_MESSAGING.md`).
- Layout: filters (Open / Needs reply / Closed), thread list + conversation pane.
- Reply in-thread; guest sees it on `/messages`.
- Date-change threads include open-night hints; apply inventory with **Move dates** after you agree.

## Dining tab

- Portal **Dining** = F&B menu / kitchen / tables / reports (`docs/DINING_SYSTEM.md`).
- Guests order from public `/dining` only while `checked_in`.

## Related

- Inventory creates room types + physical rooms guests book against.
- Public calendars mark nights sold out when no room of that type is free (`docs/PUBLIC_UX_AND_MEDIA.md`).
