# Multi-tab / multi-role auth

**Date:** 2026-10-08  
**Status:** Done

## Goal

Allow every role (admin, manager, receptionist, housekeeping, maintenance, guest) to stay signed in at the same time in **different browser tabs**. An admin can open several tabs and log each one in as a different demo account without one tab overwriting another.

## Why cookies alone were not enough

Browser cookies for `127.0.0.1` / `localhost` are shared across all tabs on that origin. The previous session used only `access` / `refresh` cookies, so the last login in any tab became the session for every tab.

## Solution

| Layer | Change |
|-------|--------|
| Client | Store `accessToken` + `refreshToken` in **`sessionStorage`** (tab-scoped) via `frontend/src/lib/session.js` |
| Client | `api.js` / `downloadCsv` send `Authorization: Bearer …` |
| Client | `AuthContext` saves tokens on login/register/refresh; clears them on logout |
| Client | Socket.IO passes `auth: { token }` from sessionStorage (`live.js`) |
| Server | Login / register / refresh return `{ user, accessToken, refreshToken }` |
| Server | Refresh / logout also accept `body.refreshToken` |
| Server | `requireAuth` **prefers Bearer over cookie** |
| Server | Socket handshake accepts `auth.token` or Bearer, then cookie |

Cookies are still set for backward compatibility, but the SPA auth path is Bearer + sessionStorage.

## How to test

1. Keep server (`5000`) and client (`5173`) running.
2. Open Tab A → `http://127.0.0.1:5173/login` → `admin@azurebay.test` / `AzureBay#2025`
3. Open Tab B (new tab, same browser) → login → `desk@azurebay.test` / `AzureBay#2025`
4. Open Tab C → `guest@azurebay.test` / `AzureBay#2025`
5. Each tab should keep its own portal (`/admin`, `/staff`, `/guest`) after refresh of that tab.

## Demo accounts (seed)

Password for all: `AzureBay#2025`

| Role | Email |
|------|--------|
| admin | `admin@azurebay.test` |
| manager | `manager@azurebay.test` |
| receptionist | `desk@azurebay.test` |
| housekeeping | `house@azurebay.test` |
| maintenance | `maint@azurebay.test` |
| guest | `guest@azurebay.test` |

## Edge case

Logging in as the **same user** in two tabs rotates that user’s single `refreshTokenHash` on the server. Access tokens still work until expiry; refresh may fail in the older tab. Different roles/users in different tabs is the supported workflow.

## Files touched

- `backend/src/middleware/auth.js`
- `backend/src/routes/auth.js`
- `backend/src/sockets.js`
- `frontend/src/lib/session.js` (new)
- `frontend/src/lib/api.js`
- `frontend/src/lib/live.js`
- `frontend/src/context/AuthContext.jsx`
