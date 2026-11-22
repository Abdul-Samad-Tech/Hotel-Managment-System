import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { duration, easeTide } from "../../lib/motion";

const storageKey = "azure-bay-seen";

function firstVisit() {
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    return sessionStorage.getItem(storageKey) !== "1";
  } catch {
    return false;
  }
}

export function Preloader() {
  const [show, setShow] = useState(firstVisit);

  useEffect(() => {
    if (!show) return undefined;
    const id = window.setTimeout(() => {
      sessionStorage.setItem(storageKey, "1");
      setShow(false);
    }, 1500);
    return () => window.clearTimeout(id);
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[80] grid place-items-center bg-navy"
          exit={{ y: "-100%" }}
          transition={{ duration: duration.ui, ease: easeTide }}
        >
          <svg viewBox="0 0 64 28" className="h-8 w-16 text-gold" aria-hidden="true">
            <motion.path
              d="M2 16c8-10 16-10 24 0s16 10 24 0 10-8 12-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: duration.reveal, ease: easeTide }}
            />
          </svg>
          <span className="sr-only">Azure Bay is opening</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
