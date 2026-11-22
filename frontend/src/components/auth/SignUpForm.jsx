import { Lock, Mail, Phone, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { sendOtpEmail, emailjsConfigured, emailjsErrorMessage } from "../../lib/emailjs";
import { duration, easeTide } from "../../lib/motion";
import { homeFor } from "../../lib/roles";
import { AuthCheck, AuthInput, AuthOtp, AuthProviders, Field, SlideError, fieldParent } from "./AuthInput";
import { SubmitButton } from "./SignInForm";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_KEY = "azure-bay-signup-otp";

function makeOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function SignUpForm({ onNotice, onSignedIn }) {
  const reduce = useReducedMotion();
  const { register } = useAuth();
  const [values, setValues] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
    terms: false,
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState("details");
  const [code, setCode] = useState("");
  const codeRef = useRef("");
  const sent = useRef(false);

  useEffect(() => {
    document.getElementById("signup-name")?.focus();
  }, []);

  function setField(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined, form: undefined }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    const next = {};
    if (values.fullName.trim().length < 2) next.fullName = "Enter your full name.";
    if (!values.email.trim()) next.email = "Email is required.";
    else if (!emailPattern.test(values.email.trim())) next.email = "Enter a valid email address.";
    const digits = values.phone.replace(/\D/g, "");
    if (!values.phone.trim()) next.phone = "Phone number is required.";
    else if (digits.length < 7) next.phone = "Enter a valid phone number.";
    if (!values.password) next.password = "Password is required.";
    else if (values.password.length < 8) next.password = "Use at least 8 characters.";
    if (!values.confirm) next.confirm = "Confirm your password.";
    else if (values.confirm !== values.password) next.confirm = "Passwords do not match.";
    if (!values.terms) next.terms = "Please accept the terms to continue.";
    setErrors(next);
    if (Object.keys(next).length) {
      onNotice("Check the highlighted fields.");
      return;
    }
    if (!emailjsConfigured()) {
      const msg = "Email is not configured. Add VITE_EMAILJS_* keys in frontend/.env, then restart npm run dev.";
      setErrors({ form: msg });
      onNotice(msg);
      return;
    }

    setBusy(true);
    try {
      const otp = makeOtp();
      await sendOtpEmail({
        toEmail: values.email.trim(),
        toName: values.fullName.trim(),
        otpCode: otp,
      });
      sessionStorage.setItem(
        OTP_KEY,
        JSON.stringify({
          otp,
          expiresAt: Date.now() + 10 * 60 * 1000,
          payload: {
            fullName: values.fullName.trim(),
            email: values.email.trim(),
            phone: values.phone.trim(),
            password: values.password,
          },
        }),
      );
      setStage("verify");
      setCode("");
      codeRef.current = "";
      sent.current = false;
      onNotice("Verification code sent. Check your inbox (and spam).");
    } catch (error) {
      const msg = emailjsErrorMessage(error);
      setErrors({ form: msg });
      onNotice(msg);
    } finally {
      setBusy(false);
    }
  }

  async function finish(next) {
    if (sent.current || busy) return;
    const raw = typeof next === "string" ? next : codeRef.current;
    const digits = raw.replace(/\D/g, "");
    if (digits.length !== 6) {
      setErrors({ code: "Enter all 6 digits." });
      onNotice("Enter all 6 digits.");
      return;
    }
    let stored;
    try {
      stored = JSON.parse(sessionStorage.getItem(OTP_KEY) || "null");
    } catch {
      stored = null;
    }
    if (!stored?.otp || !stored?.payload) {
      setErrors({ code: "Code expired. Start sign-up again." });
      onNotice("Code expired. Start sign-up again.");
      setStage("details");
      return;
    }
    if (Date.now() > stored.expiresAt) {
      sessionStorage.removeItem(OTP_KEY);
      setErrors({ code: "Code expired. Start sign-up again." });
      onNotice("Code expired. Start sign-up again.");
      setStage("details");
      return;
    }
    if (digits !== stored.otp) {
      setErrors({ code: "That code does not match." });
      onNotice("That code does not match.");
      return;
    }

    sent.current = true;
    setBusy(true);
    try {
      const user = await register(stored.payload);
      sessionStorage.removeItem(OTP_KEY);
      onSignedIn(homeFor(user.role), "Your Azure Bay account is ready.");
    } catch (error) {
      sent.current = false;
      const msg = error?.message?.trim() || "Could not create the account. Try again.";
      setErrors({ code: msg });
      onNotice(msg);
    } finally {
      setBusy(false);
    }
  }

  if (stage === "verify") {
    return (
      <motion.form
        onSubmit={(event) => {
          event.preventDefault();
          finish();
        }}
        noValidate
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduce ? { duration: duration.micro } : { duration: duration.ui, ease: easeTide }}
      >
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-gold">Verify</p>
        <h1 className="mt-1 font-display text-[1.75rem] leading-none font-medium text-navy">
          Enter your <span className="text-gold italic">code</span>
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          We emailed a 6-digit code to <span className="font-semibold text-navy">{values.email}</span>. It expires in 10 minutes.
        </p>
        <div className="mt-5">
          <AuthOtp
            value={code}
            onChange={(next) => {
              codeRef.current = next;
              setCode(next);
              setErrors({});
            }}
            onComplete={finish}
            error={errors.code}
          />
        </div>
        <div className="mt-2">
          <SlideError id="signup-otp-error">{errors.code}</SlideError>
        </div>
        <SubmitButton busy={busy} label="Verify & create account" compact />
        <p className="mt-3 text-center text-sm text-muted">
          Wrong email?{" "}
          <button
            type="button"
            className="cursor-pointer font-semibold text-gold italic hover:underline"
            onClick={() => {
              sessionStorage.removeItem(OTP_KEY);
              setStage("details");
            }}
          >
            Go back
          </button>
        </p>
      </motion.form>
    );
  }

  return (
    <motion.form
      onSubmit={onSubmit}
      noValidate
      variants={reduce ? undefined : fieldParent}
      initial={reduce ? false : "hidden"}
      animate="show"
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
    >
      <Field>
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-gold">Sign Up</p>
      </Field>
      <Field>
        <h1 className="mt-1 font-display text-[1.75rem] leading-none font-medium text-navy">
          Create Your <span className="text-gold italic">Account</span>
        </h1>
      </Field>

      <Field className="mt-3 grid gap-2">
        <AuthInput
          id="signup-name"
          label="Full Name"
          icon={UserRound}
          autoComplete="name"
          compact
          value={values.fullName}
          onChange={(event) => setField("fullName", event.target.value)}
          error={errors.fullName}
        />
        <AuthInput
          id="signup-email"
          label="Email"
          type="email"
          icon={Mail}
          autoComplete="email"
          compact
          value={values.email}
          onChange={(event) => setField("email", event.target.value)}
          error={errors.email}
        />
        <AuthInput
          id="signup-phone"
          label="Phone"
          type="tel"
          icon={Phone}
          autoComplete="tel"
          compact
          value={values.phone}
          onChange={(event) => setField("phone", event.target.value)}
          error={errors.phone}
        />
        <AuthInput
          id="signup-password"
          label="Password"
          type="password"
          icon={Lock}
          autoComplete="new-password"
          compact
          meter
          value={values.password}
          onChange={(event) => setField("password", event.target.value)}
          error={errors.password}
        />
        <AuthInput
          id="signup-confirm"
          label="Confirm Password"
          type="password"
          icon={Lock}
          autoComplete="new-password"
          compact
          value={values.confirm}
          onChange={(event) => setField("confirm", event.target.value)}
          error={errors.confirm}
        />
      </Field>

      <Field className="mt-2.5">
        <AuthCheck
          id="signup-terms"
          checked={values.terms}
          onChange={(event) => setField("terms", event.target.checked)}
          error={errors.terms}
        >
          I agree to the stay terms and guest privacy notice.
        </AuthCheck>
      </Field>

      <div className="mt-3">
        <SlideError id="signup-form-error">{errors.form}</SlideError>
      </div>

      <Field>
        <SubmitButton busy={busy} label="Send verification code" compact />
        <AuthProviders onNotice={onNotice} compact />
        <p className="mt-3 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-gold italic hover:underline">
            Sign In
          </Link>
        </p>
      </Field>
    </motion.form>
  );
}
