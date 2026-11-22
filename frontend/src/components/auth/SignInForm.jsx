import { ArrowRight, Loader2, Lock, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { homeFor } from "../../lib/roles";
import { AuthCheck, AuthInput, AuthProviders, Field, SlideError, fieldParent } from "./AuthInput";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignInForm({ onNotice, onSignedIn }) {
  const reduce = useReducedMotion();
  const { login } = useAuth();
  const [values, setValues] = useState({ email: "", password: "", remember: false });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.getElementById("signin-email")?.focus();
  }, []);

  function setField(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined, form: undefined }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    const next = {};
    if (!values.email.trim()) next.email = "Email is required.";
    else if (!emailPattern.test(values.email.trim())) next.email = "Enter a valid email address.";
    if (!values.password) next.password = "Password is required.";
    else if (values.password.length < 8) next.password = "Use at least 8 characters.";
    setErrors(next);
    if (Object.keys(next).length) {
      onNotice("Check the highlighted fields.");
      return;
    }

    setBusy(true);
    try {
      const user = await login(values.email.trim(), values.password);
      onSignedIn(homeFor(user.role), "Welcome back to Azure Bay.");
    } catch (error) {
      setErrors({ form: error.message });
      onNotice(error.message);
    } finally {
      setBusy(false);
    }
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
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-gold">Sign In</p>
      </Field>
      <Field>
        <h1 className="mt-2 font-display text-4xl font-medium text-navy">
          Welcome <span className="text-gold italic">Back</span>
        </h1>
      </Field>

      <Field className="mt-6 grid gap-4">
        <AuthInput
          id="signin-email"
          label="Email"
          type="email"
          icon={Mail}
          autoComplete="email"
          value={values.email}
          onChange={(event) => setField("email", event.target.value)}
          error={errors.email}
        />
        <AuthInput
          id="signin-password"
          label="Password"
          type="password"
          icon={Lock}
          autoComplete="current-password"
          value={values.password}
          onChange={(event) => setField("password", event.target.value)}
          error={errors.password}
        />
      </Field>

      <Field className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 text-sm">
        <AuthCheck id="signin-remember" checked={values.remember} onChange={(event) => setField("remember", event.target.checked)}>
          Remember me
        </AuthCheck>
        <button
          type="button"
          className="cursor-pointer font-medium text-navy underline-offset-4 hover:text-gold hover:underline focus-visible:outline-2 focus-visible:outline-gold"
          onClick={() => onNotice("Password reset will be emailed once mail is connected.")}
        >
          Forgot password?
        </button>
      </Field>

      <div className="mt-3">
        <SlideError id="signin-form-error">{errors.form}</SlideError>
      </div>

      <Field>
        <SubmitButton busy={busy} label="Sign In" />
        <AuthProviders onNotice={onNotice} />
        <p className="mt-6 text-center text-sm text-muted">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-semibold text-gold italic hover:underline">
            Sign Up
          </Link>
        </p>
      </Field>
    </motion.form>
  );
}

export function SubmitButton({ busy, label, compact = false }) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      type="submit"
      disabled={busy}
      whileHover={reduce || busy ? undefined : { y: -2 }}
      whileTap={reduce || busy ? undefined : { scale: 0.98 }}
      className={`group inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-gold text-sm font-semibold text-navy shadow-[0_10px_28px_rgba(242,192,120,0.38)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-wait disabled:opacity-70 ${compact ? "mt-3 h-11" : "mt-5 h-12"}`}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : label}
      {!busy && <ArrowRight className="h-4 w-4 transition duration-300 group-hover:translate-x-1" aria-hidden="true" />}
      <span className="sr-only">{busy ? "Please wait" : ""}</span>
    </motion.button>
  );
}
