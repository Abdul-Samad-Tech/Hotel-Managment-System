# HMS work log

Ongoing record of project changes. Update this file whenever work ships.

---

## 2026-10-13 — Submission pack (PDF-ready TXT guides)

- **What:** Added `docs/submission-pack/` with README + Design Guide, Developer Guide, User Guide, Feedback Form (`.txt`). Full project coverage; `[[[ IMAGE PLACEHOLDER ]]]` blocks for PDF screenshot insertion.
- **Why:** Examiner/viva PDFs without disturbing live app code.
- **Where:** `docs/submission-pack/00_README_SUBMISSION_PACK.txt`, `01_DESIGN_GUIDE.txt`, `02_DEVELOPER_GUIDE.txt`, `03_USER_GUIDE.txt`, `04_FEEDBACK_FORM.txt`.

## 2026-10-13 — Room content CMS (amenities, policies, reviews)

- **What:** Inventory amenity chips on room types; hotel-wide stay policies in Settings (`stayPolicies` + public GET); Feedback moderation (default unpublished; Overview Publish/Hide); Home + room detail use published feedback. Docs: `ROOM_CONTENT.md` + guides.
- **Why:** Room detail Amenities / Policies / Reviews were static or half-static; admin must own catalog content.
- **Where:** `PortalPage.jsx` Inventory/Settings/ReviewsModeration, `RoomDetailPage.jsx`, `TestimonialsSection.jsx`, `roomCatalog.js`, `operations.js`, `ensureDefaults.js`, `seed.js`, docs.
- Unchanged: booking, dining, HK, desk messaging, Staff RBAC.

## 2026-10-12 — Least-privilege access matrix

- **What:** Documented official role access; receptionist Dining UI shows **Kitchen + Tables only** (Menu/Reports hidden). `GET /dining/menu/admin` locked to admin/manager (was desk-wide).
- **Why:** Manager ≠ Admin (no Staff/Settings); desk ≠ rates/menu/reports — clearer for judges / real hotel duties.
- **Where:** `DiningBoard.jsx`, `dining.js`, `docs/ACCESS_MATRIX.md`, ADMIN guide, DINING_SYSTEM, this file.
- Unchanged: Staff/Settings admin-only; HK own-queue filter; guest check-in gates.

## 2026-10-12 — Staff tab layout polish

- **What:** Layout-only: clear sections (header, Add staff form with labels, issued-password card, Directory list with chips/actions, Role permissions grid). Same create / reset / activate APIs.
- **Where:** `PortalPage.jsx` StaffAdmin, `ADMIN_PORTAL_GUIDE.md`.

## 2026-10-12 — Admin generates staff passwords

- **What:** Creating staff no longer relies on a hidden default password. API generates `Bay#…`, returns `temporaryPassword` once; Staff panel shows copyable email/password card. **Generate new password** per staff row (`POST /users/:id/reset-password`).
- **Where:** `admin.js`, `PortalPage.jsx` StaffAdmin, `ADMIN_PORTAL_GUIDE.md`.
- Demo seed accounts unchanged (`AzureBay#2025` via `ensureDemoStaff`).

## 2026-10-12 — Housekeeping assignment queue

- **Issue:** Work assigned to Imran still appeared for Bilal — board listed every task for every housekeeping login.
- **Fix:** `GET /housekeeping/tasks` for role `housekeeping` returns only unassigned + own assignments; PATCH blocked for another person’s tasks; claiming unassigned auto-assigns self. Managers/admin/receptionist still see the full floor.
- **Where:** `operations.js`, HousekeepingBoard copy, `HOUSEKEEPING.md`.

## 2026-10-12 — Housekeeping login + work alerts fix

- **Bug:** `house@azurebay.test` was **inactive** → login always 401; many retries hit rate limit 429.
- **Fix:** `ensureDemoStaffAccounts()` on every API boot keeps demo staff active + demo password; login rate limit 20/min; check-out now notifies HK; Alerts “Open board”; HK board shows open-task count; HK role lands on Housekeeping tab.
- **Where:** `ensureDemoStaff.js`, `seed.js`, `housekeepingNotify.js`, `reservations.js`, `auth.js`, `PortalPage.jsx`, `HOUSEKEEPING.md`.

## 2026-10-11 — Guest Room care (housekeeping requests)

