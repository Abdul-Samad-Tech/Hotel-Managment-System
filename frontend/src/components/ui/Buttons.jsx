import { motion, useReducedMotion } from "framer-motion";
import { springSoft } from "../../lib/motion";
import { TextRoll } from "../motion/TextRoll";

const focus =
  "cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";

export function PillButton({
  variant = "gold",
  size = "md",
  className = "",
  children,
  href,
  roll = false,
  ...props
}) {
  const reduce = useReducedMotion();
  const styles = {
    gold: "bg-gold text-navy shadow-[0_10px_28px_rgba(242,192,120,0.38)] hover:bg-gold-deep",
    navy: "bg-navy text-white hover:bg-[#16324a]",
    outline:
      "border border-white/80 bg-transparent text-white hover:bg-white hover:text-navy",
  };
  const sizes = {
    md: "px-5 py-3 text-sm",
    sm: "min-h-11 px-4 text-[13px]",
  };
  const classes = `group inline-flex items-center justify-center gap-2 rounded-full font-semibold ${sizes[size]} ${focus} ${styles[variant]} ${className}`;
  const motionProps = reduce
    ? {}
    : { whileTap: { scale: 0.98 }, transition: springSoft };
  const label = roll ? <TextRoll>{children}</TextRoll> : children;

  if (href) {
    return (
      <motion.a href={href} className={classes} {...motionProps} {...props}>
        {label}
      </motion.a>
    );
  }

  return (
    <motion.button type="button" className={classes} {...motionProps} {...props}>
      {label}
    </motion.button>
  );
}

export function CircleButton({
  label,
  variant = "navy",
  className = "",
  children,
  href,
  ...props
}) {
  const reduce = useReducedMotion();
  const styles = {
    navy: "border border-white/10 bg-navy text-white hover:bg-[#16324a]",
    light: "border border-navy/10 bg-white text-navy shadow-sm hover:border-gold",
    outline:
      "border border-white/80 bg-white/10 text-white backdrop-blur-sm hover:bg-white hover:text-navy",
  };
  const classes = `inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${focus} ${styles[variant]} ${className}`;
  const motionProps = reduce
    ? {}
    : { whileHover: { scale: 1.04 }, whileTap: { scale: 0.98 }, transition: springSoft };

  if (href) {
    return (
      <motion.a href={href} aria-label={label} className={classes} {...motionProps} {...props}>
        {children}
      </motion.a>
    );
  }

  return (
    <motion.button type="button" aria-label={label} className={classes} {...motionProps} {...props}>
      {children}
    </motion.button>
  );
}

export function Eyebrow({ children, className = "" }) {
  return (
    <p className={`text-[11px] font-medium uppercase tracking-[0.28em] text-gold ${className}`}>
      {children}
    </p>
  );
}
