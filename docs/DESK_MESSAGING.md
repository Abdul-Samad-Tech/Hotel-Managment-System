# Desk ↔ guest messaging (live)

Two-way private conversations. **Not preview-only.**

## Privacy

- Each `DeskThread` belongs to **one** `guestId`.
- Guests can only `GET` / reply to **their** threads.
- Other guests never see names, emails, or messages from another account.
- Desk staff see guest name/email **only on the thread they open**.

## Guest flows

| Entry | What happens |
|-------|----------------|
| `/messages` | Private header + New message / My bookings; split list + thread (`MessageThreadView` embedded) |
| `/contact` (signed-in guest) | Creates a thread, redirects to `/messages?thread=` |
| My bookings → **Request date change** | Compose with topic `date_change`, stay pre-selected, **open nights calendar** |
| Portal → Messages (guest) | Card + **Open Messages** → `/messages` (single inbox) |

Date-change compose calls `GET /desk-messages/open-nights` (room type + ignore current reservation). Taken nights cannot be selected; server re-checks before create.

## Desk flows

| Entry | What happens |
|-------|----------------|
| Portal → **Messages** | `DeskMessagesPanel`: Open / Needs reply / Closed filters, stats, list + reply pane |
| Alerts | Notification when guest writes / replies |

After agreeing a date change, staff still apply it on **Front desk → ⋮ → Move dates** (inventory check).

## UI notes

- Same design system as Front desk (cream panels, gold labels, navy/gold buttons).
- Layout-only; thread APIs and privacy rules unchanged.


## API (`/api/v1/desk-messages`)

- `GET /open-nights?roomType&from&to&reservationId&roomId`
- `GET /threads` — guest: own; desk: all (optional `?status=`)
- `POST /threads` — create + first message (+ optional requested dates)
- `GET /threads/:id` — thread + messages (access-checked); marks read
- `POST /threads/:id/messages` — reply
- `PATCH /threads/:id` — status (`closed`, etc.)

Models: `DeskThread`, `DeskMessage`.

## Related

- `docs/GUEST_STAY_POLICY.md`
- `docs/FRONT_DESK.md`