- **What:** In-house guests request **room cleaning** or **Do not disturb** from portal Your stay; HK board shows Guest vs Check-out badges; guest sees status.
- **Gate:** `checked_in` only (`resolveInHouseStay`). DND blocks new makeup; clearing DND re-enables cleaning requests.
- **Fix:** Completing a task frees room to `available` **only** for `checkout-clean` — not for in-house `guest_makeup` / DND (room stays occupied).
- **API:** `GET /housekeeping/my-requests`, `POST /housekeeping/guest-request`; staff presenters add `typeLabel`, `source`, `guestStatus`.
- **Where:** `models.js` HousekeepingTask fields, `operations.js`, `inHouseStay.js`, checkout task `source`, `GuestRoomCare` in `PortalPage.jsx`, `HouseKanban.jsx`.
- **Docs:** `HOUSEKEEPING.md`, ADMIN guide, GUEST_STAY_POLICY, SUBMISSION_TEST_GUIDE, this file.

## 2026-10-11 — Full Dining / F&B system

- **What:** Live F&B — menu CRUD, in-house food orders billed to stay invoice, kitchen board, tables + seating, dining reports.
- **Gate:** Guests order / reserve tables only while reservation `checked_in` (`diningEligibility.js`). Check-out auto-cancels `placed` orders and reverses dining invoice lines.
- **API:** `/api/v1/dining/*` (menu, eligibility, orders, tables, table-bookings, reports).
- **UI:** `/dining` live menu + cart + table request; portal **Dining** (Menu / Kitchen / Tables / Reports); guest stay shows recent orders.
- **Seed:** Default menu from former static dining data + tables T1–T8 via `ensureDining.js`.
- **Note:** Booking add-on “Ocean dining” remains a desk note only — not an F&B order.
- **Where:** `models.js`, `routes/dining.js`, `reservations.js` check-out, `DiningPage.jsx`, `DiningBoard.jsx`, `PortalPage.jsx`.
- **Docs:** `DINING_SYSTEM.md`, ADMIN guide, GUEST_STAY_POLICY, SUBMISSION_TEST_GUIDE, this file.

## 2026-10-11 — Front desk + Messages UI layout

- **What:** Layout-only polish so Front desk and Messages read as clear sections. No API or business-logic changes.
- **Front desk:** Header card (how-to + search), **Stays** section with row count, invoice panel with Close / charges / payment / print / email grouped.
- **Bookings table:** Status filter + bulk actions in one toolbar; Details sheet groups guest summary, invoice/copy, then Move dates.
- **Desk Messages:** Inbox header, Open / Needs reply / Closed filters, stats chips, split list + conversation (`DeskMessagesPanel` + embedded `MessageThreadView`).
- **Guest `/messages`:** Same shell — private header, compose CTAs, split conversations + thread.
- **Portal guest Messages tab:** Short card + link to `/messages` (not a second inbox).
- **Where:** `PortalPage.jsx` (FrontDesk + Messages tab), `BookingsTable.jsx`, `DeskMessagesPanel.jsx`, `MessageThreadView.jsx`, `MessagesPage.jsx`.
- **Docs:** `FRONT_DESK.md`, `DESK_MESSAGING.md`, `ADMIN_PORTAL_GUIDE.md`, this file.

## 2026-10-11 — Admin panel white screen

- **Cause:** `MoveDatesForm.jsx` imported `stayNights` from `lib/availability.js` (not exported there) → Portal/admin chunk failed to load.
- **Fix:** Import `stayNights` from `lib/stay-date.js` only. No other logic changed.

## 2026-10-11 — Live guest ↔ desk messaging (no preview)

- **What:** Real private threads (`DeskThread` / `DeskMessage`). Guest sends from `/messages` or Contact; desk replies in portal **Messages**; guest sees replies. Alerts notify both sides.
- **Date change:** Guest picks **open nights** only (`/desk-messages/open-nights` + calendar). Taken nights blocked in UI and on create. Desk then uses Front desk Move dates.
- **Privacy:** Threads scoped by `guestId`; guests cannot list other guests’ conversations.
- **Contact / WhatsApp FAB:** No longer “preview only” — signed-in guests create live threads.
- **Where:** `backend/src/routes/deskMessages.js`, models, `MessagesPage.jsx`, `MessageThreadView.jsx`, `DeskMessagesPanel.jsx`, Contact/MyBookings/Portal/Navbar/App.
- **Docs:** `DESK_MESSAGING.md`, GUEST_STAY_POLICY, FRONT_DESK, ADMIN guide, this file.

## 2026-10-11 — Guest cancel / desk date-change policy (Option A)

- **Policy:** Guests cancel online; change/extend dates only via front desk.
- **Guest:** `/my-bookings` — removed broken **Change dates** (API blocked guests). Added **Request date change** → `/contact` + clear copy. Cancel stay unchanged. Guest portal **Your stay** points to My bookings / Contact.
- **Desk:** Details → **Move dates** uses calendar with nights already held by **other** guests on that room disabled (`ignoreReservationId` + `roomId` on `GET /availability`). Server still re-checks overlaps on PATCH.
- **Where:** `MyBookingsPage.jsx`, `MoveDatesForm.jsx`, `BookingsTable.jsx`, `PortalPage.jsx` GuestStay, `availability.js` / `rooms.js` / `reservations.js` present `roomId`.
- **Docs:** `GUEST_STAY_POLICY.md`, `ADMIN_PORTAL_GUIDE.md`, `FRONT_DESK.md`, this file.

