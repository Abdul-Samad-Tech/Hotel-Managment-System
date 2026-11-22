import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLocation, useOutlet } from "react-router-dom";
import { duration, easeFlow } from "../../lib/motion";

/** Full-viewport navy wipe on pathname changes. Skipped on the first load. */
export function RouteWipe() {
  const { pathname, hash } = useLocation();
  const reduce = useReducedMotion();
  const first = useRef(true);
  const [wipePath, setWipePath] = useState(null);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!hash) window.scrollTo(0, 0);
    setWipePath(pathname);
    // Hash-only jumps stay on the page. The wipe follows a real route change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (reduce || !wipePath) return null;

  return (
    <motion.div
      key={wipePath}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60] bg-navy"
      initial={{ x: "-100%" }}
      animate={{ x: "100%" }}
      transition={{ duration: duration.wipe, ease: easeFlow }}
      onAnimationComplete={() => setWipePath(null)}
    />
  );
}

export function PageTransition() {
  const { pathname } = useLocation();
  const outlet = useOutlet();
  const reduce = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduce ? duration.micro : duration.wipe, ease: easeFlow }}
      >
        {outlet}
      </motion.div>
    </AnimatePresence>
  );
}
