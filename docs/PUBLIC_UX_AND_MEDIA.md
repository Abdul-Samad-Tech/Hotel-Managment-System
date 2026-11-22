# Public UX, booking rules, OTP & media

## Desk layout

- Public `Navbar` is hidden on `/guest`, `/staff`, `/admin`, `/portal`.
- `DashboardShell` is flush to the top (no leftover `pt-[68px]`); sidebar uses `lg:top-0 lg:h-screen`.

## Sticky Check Availability

- After the hero, public `Navbar` hides and `StickyMiniBar` pins to `top-0` (`z-[55]`, 64px).
- Check / Book actions require sign-in (`requireSignedIn`).

## Navbar / footer / rooms

- Every nav & footer item is a real `Link` / `NavLink`.
- **Rooms** trigger navigates to `/rooms` on click; hover still opens the mega menu.
- Desktop non-Rooms items must use **string children** on `NavLink` inside Radix `NavigationMenu.Link asChild` (not function children) — otherwise labels disappear.
- Room detail waits for catalog ready, always has a gallery fallback, matches by slug/`selectLabel`.
- Room detail **Amenities** come from `RoomType.amenities` (Inventory). **Policies** from `GET /public/stay-policies`. **Reviews** from published `GET /feedback`. See `docs/ROOM_CONTENT.md`.
- Home testimonials load the same published feedback (static testimonials only if API fails / empty).

## Auth gate (view-only guests)

- Browsing the marketing site stays public.
- Booking actions (Book Now, sticky check, booking flow, reserve) call `requireSignedIn` and redirect to `/login` with a return path + notice.
- `AuthPage` shows the notice and returns the guest to the intended page after sign-in/sign-up.

## Booking date window

- Server: `backend/src/lib/bookingWindow.js` — blocks past dates; enforces `bookingOpenFrom` / `bookingOpenTo` settings.
- Public `GET /api/v1/booking-window`.
- Admin **Settings** edits the window.
- Client calendars disable dates outside the window (`PriceCalendar` + `useBookingWindow`).
- Seed/`ensurePublicDefaults` upserts a default window (today → +1 year).

## Reserved nights / sold out

- `AVAILABILITY_SOURCE=api` — price calendar loads `GET /api/v1/availability?roomType=&from=&to=`.
- A night is **sold out** when every active physical room of that type already has a blocking stay (`pending` / `confirmed` / `checked_in`) covering that night.
- Stay quote / reserve (`checkIn`+`checkOut`) still uses overlap checks so a second guest cannot take the same physical room dates even if the UI were stale.
- Cancel / no-show / check-out frees nights for new bookings.

## Signup OTP email

- `SignUpForm` emails a 6-digit code via EmailJS (`sendOtpEmail`), then registers after verify.
- Template HTML: `docs/emailjs-otp-template.html`.
- Optional `VITE_EMAILJS_OTP_TEMPLATE_ID`; on failure the app retries `VITE_EMAILJS_TEMPLATE_ID`.
- **EmailJS template settings (required):** To Email = `{{to_email}}`, To Name = `{{to_name}}`.
- Errors are normalized via `emailjsErrorMessage` so the toast never shows blank.
- After changing `frontend/.env`, restart `npm run dev` so Vite reloads `VITE_*` keys.
- If toast says **insufficient authentication scopes**, reconnect Gmail in EmailJS (or use Outlook/EmailJS service): `docs/EMAILJS_GMAIL_SCOPES.md`.

## Admin-managed images

- Model: `MediaAsset` (categories: `rooms`, `dining`, `experiences`, `gallery`, `hero`, `site`).
- Routes: public `GET /content/media`; admin CRUD + `POST /media/upload` (multer).
- Upload: Cloudinary when `CLOUDINARY_*` env is set; otherwise file → Mongo or optional URL add.
- Portal **Media**: image **name required** → upload (primary); URL add is secondary.
- Portal **Inventory**: room type add/edit uses reusable `GalleryImagePicker` (loads `/media?all=1`, categories `gallery` + `rooms`) — no raw Image URL field.
- Saving a room type sets `image` + `gallery` on `RoomType`; public catalog reads `type.image`.
- Optional: rooms-category media with `roomTypeSlug` still syncs `RoomType.image` on upload/PATCH.
- Public pages (`Gallery`, `Dining`, `Experiences`) load media via `useSiteMedia` with static fallbacks.
- Component: `frontend/src/components/dashboard/GalleryImagePicker.jsx`.

## Env

**frontend/.env**

```
VITE_EMAILJS_SERVICE_ID=
VITE_EMAILJS_TEMPLATE_ID=
VITE_EMAILJS_PUBLIC_KEY=
VITE_EMAILJS_OTP_TEMPLATE_ID=   # optional
```

**backend/.env**

```
CLOUDINARY_CLOUD_NAME=   # optional
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```