## 2026-10-11 — Front desk ⋮ freeze + live sold-out dates

- **Bug:** Front desk **⋮** menu froze the admin UI (hard reload needed). Cause: TanStack Table `columns` recreated every render + loading flash on socket pulse remounted the open menu in a loop.
- **Fix:** Memoized columns / stable desk handlers; `DropdownMenu` `modal={false}`; quiet pulse refresh (keep rows while refetching). Short how-to copy under Front desk title.
- **Sold-out dates:** Calendar was on `AVAILABILITY_SOURCE=mock` so reserved nights still looked open. Now `api` + `GET /availability?roomType&from&to` returns nightly `{ price, available }` from real reservations (`pending` / `confirmed` / `checked_in`). Booking create already blocked overlaps; calendar now matches. If API is down in DEV, calendar falls back to mock (reserve still enforces server overlaps).
- **Where:** `BookingsTable.jsx`, `PortalPage.jsx` FrontDesk, `backend/src/lib/availability.js` (`calendarNights`), `rooms.js` route, `availability.constant.js`.
- **Docs:** `ADMIN_PORTAL_GUIDE.md`, `PUBLIC_UX_AND_MEDIA.md`, this file.

## 2026-10-11 — Inventory Edit panel visibility fix

- **Bug:** Clicking Edit on a room type / physical room looked broken — name fields and Save did not appear next to the row (form was far below/above the list, easy to miss).
- **Fix:** Room-type edit opens **inline under that row** with name prefilled + Save type / Cancel. Physical-room edit opens **under the rooms table** with number/type/floor prefilled + Save room; scrolls into view. IDs normalized to strings for the type select.
- **Where:** `PortalPage.jsx` Inventory only; `GET /rooms` returns `roomTypeId` as string.

## 2026-10-11 — Gallery-first room images (admin pick, no URL paste)

- **Workflow:** Admin adds images under **Media** (image name required → upload; optional URL add). Then on Inventory **add/edit room type**, picks from that library via reusable `GalleryImagePicker` — no Image URL field on room types.
- **UI:** Media panel copy + name-first upload; Inventory type list shows thumbnails; create/PATCH send `image` + `gallery`.
- **API:** `POST /room-types` accepts optional `gallery` array (defaults from `image`).
- **Where:** `frontend/src/components/dashboard/GalleryImagePicker.jsx`, `PortalPage.jsx` Inventory + MediaPanel, `backend/src/routes/rooms.js`.
- **Docs:** `ADMIN_PORTAL_GUIDE.md`, `PUBLIC_UX_AND_MEDIA.md`, this file.

## 2026-10-11 — Admin Inventory UX + portal guide

- **Issue:** Inventory looked like three mystery fields; unclear how website rooms relate to admin, or where staff come from.
- **Fix:** Inventory split into labeled **1) Room types** (catalog: name, rate, bed, adults, children) and **2) Physical rooms** (number, type, **floor** = building level). Same APIs; clearer copy + validation toasts.
- **Docs:** `docs/ADMIN_PORTAL_GUIDE.md` — every role, every tab, seed staff emails, room two-layer model.
- **Where:** `PortalPage.jsx` Inventory, `RoomTable` empty copy, docs.

## 2026-10-11 — Register “email already exists” after clearing guests

- **Bug:** Signup said email already exists even when that guest was gone from the admin Guests list.
- **Cause:** Register only checked `users`. Deleting/deactivating a **Guest** left the **User** login row; admin Guests UI does not list the Users collection.
- **Fix:** Guest deactivate/reactivate syncs linked guest `User.status`. Register **reclaims** guest emails when the user is inactive, the guest profile is missing, or the guest is inactive (updates password + restores guest). Active accounts still get 409.
- **Note:** Wiping all `users` then restarting the API re-runs seed and recreates demo accounts (`guest@azurebay.test`, etc.).
- **Where:** `backend/src/routes/auth.js`, `backend/src/routes/admin.js`.

## 2026-10-11 — EmailJS Gmail insufficient scopes

- **Error toast:** `Gmail_API: Request had insufficient authentication scopes.`
- **Cause:** EmailJS Gmail OAuth connected without send scopes (dashboard/Google), not app logic.
- **App:** Map that error to a clear reconnect message; guide in `docs/EMAILJS_GMAIL_SCOPES.md`.
- **User action:** EmailJS → Email Services → reconnect Gmail (allow all scopes), or switch to Outlook/EmailJS service and update `VITE_EMAILJS_SERVICE_ID`.

