import { useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

const pullLimit = 6;

/**
 * Soft cursor pull. The 21st.dev magnetic button tracked the whole document
 * and traveled with the pointer. This version only moves while hovered, and never more than 6px.
 */
export function MagneticButton({ children, className = "" }) {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 22 });
  const springY = useSpring(y, { stiffness: 150, damping: 22 });

  function onMove(event) {
    if (reduce || window.matchMedia("(pointer: coarse)").matches || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    x.set(Math.max(-pullLimit, Math.min(pullLimit, dx * 0.16)));
    y.set(Math.max(-pullLimit, Math.min(pullLimit, dy * 0.16)));
  }

  function reset() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={reduce ? undefined : { x: springX, y: springY }}
      onMouseMove={onMove}
      onMouseLeave={reset}
    >
      {children}
    </motion.div>
  );
}
