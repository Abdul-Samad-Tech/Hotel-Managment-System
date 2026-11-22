# Azure Bay — Admin / desk portal guide

How each role uses the portal, where staff come from, and how rooms reach the public site.

Login portal: `http://127.0.0.1:5173/login` → role home (`/admin`, `/staff`, `/guest`, …).

Demo password (seed): `AzureBay#2025`

| Email | Role |
|-------|------|
| `admin@azurebay.test` | admin |
| `manager@azurebay.test` | manager |
| `desk@azurebay.test` | receptionist |
| `house@azurebay.test` | housekeeping |
| `maint@azurebay.test` | maintenance |
| `guest@azurebay.test` | guest |

---

## Mental model: rooms (important)

| Layer | What it is | Where you manage it | What the website uses |
|-------|------------|---------------------|------------------------|
| **Room type** | Catalog product (Deluxe, Suite…) — name, nightly rate, bed, capacity, **amenities**, image | Inventory → **1. Room types** | Public `/rooms` list & detail |
| **Physical room** | A real door — number `101`, floor `1`, linked to a type | Inventory → **2. Physical rooms** | Booking / desk assignment when a stay is held |

**Example:** Type = “Deluxe Room” at $120. Rooms = `101`, `102`, `103` on floor 1. Guests see one Deluxe card; the desk has three doors of that type.

**3rd field on “Add physical room” = Floor** (building level: 1, 2, 3…). Not a mystery status field.

Photos: **Media** tab is the library (name + upload). Inventory room types **pick** from that library — no Image URL paste on add/edit.

---

## Who sees which tabs

Official least-privilege matrix (full write-up: `docs/ACCESS_MATRIX.md`):

| Tab | admin | manager | receptionist | housekeeping | maintenance | guest |
|-----|:-----:|:-------:|:------------:|:------------:|:-----------:|:-----:|
| Overview | ✓ | ✓ | | | | |
| Your stay / Profile | | | | | | ✓ |
| Front desk | ✓ | ✓ | ✓ | | | |
| Messages | ✓ | ✓ | ✓ | | | |
| Dining Kitchen / Tables | ✓ | ✓ | ✓ | | | |
| Dining Menu / Reports | ✓ | ✓ | | | | |
| Guests | ✓ | ✓ | ✓ | | | |
| Inventory | ✓ | ✓ | | | | |
| Media | ✓ | ✓ | | | | |
| Housekeeping | ✓ | ✓ | view | ✓ | | |
| Maintenance | ✓ | ✓ | ✓ | | ✓ | |
| Services | ✓ | ✓ | ✓ | | | |
| Staff | ✓ | | | | | |
| Settings | ✓ | | | | | |
| Alerts | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

**Separation:** Admin = system (staff + settings). Manager = operations (not staff passwords / tax). Receptionist = desk only (no inventory, media, dining menu/reports).

---

## Tab-by-tab (what you add / do)

### Overview (admin, manager)
- Occupancy / revenue / feedback / ADR–RevPAR style reports and export CSV.
- **Guest reviews** — Publish / Hide guest feedback for Home + room detail (`docs/ROOM_CONTENT.md`).
- Read-only analytics from reservations & invoices — you do not “add rooms” here.

### Front desk (admin, manager, receptionist)
- Clear sections: search header → **Stays** table → optional **Invoice** panel (`docs/FRONT_DESK.md`).
- Lists all reservations (search by guest name or confirmation code).
- **⋮ Actions** on each row (does not freeze the page):
  - **Details** — side sheet: guest summary; Open invoice / Copy code; **Move dates** if confirmed.
  - **Check in** — confirmed → in house.
  - **No-show** — confirmed stay marked no-show (frees the dates for new bookings).
  - **Check out** — in-house → departed (room returns to inventory for later dates).
  - **Invoice** — bill panel under Stays (add charges, record payment, print, EmailJS, Close panel).
- Bulk toolbar: status filter + **Copy codes** / **Check in selected** (confirmed only).
- Live socket refresh updates the list quietly (does not tear down an open ⋮ menu).

### Messages (admin, manager, receptionist)
- Live private inbox with guests — not preview-only (`docs/DESK_MESSAGING.md`).
- Filters: Open / Needs reply / Closed; split list + conversation.
- Reply in portal; guest reads on `/messages`. Date-change threads include free-night hints; apply with Front desk **Move dates**.