## 2026-10-11 — Signup OTP empty toast / no email

- **Bug:** “Send verification code” showed an empty top toast; OTP stage never opened.
- **Cause:** EmailJS failures often expose `text`/`status` with no `message`, so `onNotice(error.message)` toasted blank and the form stayed put.
- **Fix:** Normalize EmailJS errors to clear copy; trim env keys; send richer OTP template params; if dedicated OTP template fails, retry invoice template.
- **Where:** `frontend/src/lib/emailjs.js`, `SignUpForm.jsx`. EmailJS dashboard: To Email must be `{{to_email}}` (see `docs/emailjs-otp-template.html`). Restart Vite after `.env` edits.

## 2026-10-11 — Rooms page white screen

- **Bug:** `/rooms` crashed to a blank white screen (React unmount).
- **Cause:** `FilterFields` used `priceBounds.min/max` without receiving `priceBounds` as a prop (`ReferenceError`).
- **Fix:** Pass `priceBounds` into desk + drawer filter panels; safe numeric fallbacks for slider min/max.
- **Where:** `frontend/src/pages/RoomsPage.jsx` only.

## 2026-10-11 — Navbar links restored + contrast

- **Bug:** Desktop nav only showed “Rooms”; Home/Dining/Experiences/Gallery/Location/Contact were blank.
- **Cause:** Radix `NavigationMenu.Link asChild` + React Router `NavLink` function-as-children — Slot merges props and drops the render-prop children, so labels never painted.
- **Fix:** Plain text children on those `NavLink`s; active underline from `pathname` (same visual). Rooms mega-menu / click-to-`/rooms` unchanged.
- **Follow-up:** Other links looked dark navy on the navy bar — Radix `asChild` also broke function `className`. Now use a **string** `className` with `!text-white/90` (active: gold), plus `text-white` on the menu root.
- **Where:** `frontend/src/components/layout/Navbar.jsx` only.

## 2026-10-10 — Public UX, OTP, booking window, admin media

- Desk: removed leftover top padding; dashboard flush to top.
- Sticky Check Availability pinned to `top-0` after hero; public nav hides when sticky owns the bar.
- Navbar Rooms click → `/rooms`; footer/nav links remain direct routes; room detail catalog/gallery hardened.
- Signup OTP emailed via EmailJS before register (`docs/emailjs-otp-template.html`).
- Past dates + admin `bookingOpenFrom`/`bookingOpenTo` enforced server + calendars; Settings UI.
- View-only without login; Book/Reserve/check require sign-in with return path.
- Admin Media (Cloudinary or Mongo/URL) for gallery/dining/experiences/rooms/hero; public `useSiteMedia`.
- Docs: `docs/PUBLIC_UX_AND_MEDIA.md`.

## 2026-10-08 — Hide public navbar on desk portals

- **What:** Public `Navbar` no longer renders on `/guest`, `/staff`, `/admin`, `/portal`.
- **Why:** Desk roles already navigate via `DashboardShell` sidebar; dual nav was redundant.
- **Where:** `frontend/src/components/layout/PublicLayout.jsx` (`isDesk` gate).
- Public marketing pages still keep Navbar/Footer unchanged.

## 2026-10-08 — CRUD & rough-edges (Phases 1–3)

- **Phase 1:** RoomType/Room PATCH + soft deactivate; Guest staff GET/PATCH + portal Guests section. Docs: `docs/CRUD_INVENTORY_GUESTS.md`
- **Phase 2:** Printable invoice + EmailJS send; Settings loads/saves hotelName, currency, taxRate. Docs: `docs/INVOICE_EMAILJS.md`
- **Phase 3:** Public catalog API adapter with static fallback; ADR/RevPAR/demand report + Overview cards; `mongodb-memory-server` dependency. Docs: `docs/CATALOG_AND_ANALYTICS.md`
- Design system / multi-tab auth untouched.

## 2026-10-08 — Multi-tab multi-role login

- **What:** Tab-scoped auth so different roles can stay logged in in different tabs.
- **Why:** Shared cookies forced every tab onto the last logged-in user.
- **How:** sessionStorage tokens + Bearer header; server returns tokens and prefers Bearer.
- **Docs:** `docs/MULTI_TAB_AUTH.md`
- **Design / admin UI:** Unchanged (no portal layout or design-system changes).

## 2026-10-08 — MongoDB Atlas swap + Vite host bind

- Connected project to team Atlas cluster (`azure-bay`); fixed invalid URI (special chars in password) and auth.
- Bound Vite to `127.0.0.1:5173` so the site opens on that URL (was IPv6/`localhost` only).
