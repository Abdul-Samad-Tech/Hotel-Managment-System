import { useReducedMotion } from "framer-motion";
import { ReactLenis } from "lenis/react";
import "lenis/dist/lenis.css";

const options = {
  lerp: 0.1,
  autoRaf: true,
  smoothWheel: true,
  syncTouch: false,
  anchors: false,
};

export function SmoothScroll({ children }) {
  const reduce = useReducedMotion();
  if (reduce !== false) return children;

  return (
    <ReactLenis root options={options}>
      {children}
    </ReactLenis>
  );
}
