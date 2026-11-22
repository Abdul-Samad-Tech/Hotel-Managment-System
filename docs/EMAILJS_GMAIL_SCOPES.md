# Fix: `Gmail_API: Request had insufficient authentication scopes`

This error comes from **Google / EmailJS**, not from the HMS app code. Gmail was connected without permission to send mail.

## Fix (recommended) — reconnect Gmail

1. Open [EmailJS Dashboard](https://dashboard.emailjs.com/) → **Email Services**.
2. Open the Gmail service used by `VITE_EMAILJS_SERVICE_ID` (e.g. `service_mpji3kb`).
3. Click **Connect Account** (or disconnect, then connect again).
4. Sign in with the same Google account.
5. When Google asks for permissions, **allow all** (especially send / Gmail compose scopes). Do not skip optional scopes.
6. Save the service.
7. Retry signup → **Send verification code**.

If Google still shows an old grant: [Google Account → Third-party access](https://myaccount.google.com/permissions) → remove **EmailJS** → reconnect from step 3.

## Alternative — use another EmailJS service

If Gmail keeps failing:

1. EmailJS → **Email Services** → **Add New Service**.
2. Choose **Outlook** or **EmailJS** (their relay), not Gmail API.
3. Connect / create the service and copy the new **Service ID**.
4. Put it in `frontend/.env`:

```env
VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
```

5. Restart the Vite client (`npm run dev` in `client`).
6. Point both invoice + OTP templates at this service (EmailJS → Email Templates → each template’s service).

## Template reminder

For OTP / invoice templates:

- **To Email:** `{{to_email}}`
- **To Name:** `{{to_name}}`

OTP HTML: `docs/emailjs-otp-template.html`.
