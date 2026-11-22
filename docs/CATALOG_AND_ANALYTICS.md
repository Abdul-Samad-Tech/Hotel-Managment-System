# Phase 3 — Catalog sync, analytics, memory server

**Date:** 2026-10-08  
**Status:** Done

## Public room catalog

- Adapter: `frontend/src/lib/roomCatalog.js` + hook `frontend/src/hooks/use-room-catalog.js`
- Fetches `GET /api/v1/room-types`, maps to public room card shape, merges gallery/extras from static `frontend/src/data/rooms.js` by slug
- Fallback to static catalog if API fails
- Wired: Home Rooms section, Rooms page, Room detail, Booking flow, room neighbor swipe

**Still mock:** price calendar `AVAILABILITY_SOURCE` remains `mock` (separate follow-up).

## Performance analytics

`GET /api/v1/reports/performance?from=&to=` (managers)

- Period occupancy, **ADR**, **RevPAR**, room revenue
- Demand hint: next 14 days booked room-nights vs capacity → `soft` / `moderate` / `strong`
- CSV export supported
- Overview cards show ADR, RevPAR, Demand alongside existing metrics

## mongodb-memory-server

- Added to `backend/package.json` dependencies so `backend/src/db.js` can fall back when `MONGO_URI` is empty
- Production / student demos should still set Atlas `MONGO_URI` in `backend/.env`
