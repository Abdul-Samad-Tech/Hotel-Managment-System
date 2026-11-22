import emailjs from "@emailjs/browser";

function env(name) {
  const value = import.meta.env[name];
  return typeof value === "string" ? value.trim() : "";
}

const serviceId = () => env("VITE_EMAILJS_SERVICE_ID");
const templateId = () => env("VITE_EMAILJS_TEMPLATE_ID");
const otpTemplateId = () => env("VITE_EMAILJS_OTP_TEMPLATE_ID");
const publicKey = () => env("VITE_EMAILJS_PUBLIC_KEY");

export function emailjsConfigured() {
  return Boolean(serviceId() && templateId() && publicKey());
}

/** Turn EmailJS / network failures into a toast-safe string (never empty). */
export function emailjsErrorMessage(error) {
  if (!error) return "Could not send the email. Try again.";
  if (typeof error === "string" && error.trim()) return explainEmailjsText(error.trim());
  const text = error.text || error.message || error.statusText || "";
  if (String(text).trim()) return explainEmailjsText(String(text).trim());
  if (error.status === 412 || error.status === 422) {
    return "EmailJS template rejected the send. Set To Email to {{to_email}} and check the template ID.";
  }
  if (error.status === 400) {
    return "EmailJS request was invalid. Check service ID, template ID, and public key in frontend/.env.";
  }
  if (error.status === 403 || error.status === 401) {
    return "EmailJS blocked the request. Confirm the public key and that this domain is allowed.";
  }
  if (error.status) return `Email service error (${error.status}). Check your EmailJS template settings.`;
  return "Could not send the email. Check EmailJS settings and try again.";
}

function explainEmailjsText(text) {
  if (/insufficient authentication scopes|Gmail_API/i.test(text)) {
    return "Gmail in EmailJS needs re-connect with send permission. EmailJS → Email Services → your Gmail → Connect Account again (allow all requested scopes), or add a new service (Outlook / EmailJS). See docs/EMAILJS_GMAIL_SCOPES.md.";
  }
  return text;
}

async function sendTemplate(id, params) {
  if (!emailjsConfigured()) {
    throw new Error("EmailJS is not configured. Add VITE_EMAILJS_* keys in frontend/.env, then restart the client.");
  }
  if (!id) {
    throw new Error("EmailJS template ID is missing.");
  }
  try {
    return await emailjs.send(serviceId(), id, params, { publicKey: publicKey() });
  } catch (error) {
    const wrapped = new Error(emailjsErrorMessage(error));
    wrapped.cause = error;
    wrapped.status = error?.status;
    throw wrapped;
  }
}

/**
 * Sends an invoice summary via EmailJS.
 * Template vars: to_email, to_name, invoice_number, hotel_name, total, lines, status
 */
export async function sendInvoiceEmail({
  toEmail,
  toName,
  invoiceNumber,
  hotelName = "Azure Bay",
  total,
  lines,
  status,
}) {
  if (!toEmail) {
    throw new Error("Guest email is required to send the invoice.");
  }
  return sendTemplate(templateId(), {
    to_email: toEmail,
    to_name: toName || "Guest",
    invoice_number: invoiceNumber,
    hotel_name: hotelName,
    total: String(total),
    lines: lines || "",
    status: status || "",
  });
}

/**
 * Sends a signup OTP.
 * Prefers VITE_EMAILJS_OTP_TEMPLATE_ID; falls back to the invoice template if OTP send fails.
 * Template vars: to_email, to_name, otp_code, hotel_name (+ invoice aliases for fallback).
 */
export async function sendOtpEmail({ toEmail, toName, otpCode, hotelName = "Azure Bay" }) {
  if (!toEmail) {
    throw new Error("Email is required to send a verification code.");
  }
  const code = String(otpCode);
  const params = {
    to_email: toEmail,
    to_name: toName || "Guest",
    user_email: toEmail,
    user_name: toName || "Guest",
    otp_code: code,
    passcode: code,
    message: `Your Azure Bay verification code is ${code}. It expires in 10 minutes.`,
    hotel_name: hotelName,
    from_name: hotelName,
    reply_to: toEmail,
    invoice_number: `VERIFY-${code}`,
    total: code,
    lines: `Your Azure Bay verification code is ${code}. It expires in 10 minutes.`,
    status: "verify",
  };

  const preferred = otpTemplateId() || templateId();
  try {
    return await sendTemplate(preferred, params);
  } catch (firstError) {
    const fallback = templateId();
    if (preferred !== fallback && fallback) {
      try {
        return await sendTemplate(fallback, params);
      } catch (secondError) {
        throw secondError;
      }
    }
    throw firstError;
  }
}
