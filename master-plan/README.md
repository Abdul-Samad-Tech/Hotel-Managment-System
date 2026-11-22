# Azure Bay Hotel & Resort - MERN eProject Package

This package is the implementation blueprint for the supplied Hotel Management System SRS and the supplied Azure Bay home-page UI reference.

## Included
- `Azure_Bay_Hotel_MERN_Master_Plan.docx` - complete roadmap, architecture, module plan, database plan, API plan, testing, deployment, risks, and UI specification.
- `Azure_Bay_Hotel_Architecture.md` - technical architecture and folder structure.
- `Azure_Bay_Hotel_UI_Spec.md` - screenshot-driven UI/component specification.
- `Azure_Bay_Hotel_API_Spec.yaml` - REST API endpoint blueprint.
- `Azure_Bay_Hotel_DB_Schema.md` - MongoDB collections, fields, indexes and integrity rules.
- `Azure_Bay_Hotel_Roadmap.csv` - sprint/phase plan that can be imported into Excel/Sheets/Project tools.

## Source alignment
The source SRS explicitly calls for a MERN-style stack in its software requirements and describes the HMS modules and NFRs. The public website styling is taken from the supplied Azure Bay reference image. The two are combined in this package as: public-facing Azure Bay booking experience + authenticated guest/staff/admin HMS.

## Suggested implementation order
1. Project skeleton and design system.
2. Public Azure Bay home/rooms experience.
3. Authentication and RBAC.
4. Room inventory and availability.
5. Reservations and guest profiles.
6. Check-in/out and billing.
7. Housekeeping, maintenance and service requests.
8. Notifications, feedback and reports.
9. Hardening, tests, performance, accessibility and documentation.
10. Final demo video and submission package.

## Environment baseline
```text
Node.js
Express
React + Vite
MongoDB
Socket.IO (real-time status/events)
Redis (optional, for cache/jobs/rate limiting at scale)
```
