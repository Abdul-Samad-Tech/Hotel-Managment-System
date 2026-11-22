import { motion, useReducedMotion } from "framer-motion";
import { duration, easeTide, tideDelay, viewportOnce } from "../../lib/motion";

export function DrawIcon({ d, paths, circles = [], className = "", delay = 0, viewBox = "0 0 24 24", play = false }) {
  const reduce = useReducedMotion();
  const strokes = paths ?? (d ? [d] : []);
  const rings = circles ?? [];

  return (
    <svg viewBox={viewBox} className={className} aria-hidden="true" fill="none">
      {strokes.map((path, index) => (
        <motion.path
          key={`${index}-${path.slice(0, 12)}`}
          d={path}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: reduce ? 1 : 0 }}
          {...(play ? { animate: { pathLength: 1 } } : { whileInView: { pathLength: 1 }, viewport: viewportOnce })}
          transition={{
            duration: reduce ? duration.micro : duration.reveal,
            delay: reduce ? 0 : delay + tideDelay(index),
            ease: easeTide,
          }}
        />
      ))}
      {rings.map((circle, index) => (
        <motion.circle
          key={`${circle.cx}-${circle.cy}`}
          cx={circle.cx}
          cy={circle.cy}
          r={circle.r}
          stroke="currentColor"
          strokeWidth="1.5"
          initial={{ pathLength: reduce ? 1 : 0 }}
          {...(play ? { animate: { pathLength: 1 } } : { whileInView: { pathLength: 1 }, viewport: viewportOnce })}
          transition={{
            duration: reduce ? duration.micro : duration.reveal,
            delay: reduce ? 0 : delay + tideDelay(strokes.length + index),
            ease: easeTide,
          }}
        />
      ))}
    </svg>
  );
}
