# Guest stay policy (Option A)

## What guests can do online

| Action | Where | Notes |
|--------|--------|--------|
| **Cancel** | `/my-bookings` or Guest portal → Your stay | Only `pending` / `confirmed`. Releases room nights; voids draft invoice. |
| **Special request** | Guest portal → Your stay | Saved on the reservation. |
| **Message desk / date change** | `/messages` (or Contact / My bookings) | Live private thread. Date change: pick **free nights** first. |
| **Read desk replies** | `/messages` | Same thread; other guests never see it. |
| **Order dining / reserve table** | `/dining` | Only while stay status is **`checked_in`**. Charges go on the stay invoice. Closed after check-out. |
| **Room care** | Guest portal → **Your stay** | **Request room cleaning** or **Do not disturb** while `checked_in`. Status updates when housekeeping works the task. |

## What guests cannot do online

- Apply date changes themselves on the reservation.
- API returns `403` if a guest PATCHes `checkIn` / `checkOut` (“The front desk changes stay dates.”).
- See another guest’s messages or personal details.
- Place dining orders or table bookings before check-in or after check-out (server enforced).
- Request room cleaning before check-in, after check-out, or while **Do not disturb** is active.

## How date changes work

1. Guest: `/messages` → topic **Change / extend dates** → choose stay → select only **open** nights → send.
2. Desk: portal **Messages** → reply; then Front desk → ⋮ → **Move dates** (other guests’ nights disabled).
3. Guest reads the reply under `/messages`.
4. Full messaging docs: `docs/DESK_MESSAGING.md`.

## Related

- `docs/FRONT_DESK.md`
- `docs/DINING_SYSTEM.md`
- `docs/HOUSEKEEPING.md`
- `docs/PUBLIC_UX_AND_MEDIA.md` (sold-out nights on public calendars)
