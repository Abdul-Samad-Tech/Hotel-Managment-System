import { motion, useReducedMotion } from "framer-motion";
import { duration, easeTide, tideDelay, viewportOnce } from "../../lib/motion";

/**
 * Line mask reveal. Inspired by 21st.dev MaskedTextReveal (clip + rise),
 * rewritten to take explicit lines so the hero breaks stay designed, not measured.
 */
export function RevealText({ as: Tag = "h2", className = "", lines, delay = 0, inView = false, id }) {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <Tag id={id} className={className}>
        {lines.map((line, index) => (
          <span key={index} className="block">
            {line}
          </span>
        ))}
      </Tag>
    );
  }

  return (
    <Tag id={id} className={className}>
      {lines.map((line, index) => (
        <span key={index} className="block overflow-hidden pb-[0.06em]">
          <motion.span
            className="block"
            initial={{ y: "112%" }}
            animate={inView ? undefined : { y: "0%" }}
            whileInView={inView ? { y: "0%" } : undefined}
            viewport={inView ? viewportOnce : undefined}
            transition={{
              duration: duration.reveal,
              delay: delay + tideDelay(index),
              ease: easeTide,
            }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
