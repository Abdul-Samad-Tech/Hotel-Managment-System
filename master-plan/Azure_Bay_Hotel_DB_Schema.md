# Azure Bay Hotel & Resort - MongoDB Data Model

## Collections

### users
`_id, fullName, email, phone, passwordHash, roleIds[], status, lastLoginAt, createdAt, updatedAt`

### roles
`_id, name, permissions[], createdAt, updatedAt`

### guests
`_id, userId?, fullName, email, phone, nationality?, preferences[], notes?, idProof?, createdAt, updatedAt`

### roomTypes
`_id, name, slug, description, baseRate, maxAdults, maxChildren, bedType, amenities[], gallery[], featured, active`

### rooms
`_id, roomNumber, roomTypeId, floor?, status, features[], maintenanceNote?, active`

### reservations
`_id, confirmationCode, guestId, roomId?, roomTypeId, checkIn, checkOut, adults, children, status, source, nightlyRate, taxes, discount, totalAmount, specialRequests?, createdBy, createdAt, updatedAt`

### stays
`_id, reservationId, checkedInAt, checkedOutAt, keyReference?, notes?, createdBy`

### invoices
`_id, reservationId, guestId, invoiceNumber, currency, subtotal, taxTotal, discountTotal, grandTotal, amountPaid, balanceDue, status, issuedAt?`

### invoiceItems
`_id, invoiceId, category, description, quantity, unitPrice, taxRate, lineTotal, serviceOrderId?`

### payments
`_id, invoiceId, amount, method, reference?, status, paidAt, recordedBy`

### housekeepingTasks
`_id, roomId, type, priority, assignedTo?, scheduledFor, startedAt?, completedAt?, status, notes?`

### maintenanceTickets
`_id, roomId?, reportedBy, category, priority, description, assignedTo?, status, resolutionNote?, openedAt, resolvedAt?`

### serviceRequests
`_id, guestId, reservationId, type, description, priority, assignedTo?, status, requestedAt, completedAt?`

### feedback
`_id, guestId, reservationId?, rating, title?, comment, source, published, createdAt`

### notifications
`_id, recipientUserId, type, title, message, link?, readAt?, createdAt`

### systemSettings
`_id, key, value, type, updatedBy, updatedAt`

### auditLogs
`_id, actorUserId, action, entityType, entityId, before?, after?, ip?, userAgent?, createdAt`

## Critical indexes
- `users.email` unique.
- `guests.email` and `guests.phone` indexed.
- `rooms.roomNumber` unique; `rooms.roomTypeId + status` indexed.
- `reservations.confirmationCode` unique.
- `reservations.roomId + checkIn + checkOut + status` indexed for availability checks.
- `reservations.guestId + createdAt` indexed.
- `housekeepingTasks.roomId + scheduledFor + status` indexed.
- `maintenanceTickets.status + priority + openedAt` indexed.
- `notifications.recipientUserId + readAt + createdAt` indexed.

## Validation / integrity
- Check-out must be after check-in.
- Guest count cannot exceed room type occupancy rules.
- Reservation status transitions enforced in the service layer.
- Money stored as integer minor units (e.g. cents) or Decimal128 consistently; never binary floating point.
- Reference fields use ObjectId.
- Soft-deactivate rooms/users instead of destructive deletion when history exists.
