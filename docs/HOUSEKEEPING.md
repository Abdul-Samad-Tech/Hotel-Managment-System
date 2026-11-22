# Housekeeping

Staff turn-downs + in-house guest **Room care** (make-up / Do not disturb).

## Roles

| Role | Does |
|------|------|
| **Housekeeping** | Sees **unassigned** tasks + tasks **assigned to them only**; can claim unassigned by moving them |
| **Manager / Admin** | Full board; assign to a specific housekeeper |
| **Receptionist** | Full board (view); check-out creates turn-down |
| **Guest** | After **check-in**: request cleaning or set DND on **Your stay → Room care** |

**New housekeepers:** Admin → **Staff** → Add staff → system generates password → admin copies and tells the employee. Same `/login` page.

## Flows

### Check-out turn-down (automatic)

1. Front desk **Check out** → room `cleaning` → task `checkout-clean` (`source: checkout`).
2. Housekeeping → Done → room **`available`**.

### Guest make-up (in-house only)

1. Guest checked in → **Request room cleaning**.
2. Task `guest_makeup` on board (Guest badge).
3. Housekeeping advances → Done. Room stays **`occupied`** (guest still in house).
4. Guest sees status: Requested → In progress → Done.

### Do not disturb

1. Guest sets **Do not disturb** → task `dnd` in **Blocked**.
2. Open make-up requests for that stay are closed (“Superseded by DND”).
3. New make-up rejected until guest **Clear Do not disturb**.

## API

| Method | Path | Who |
|--------|------|-----|
| GET | `/housekeeping/tasks` | Desk / HK |
| PATCH | `/housekeeping/tasks/:id` | Manager / HK |
| GET | `/housekeeping/my-requests` | Guest |
| POST | `/housekeeping/guest-request` | Guest `{ action: makeup \| dnd \| clear_dnd }` |

## Room status on complete

- `checkout-clean` / `source: checkout` → room `available`
- `guest_makeup` / `dnd` → **do not** set room available

## How housekeepers know there is work

1. Login → portal opens on the **Housekeeping** board (open-task count at top).
2. **Alerts** — guest make-up / DND / check-out clean create notifications; use **Open board**.
3. Board refreshes live when new tasks arrive (`ops` pulse).

## Troubleshooting

- Login fails for all roles if API is down (`ECONNREFUSED :5000`) — start `server`.
- Demo accounts (`house@azurebay.test`, …) are re-activated on every API boot with password `AzureBay#2025` (`ensureDemoStaff`).
- If login still fails after many wrong tries, wait ~1 minute (rate limit) then retry with exact email/password.
- Avoid deactivating `house@azurebay.test` mid-demo; reboot restores active.

## Related

- `docs/HOUSEKEEPING_GUEST_REQUESTS_PLAN.md` (design)
- `docs/FRONT_DESK.md`, `docs/GUEST_STAY_POLICY.md`, `docs/ADMIN_PORTAL_GUIDE.md`