### Dining (admin, manager, receptionist)
- F&B ops (`docs/DINING_SYSTEM.md`, `docs/ACCESS_MATRIX.md`).
- **Admin / manager:** Menu CRUD + Reports + Kitchen + Tables.
- **Receptionist:** Kitchen + Tables only (no menu edit, no revenue reports).
- Guests order from `/dining` only after check-in; charges appear on the stay invoice as `dining` lines.

### Guests (admin, manager, receptionist)
- Walk-in guest profiles (name, email, phone…).
- Soft deactivate / restore. Deactivating a guest also deactivates their linked login (if any).
- Website signups create a User + Guest automatically — they show up here after register.

### Inventory (admin, manager) — fixed UX labels
1. **Room types** — name, nightly USD rate, bed, max adults/children, **amenities** (chip list), **photo from Media library** → public catalog. **Edit** opens the form under that type (amenities included; **Save type**).  
2. **Physical rooms** — room number, room type dropdown, **floor** → table of doors. **Edit** opens the form under the table (number/type/floor filled; **Save room**).

### Media (admin, manager)
- Site image library: gallery, rooms, dining, experiences, hero.
- **Required image name**, then **Upload image** (primary). Optional “add by URL” for remote/static paths.
- Cloudinary when env set; otherwise Mongo/small file or URL.
- After upload, assign the photo on Inventory add/edit via the gallery picker. Optional `roomTypeSlug` on rooms category still syncs `RoomType.image` on upload.

### Housekeeping
- Kanban: check-out turn-downs + **guest Room care** (make-up / DND) — see `docs/HOUSEKEEPING.md`.
- Badges: Guest vs Check-out. Update status (housekeeping+). Assign (admin/manager).
- Completing **check-out** tasks frees the room; completing **guest** make-up does **not** (guest still in house).

### Maintenance
- Tickets open / assign / resolve. Maintenance role updates; managers assign.

### Services
- Guest service requests from the desk queue.

### Staff (admin only)
- Layout: **Team access** header → **Add staff** form → one-time password card → **Directory** (role/status chips + New password / Activate) → **Role permissions** reference.
- **This is where staff come from** — not from Inventory / public register.
- Form: name, email, role (`housekeeping` | `receptionist` | `manager` | `maintenance`).
- **Password:** system **generates** one (`Bay#…`) on create; panel shows email + password once with Copy. Admin shares it with the employee. Plain password is **not** stored — use **New password** on a row to issue another (shown once again).
- Deactivate / Activate non-admin accounts. Seed demo emails (`house@…`, etc.) keep `AzureBay#2025` on API boot for demos only.

### Settings (admin only)
- Hotel name, currency, tax rate.
- **Booking window** (`bookingOpenFrom` / `bookingOpenTo`) — calendars + API only allow those dates (past always blocked).
- **Stay policies** — hotel-wide title/body list (any count); shown on every room detail page.

### Alerts
- In-app notifications for the signed-in user.

### Guest portal tabs
- **Your stay** — own reservations / cancel / special requests / feedback (new feedback stays **pending** until Overview publishes it).  
- **Messages** — link to private `/messages` inbox.  
- **Profile** — guest profile fields.

### Guest website: My bookings / Messages
- Cancel confirmed stays on My bookings.
- **Request date change** → `/messages` with open-nights picker; desk replies there, then Move dates (see `docs/GUEST_STAY_POLICY.md`, `docs/DESK_MESSAGING.md`).

---

## How the public site gets rooms

1. Admin/manager uploads named photos in **Media** (gallery / rooms categories).  
2. Admin/manager adds **room type**(s) in Inventory and **selects a library photo** (same picker on Edit).  
3. Admin/manager adds **physical rooms** linked to those types (needed for real availability / assignment).  
4. Public site calls `GET /api/v1/room-types` and maps them in `roomCatalog` (static fallback if API down).  
5. Guests book after login; desk sees the stay under Front desk.

---

## Staff vs guests vs seed

- **Staff** = `User` with role manager/receptionist/housekeeping/maintenance (or admin) → created in **Staff** tab or seed.  
- **Website guest** = register → `User` role `guest` + `Guest` profile.  
- **Walk-in guest** = Guests tab only (may have no login until they register with same email reclaim rules).  
- Empty `users` collection + server restart → seed recreates demo accounts.

See also: `docs/ROOM_CONTENT.md`, `docs/CRUD_INVENTORY_GUESTS.md`, `docs/MULTI_TAB_AUTH.md`, `docs/PUBLIC_UX_AND_MEDIA.md`.
