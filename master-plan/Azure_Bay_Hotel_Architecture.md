# Azure Bay Hotel & Resort - MERN Technical Architecture

## 1. Source baseline
The implementation is derived from the submitted LuxuryStay Hospitality HMS eProject brief and the supplied Azure Bay landing-page reference UI. The SRS requires user/staff/guest management, room inventory and booking, reservation/check-in/out, billing/invoicing, housekeeping/maintenance, reporting/analytics, authentication/RBAC, feedback/services, system settings, notifications, performance, security, privacy, reliability, responsive usability, cross-browser support, horizontal scalability, monitoring, testing, documentation, and a complete working video.

## 2. Product naming map
- **Business/domain name in SRS:** LuxuryStay Hospitality.
- **Presented hotel brand/UI:** Azure Bay Hotel & Resort.
- **Implementation rule:** Keep the backend domain model brand-neutral enough for a hotel chain, while seed data and public copy use Azure Bay. This avoids rewriting the SRS while matching the approved UI.

## 3. Recommended architecture: modular monolith
For an eProject, use a **modular monolith** rather than premature microservices. It keeps deployment and debugging manageable while preserving clear bounded modules so the backend can later be split horizontally or by service.

```text
Browser / Mobile Browser
        |
        v
React + Vite SPA  -----> CDN / Static Hosting
        |
        | HTTPS REST + Socket.IO
        v
Node.js + Express API
        |
        +-- Auth / RBAC
        +-- Users & Guests
        +-- Rooms & Room Types
        +-- Reservations & Stays
        +-- Billing & Payments
        +-- Housekeeping
        +-- Maintenance
        +-- Services / Requests
        +-- Feedback
        +-- Reports / Analytics
        +-- Notifications
        +-- Settings / Audit
        |
        +-------------> MongoDB (primary data store)
        +-------------> Redis (optional: cache, rate limits, jobs)
        +-------------> Object Storage (room/gallery/media assets)
        +-------------> Email/SMS provider (optional integration)
```

## 4. Frontend architecture
**Stack**
- React
- Vite
- React Router
- TanStack Query for server state
- React Hook Form + Zod for forms/validation
- Tailwind CSS or CSS Modules with design tokens
- Lucide/Phosphor-style outline icons (use one consistent icon family)
- Socket.IO client for staff-side live status updates

**Structure**
```text
src/
  app/
    router/
    providers/
    queryClient/
  assets/
  components/
    ui/
    layout/
    booking/
    rooms/
    dashboards/
  features/
    auth/
    guests/
    rooms/
    reservations/
    billing/
    housekeeping/
    maintenance/
    services/
    feedback/
    reports/
    notifications/
    settings/
  pages/
    public/
    guest/
    staff/
    admin/
  hooks/
  lib/
  services/api/
  types/
  styles/
```

## 5. Backend architecture
```text
backend/
  src/
    config/
    middleware/
    common/
      errors/
      validators/
      utils/
    modules/
      auth/
      users/
      guests/
      rooms/
      room-types/
      reservations/
      stays/
      billing/
      housekeeping/
      maintenance/
      services/
      feedback/
      reports/
      notifications/
      settings/
      audit/
    routes/
    jobs/
    sockets/
    app.ts
    server.ts
```

Each module should follow **route -> controller -> service -> repository/model**. Business rules stay in services rather than controllers.

## 6. Core domain rules
### Reservation
Statuses: `pending -> confirmed -> checked_in -> checked_out`; exception paths include `cancelled` and `no_show`.

### Room
Statuses: `available`, `reserved`, `occupied`, `cleaning`, `maintenance`, `out_of_service`.

### Housekeeping task
Statuses: `assigned`, `in_progress`, `completed`, `blocked`.

### Maintenance ticket
Statuses: `open`, `assigned`, `in_progress`, `resolved`, `closed`.

### Invoice
Statuses: `draft`, `issued`, `partially_paid`, `paid`, `void`.

## 7. Booking transaction strategy
1. Validate check-in/check-out dates and guest count.
2. Query eligible room types/rooms for the requested interval.
3. Re-check availability inside a MongoDB transaction where applicable.
4. Create reservation and hold the room assignment atomically.
5. Calculate rate, taxes, add-ons, and discount rules.
6. Create confirmation record.
7. Emit a notification event and log an audit entry.

A unique/compound strategy must prevent overlapping allocations. Availability queries should use indexed date fields and reservation status filters.

## 8. Security design
- HTTPS in all deployed environments.
- Password hashing with Argon2id preferred; bcrypt is acceptable for a simplified academic implementation.
- HttpOnly, Secure, SameSite cookies for session/refresh credentials.
- Short-lived access token + rotating refresh token, or secure server sessions.
- RBAC for `admin`, `manager`, `receptionist`, `housekeeping`, `maintenance`, and `guest`.
- Zod/Joi server-side validation even if the client also validates.
- Helmet, rate limiting, strict CORS, request size limits.
- Audit logging for authentication, booking changes, billing actions, role changes, and settings changes.
- Never store raw card data. Payment integration should use a tokenized/hosted payment flow if payments are added.

## 9. Reliability / scalability mapping to SRS
- **1-2 second target:** cache public room/catalog data, paginate admin lists, add proper MongoDB indexes, minimize payloads.
- **Hundreds of concurrent users:** stateless API instances behind a load balancer; Socket.IO with a shared adapter only when scaled beyond one instance.
- **99% uptime target:** health endpoint, process supervision/container restart, managed database backups, monitoring and alerting.
- **Horizontal scaling:** no server-local session state; externalize sessions/cache/job state.
- **Backups:** automated database backups plus recovery procedure documented.

## 10. Observability
Log structured events with request ID, actor/user ID where appropriate, route, latency, HTTP status, and error class. Track:
- API latency p50/p95/p99
- Error rate
- Booking success/failure rate
- Active connections
- Database operation latency
- Background job failures
- Authentication failures

## 11. Testing pyramid
- Unit: domain services, pricing/tax calculations, validation.
- Integration: API + MongoDB test database.
- E2E: booking, check-in/out, invoice generation, housekeeping, maintenance, role restrictions.
- Security: authentication bypass attempts, authorization matrix, input injection, rate-limit verification.
- Responsive/browser: Chrome, Firefox, Edge, Safari; mobile widths.

## 12. Deployment
```text
Git repository
   |
   +--> CI: lint -> typecheck -> unit -> integration -> build
   |
   +--> Frontend build -> static host/CDN
   |
   +--> Backend image -> container platform
   |
   +--> MongoDB managed cluster / secured database
   +--> Redis optional
   +--> Object storage for hotel media
```

Keep secrets in environment variables/secret storage. Never commit `.env` files.
