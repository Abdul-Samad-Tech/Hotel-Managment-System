# Azure Bay HMS — Submission test guide

Use this checklist before recording your demo video and submitting the eProject.

---

## 0. Start the project (every time)

### Terminal 1 — API

```powershell
cd "D:\Semester 5 (eproject)\hms\HMS\server"
npm run dev
```

Expect:

```text
MongoDB connected
Azure Bay API listening on http://127.0.0.1:5000
```

Quick health check in browser: `http://127.0.0.1:5000/api/v1/health`  
→ `{ "ok": true, "service": "azure-bay-hms" }`

### Terminal 2 — Client

```powershell
cd "D:\Semester 5 (eproject)\hms\HMS\client"
npm run dev
```

Open: **`http://127.0.0.1:5173`** (not only `localhost` if you hit IPv6 issues).

### Env checklist

| File | Must have |
|------|-----------|
| `backend/.env` | `MONGO_URI`, `JWT_SECRET`, `PORT=5000`, `CLIENT_ORIGIN=http://127.0.0.1:5173` |
| `frontend/.env` | `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, `VITE_EMAILJS_PUBLIC_KEY` (signup OTP + invoice). Optional `VITE_EMAILJS_OTP_TEMPLATE_ID` — see `docs/emailjs-otp-template.html` |
| `backend/.env` (optional) | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` for Media uploads |

**Note:** Port `5000` is API only. Opening `/` on 5000 shows “Cannot GET” — that is normal. The website is on **5173**.

### Demo accounts (password for all: `AzureBay#2025`)

| Role | Email |
|------|--------|
| Admin | `admin@azurebay.test` |
| Manager | `manager@azurebay.test` |
| Receptionist | `desk@azurebay.test` |
| Housekeeping | `house@azurebay.test` |
| Maintenance | `maint@azurebay.test` |
| Guest | `guest@azurebay.test` |

---

## 1. Public website (no login)

Mark each as you go.

- [ ] Home loads (hero, rooms, booking bar)
- [ ] `/rooms` lists rooms (from DB catalog; falls back to static if API down)
- [ ] Open a room detail → gallery / book CTA works
- [ ] `/dining`, `/experiences`, `/gallery`, `/location`, `/contact` open
- [ ] `/dining` shows live menu (from API); order/table locked until check-in
- [ ] Public **Navbar + Footer** visible on these pages
- [ ] Mobile width (~375px): nav / booking still usable

---

## 2. Multi-tab login (important for demo)

Docs: `docs/MULTI_TAB_AUTH.md`

1. Tab A → `/login` → `admin@azurebay.test`
2. Tab B (new tab) → `/login` → `desk@azurebay.test`
3. Tab C → `/login` → `guest@azurebay.test`
4. Refresh each tab → each stays its own role (`/admin`, `/staff`, `/guest`)
5. Confirm: desk portals have **no public Navbar** (sidebar only)

- [ ] Three roles alive at once
- [ ] Public navbar hidden on `/admin`, `/staff`, `/guest`

---

## 3. Guest booking → stay (main happy path)

**Tab: Guest** (`guest@azurebay.test`)

1. Home or `/rooms` → pick dates → book a room (or `/booking/...`)
2. Complete flow → confirmation code shown
3. `/guest` → **Your stay** shows the reservation
4. Add special request / cancel a confirmed stay (optional)
5. Request a service (Room service / wake-up / laundry)
6. Submit feedback (rating + comment) — stays pending until Overview Publish
7. **Profile** → edit phone / preferences → Save

- [ ] Booking created
- [ ] Stay list + service + feedback + profile OK

---

## 4. Front desk (receptionist)

**Tab: Desk** (`desk@azurebay.test`) → `/staff`

### Front desk

1. Find the guest reservation (search confirmation or name)
2. **Check in** → status `checked_in`
3. Guest tab: `/dining` → add dishes → **Place order** (room charge)
4. Desk → **Dining → Kitchen** → advance order; **Tables** optional seating request
5. Open **Invoice** → see dining line + totals
6. **Add charge** (optional extra)
7. **Record payment**
8. **Print invoice** (print dialog; only invoice block should print)
9. **Email invoice** (needs EmailJS env + template from `docs/emailjs-invoice-template.html`)
10. **Check out** → room cleaning + HK task; any still-`placed` dining orders cancelled

### Dining (portal)

- [ ] Menu list loads; manager can add/toggle items
- [ ] Kitchen board shows guest order after check-in place
- [ ] Confirmed guest **before** check-in cannot place order (403 / locked UI)

### Guests section

1. Search guests
2. Add walk-in guest
3. Edit guest → Save
4. Deactivate / Restore

- [ ] Check-in / out
- [ ] Invoice charge + pay + print
- [ ] Email (if EmailJS configured)
- [ ] Guests CRUD

---

## 5. Housekeeping & maintenance

**Tab: Housekeeping** (`house@azurebay.test`)

