# Phase 2 — Invoice print + EmailJS + settings

**Date:** 2026-10-08  
**Status:** Done

## Printable invoice

Front desk invoice panel includes `#invoice-print` (hotel name, guest, lines, totals). Global print CSS in `frontend/src/index.css` prints only that block.

## EmailJS

Package: `@emailjs/browser`  
Helper: `frontend/src/lib/emailjs.js`

### Client env (`frontend/.env`)

```env
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

See also `frontend/.env.example`.

### Template variables

| Variable | Meaning |
|----------|---------|
| `to_email` | Guest email |
| `to_name` | Guest name |
| `invoice_number` | Invoice number |
| `hotel_name` | From settings `hotelName` |
| `total` | Grand total string |
| `lines` | Line items text |
| `status` | Invoice status |

If env keys are missing, **Email invoice** shows a clear error and does not break charges/payments.

### Branded HTML template

Copy [`docs/emailjs-invoice-template.html`](emailjs-invoice-template.html) into the EmailJS template HTML editor (Azure Bay navy / cream / gold).

### Where EmailJS is used in the app

| Place | What |
|-------|------|
| `frontend/src/lib/emailjs.js` | Helper only (`emailjsConfigured`, `sendInvoiceEmail`) |
| `frontend/src/pages/PortalPage.jsx` → **Front desk** | **Email invoice** button after opening a bill |

Not used on public pages (home, rooms, booking, contact, auth). Only staff front desk sends invoices.

## Settings

Admin **Settings** loads `GET /settings` and saves `hotelName`, `currency`, `taxRate`. Room rates remain on RoomType (Inventory).
