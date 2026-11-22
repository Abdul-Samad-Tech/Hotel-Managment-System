import { motion, useReducedMotion } from "framer-motion";
import { duration, easeTide, viewportOnce } from "../../lib/motion";

export function ScriptBadge({ className = "", inView = false }) {
  const reduce = useReducedMotion();
  const play = inView
    ? { whileInView: true, viewport: viewportOnce }
    : { animate: true };

  return (
    <div className={`pointer-events-none select-none text-center ${className}`}>
      <motion.p
        className="font-script text-[2.75rem] leading-none text-white drop-shadow-[0_6px_16px_rgba(0,0,0,0.35)]"
        initial={reduce ? false : { clipPath: "inset(0 100% 0 0)" }}
        animate={play.animate ? { clipPath: "inset(0 0% 0 0)" } : undefined}
        whileInView={play.whileInView ? { clipPath: "inset(0 0% 0 0)" } : undefined}
        viewport={play.viewport}
        transition={{ duration: reduce ? duration.micro : duration.reveal, delay: reduce ? 0 : 0.85, ease: easeTide }}
      >
        Good Vibes Only
      </motion.p>
      <svg viewBox="0 0 180 18" className="mx-auto mt-1 h-4 w-40 text-gold" aria-hidden="true">
        <motion.path
          d="M4 11c14-8 28-8 42 0s28 8 42 0 28-8 42 0 28 8 46 0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={{ pathLength: reduce ? 1 : 0 }}
          animate={play.animate ? { pathLength: 1 } : undefined}
          whileInView={play.whileInView ? { pathLength: 1 } : undefined}
          viewport={play.viewport}
          transition={{ duration: reduce ? duration.micro : 1.05, delay: reduce ? 0 : 1.05, ease: easeTide }}
        />
      </svg>
    </div>
  );
}
