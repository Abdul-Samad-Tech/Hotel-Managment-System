import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { OTPInput, REGEXP_ONLY_DIGITS } from "input-otp";
import { duration, easeTide, springSoft } from "../../lib/motion";
import { InlineError } from "../ui/InlineError";

export const fieldParent = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

export const fieldItem = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

export function Field({ children, className = "" }) {
  const reduce = useReducedMotion();
  return (
    <motion.div className={className} variants={reduce ? undefined : fieldItem} initial={reduce ? false : undefined}>
      {children}
    </motion.div>
  );
}

export function SlideError({ id, children }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence initial={false}>
      {children ? (
        <motion.div
          key="error"
          initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
          animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
          transition={{ duration: duration.micro, ease: easeTide }}
          className="overflow-hidden"
        >
          <InlineError id={id}>{children}</InlineError>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function strengthScore(password) {
  if (!password) return 0;
  let score = 1;
  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(score, 4);
}

const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"];
const strengthFill = ["", "bg-rose-600", "bg-gold/70", "bg-gold", "bg-navy"];

function StrengthMeter({ id, password }) {
  if (!password) return null;
  const score = strengthScore(password);
  const label = strengthLabel[score];
  return (
    <div className="mt-2" id={id}>
      <div
        className="flex gap-1"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={4}
        aria-valuenow={score}
        aria-valuetext={label}
        aria-label="Password strength"
      >
        {[1, 2, 3, 4].map((segment) => (
          <span
            key={segment}
            className={`h-1 flex-1 rounded-full ${segment <= score ? strengthFill[score] : "bg-navy/10"}`}
          />
        ))}
      </div>
      <p className="mt-1 text-[11px] tracking-wide text-muted">{label}</p>
    </div>
  );
}

export function AuthInput({
  id,
  label,
  type = "text",
  icon: Icon,
  value,
  onChange,
  error,
  autoComplete,
  name,
  compact = false,
  meter = false,
}) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const strengthId = `${id}-strength`;
  const describedBy = [error ? `${id}-error` : null, meter && value ? strengthId : null].filter(Boolean).join(" ") || undefined;

  const floated =
    "peer-focus:-translate-y-[1.15rem] peer-focus:scale-[0.82] peer-[:not(:placeholder-shown)]:-translate-y-[1.15rem] peer-[:not(:placeholder-shown)]:scale-[0.82] motion-reduce:transition-none";

  return (
    <div>
      <div
        className={`relative flex items-center gap-2 border-b-2 bg-transparent px-1 transition-[border-color] duration-200 ${
          compact ? "h-12" : "h-14"
        } ${error ? "border-rose-600" : "border-navy/15"} focus-within:border-gold`}
      >
        {Icon && <Icon className="h-4 w-4 shrink-0 text-navy/40" strokeWidth={1.6} aria-hidden="true" />}
        <input
          id={id}
          name={name || id}
          type={isPassword && visible ? "text" : type}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          placeholder=" "
          className="peer w-full bg-transparent pt-3 text-sm text-navy outline-none placeholder:text-transparent"
        />
        <label
          htmlFor={id}
          className={`pointer-events-none absolute top-1/2 origin-left -translate-y-1/2 text-sm text-navy/45 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            Icon ? "left-7" : "left-1"
          } ${floated}`}
        >
          {label}
        </label>
        {isPassword && (
          <button
            type="button"
            className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full text-navy/50 hover:text-navy focus-visible:outline-2 focus-visible:outline-gold"
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            onClick={() => setVisible((current) => !current)}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {meter && <StrengthMeter id={strengthId} password={value} />}
      <SlideError id={`${id}-error`}>{error}</SlideError>
    </div>
  );
}

export function AuthCheck({ id, checked, onChange, children, error }) {
  const reduce = useReducedMotion();
  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-2.5 text-sm text-navy">
        <span className="relative mt-0.5 grid h-5 w-5 shrink-0">
          <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={onChange}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            className="peer absolute inset-0 z-10 cursor-pointer opacity-0"
          />
          <motion.span
            aria-hidden="true"
            className="pointer-events-none grid h-5 w-5 place-items-center rounded-[5px] border peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold"
            initial={false}
            animate={{
              backgroundColor: checked ? "#F2C078" : "#ffffff",
              borderColor: checked ? "#F2C078" : "rgba(11,31,51,0.28)",
            }}
            transition={{ duration: duration.micro, ease: easeTide }}
          >
            <svg viewBox="0 0 16 16" className="h-3 w-3 text-navy">
              <motion.path
                d="M3.2 8.2 6.4 11.3 12.8 4.8"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={false}
                animate={{ pathLength: checked ? 1 : 0, opacity: checked || reduce ? 1 : 0 }}
                transition={reduce ? { duration: 0 } : { duration: duration.micro, ease: easeTide }}
              />
            </svg>
          </motion.span>
        </span>
        <span>{children}</span>
      </label>
      <SlideError id={`${id}-error`}>{error}</SlideError>
    </div>
  );
}

export function AuthOtp({ id = "verify-code", value, onChange, onComplete, error }) {
  return (
    <div>
      <OTPInput
        id={id}
        maxLength={6}
        value={value}
        onChange={onChange}
        onComplete={onComplete}
        pattern={REGEXP_ONLY_DIGITS}
        inputMode="numeric"
        autoComplete="one-time-code"
        aria-label="6-digit code"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        containerClassName="group flex items-center"
        render={({ slots }) => (
          <div className="flex w-full gap-2">
            {slots.map((slot, index) => (
              <div
                key={index}
                className={`relative grid h-12 min-w-0 flex-1 place-items-center border-b-2 font-display text-xl text-navy ${
                  slot.isActive ? "border-gold" : "border-navy/20"
                }`}
              >
                {slot.char ?? slot.placeholderChar}
                {slot.hasFakeCaret ? <span className="pointer-events-none absolute h-5 w-px bg-gold" /> : null}
              </div>
            ))}
          </div>
        )}
      />
      <SlideError id={`${id}-error`}>{error}</SlideError>
    </div>
  );
}

export function AuthProviders({ onNotice, compact = false }) {
  return (
    <div className={compact ? "mt-3" : "mt-5"}>
      <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-muted">
        <span className="h-px flex-1 bg-navy/10" />
        or continue with
        <span className="h-px flex-1 bg-navy/10" />
      </div>
      <div className={`grid grid-cols-2 gap-3 ${compact ? "mt-2" : "mt-4"}`}>
        <SocialButton onClick={() => onNotice("Google sign-in connects when the account service is live.")}>
          <GoogleMark />
          Google
        </SocialButton>
        <SocialButton onClick={() => onNotice("Apple sign-in connects when the account service is live.")}>
          <AppleMark />
          Apple
        </SocialButton>
      </div>
    </div>
  );
}

function SocialButton({ children, onClick }) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={reduce ? undefined : { y: -2 }}
      whileTap={reduce ? undefined : { scale: 0.98 }}
      transition={springSoft}
      className={socialClass}
    >
      {children}
    </motion.button>
  );
}

const socialClass =
  "inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full border border-navy/15 bg-white text-sm font-medium text-navy hover:border-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.5Z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.8-1 7.7-2.8l-3.7-2.9c-1 .7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.6v3A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.4 14.6A7.2 7.2 0 0 1 5 12c0-.9.1-1.8.4-2.6V6.4H1.6A12 12 0 0 0 0 12c0 1.9.5 3.8 1.6 5.6l3.8-3Z" />
      <path fill="#EA4335" d="M12 4.8c1.7 0 3.3.6 4.5 1.8l3.4-3.4C17.8 1.1 15.2 0 12 0A12 12 0 0 0 1.6 6.4l3.8 3C6.3 6.9 8.9 4.8 12 4.8Z" />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M16.4 12.7c0-2.2 1.8-3.2 1.9-3.3-1-1.5-2.6-1.7-3.2-1.7-1.3-.1-2.6.8-3.3.8-.7 0-1.7-.8-2.9-.7-1.5 0-2.8.9-3.6 2.2-1.5 2.6-.4 6.5 1.1 8.7.7 1 1.6 2.2 2.7 2.2 1.1 0 1.5-.7 2.8-.7s1.7.7 2.9.7 1.9-1.1 2.6-2.2c.8-1.2 1.2-2.3 1.2-2.4-.1 0-2.2-.9-2.2-3.6ZM14.7 6.9c.6-.7 1-1.7.9-2.7-1 .1-2.1.6-2.7 1.4-.6.7-1.1 1.7-1 2.6 1.1.1 2.1-.5 2.8-1.3Z" />
    </svg>
  );
}