- [ ] Housekeeping board shows checkout-clean task after checkout
- [ ] Move check-out task to completed → room becomes available
- [ ] Guest (checked in) → Your stay → **Request room cleaning** → Guest badge on board
- [ ] Complete guest make-up → room stays occupied (guest still in house)
- [ ] Guest **Do not disturb** → Blocked column; makeup blocked until Clear DND

**Tab: Maintenance** (`maint@azurebay.test`)

- [ ] Create a ticket
- [ ] Assign / resolve
- [ ] Alerts may notify managers

---

## 5b. Access (least privilege)

- [ ] Receptionist Dining: only **Kitchen** + **Tables** (no Menu / Reports)
- [ ] Manager: Overview + Inventory + Dining Menu/Reports; **no** Staff / Settings
- [ ] Admin only: Staff + Settings
- [ ] Housekeeping: sees own + unassigned tasks, not another HK’s assigned work

Docs: `docs/ACCESS_MATRIX.md`

## 6. Admin / manager

**Tab: Admin** (`admin@azurebay.test`) → `/admin`

### Overview

- [ ] Occupancy / revenue / feedback cards load
- [ ] ADR / RevPAR / Demand cards show
- [ ] CSV exports: occupancy, revenue, feedback, performance
- [ ] Guest reviews: Publish / Hide → Home + room detail update

### Inventory

- [ ] Add room type / add room
- [ ] Add amenities chips on type → appear on public room detail
- [ ] Edit type (rate/name/amenities) → Save
- [ ] Deactivate type → Restore
- [ ] Edit room / Take offline / Restore  
  (Cannot offline a room with a checked-in guest)

### Staff

- [ ] Add staff (manager/desk/house/maint)
- [ ] Deactivate a non-admin staff user

### Settings

- [ ] Loads hotelName, currency, taxRate
- [ ] Change values → Save → refresh → values persist
- [ ] Stay policies: add/edit/remove → Save → room detail Accordion updates

---

## 7. Catalog sync check

1. As admin, Inventory → change a room type **name**, **base rate**, or **amenities**
2. Logout or open public `/rooms` (incognito or guest tab)
3. Public listing / detail should reflect API data

- [ ] Public rooms track DB room types (incl. amenities)
- [ ] Room detail policies match Settings stay policies
- [ ] Room detail + Home reviews match published feedback only

---

## 8. Negative / edge checks (quick)

- [ ] Wrong password → clear error
- [ ] Guest cannot open `/admin`
- [ ] Receptionist cannot open Staff/Settings (admin-only)
- [ ] `http://127.0.0.1:5000/` → Cannot GET (expected)
- [ ] API down → public rooms may fall back to static (site still opens)

---

## 9. Suggested demo video script (~4–6 min)

1. **Public site** — home + rooms (10s)  
2. **Multi-tab** — show admin / desk / guest logged in together (20s)  
3. **Guest books** a room (60s)  
4. **Desk** check-in → add charge → pay → print/email (90s)  
5. **Checkout** → housekeeping completes room (45s)  
6. **Admin** Overview ADR/RevPAR + Inventory edit (45s)  
7. **Settings** tax/hotel name (20s)  

Record at `127.0.0.1:5173` with both terminals running.

---

## 10. Submit package checklist

- [ ] Source code (client + server; **do not** commit real secrets if uploading publicly — use `.env.example`)
- [ ] This test guide + docs in `/docs`
- [ ] Demo video of working app
- [ ] Brief note: MongoDB Atlas URI in `backend/.env`, MERN stack, roles listed above
- [ ] Screenshot of Atlas `azure-bay` collections (optional proof)

### Docs map

| Doc | Topic |
|-----|--------|
| `docs/MULTI_TAB_AUTH.md` | Multi-tab login |
| `docs/CRUD_INVENTORY_GUESTS.md` | Inventory + guests |
| `docs/INVOICE_EMAILJS.md` | Invoice + EmailJS |
| `docs/emailjs-invoice-template.html` | Email HTML |
| `docs/CATALOG_AND_ANALYTICS.md` | Catalog + ADR/RevPAR |
| `docs/WORKLOG.md` | Change history |
| `docs/DINING_SYSTEM.md` | F&B menu, orders, tables, check-in gate |
| `docs/HOUSEKEEPING.md` | Turn-downs, guest Room care, DND |
| `docs/ACCESS_MATRIX.md` | Who can open which portal tabs / APIs |
| `docs/SUBMISSION_TEST_GUIDE.md` | This file |

---

## If something fails

| Symptom | Fix |
|---------|-----|
| Client blank / not found on 5173 | `cd frontend` → `npm run dev`; use `127.0.0.1:5173` |
| Login fails / proxy error | Server must be on 5000; check terminal for Mongo errors |
| Email invoice error | Fill `frontend/.env` EmailJS keys; restart Vite |
| Empty portal data | Confirm Mongo connected; seed runs on empty DB once |
| Navbar still on desk | Hard refresh (`Ctrl+Shift+R`) on `/admin` |
