# Phase 1 — Inventory & guest CRUD

**Date:** 2026-10-08  
**Status:** Done

## Room types

- `PATCH /api/v1/room-types/:id` — managers can update name, rate, capacities, bed, amenities, image, `active`
- Soft deactivate: `{ active: false }` (no hard delete)
- `GET /room-types?all=1` — includes inactive (portal Inventory)

## Rooms

- `PATCH /api/v1/rooms/:id` — roomNumber, roomTypeId, floor, features, status, active, maintenanceNote
- Soft offline blocked while a guest is `checked_in`
- `GET /rooms?all=1` — includes inactive rooms

## Guests (staff)

- `GET /guests/:id`, `PATCH /guests/:id` — desk / manager / admin
- Guest model `status`: `active` | `inactive` (soft deactivate)
- Email change blocked when guest is linked to a user account
- Portal **Guests** section: search, create, edit, deactivate / restore

## Portal

- Inventory: edit / deactivate / restore types and rooms
- Guests nav item for desk roles
- **UX (2026-10-11):** Inventory UI labels two steps — room types (catalog) vs physical rooms (number + floor). Full role/tab guide: `docs/ADMIN_PORTAL_GUIDE.md`.
- **Images (2026-10-11):** Room type photos are chosen from the Media library picker (not URL paste). Media tab: name + upload first.
