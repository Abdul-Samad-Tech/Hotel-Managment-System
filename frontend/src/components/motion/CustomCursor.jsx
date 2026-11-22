import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { cursorLabelFromEvent } from "../../lib/cursor";
import { CURSOR_INTENT_MS } from "../../lib/cursor.constant";

export function CustomCursor() {
  const reduce = useReducedMotion();
  const [fine, setFine] = useState(false);
  const [hot, setHot] = useState(false);
  const [label, setLabel] = useState("");
  const shownLabel = useRef("");
  const pendingLabel = useRef("");
  const intentTimer = useRef(0);
  const x = useMotionValue(-40);
  const y = useMotionValue(-40);
  const ringX = useSpring(x, { stiffness: 150, damping: 22 });
  const ringY = useSpring(y, { stiffness: 150, damping: 22 });

  useEffect(() => {
    const media = window.matchMedia("(pointer: fine)");
    const sync = () => setFine(media.matches && !reduce);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [reduce]);

  useEffect(() => {
    if (!fine) return undefined;
    document.documentElement.classList.add("azure-cursor");

    function clearIntent() {
      window.clearTimeout(intentTimer.current);
      intentTimer.current = 0;
    }

    const move = (event) => {
      x.set(event.clientX);
      y.set(event.clientY);
      const next = cursorLabelFromEvent(event);
      setHot(next.hot);

      if (!next.label) {
        clearIntent();
        pendingLabel.current = "";
        if (shownLabel.current) {
          shownLabel.current = "";
          setLabel("");
        }
        return;
      }

      if (next.label === shownLabel.current) {
        pendingLabel.current = next.label;
        return;
      }

      if (next.label === pendingLabel.current && intentTimer.current) return;

      clearIntent();
      pendingLabel.current = next.label;
      intentTimer.current = window.setTimeout(() => {
        shownLabel.current = pendingLabel.current;
        setLabel(pendingLabel.current);
        intentTimer.current = 0;
      }, CURSOR_INTENT_MS);
    };

    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      clearIntent();
      document.documentElement.classList.remove("azure-cursor");
      window.removeEventListener("pointermove", move);
    };
  }, [fine, x, y]);

  if (!fine) return null;

  return (
    <>
      <motion.span
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[90] h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold"
        style={{ x, y }}
      />
      <motion.span
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[90] h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/70"
        style={{ x: ringX, y: ringY }}
        animate={{ scale: hot || label ? 1.7 : 1, opacity: hot || label ? 0.9 : 0.5 }}
        transition={{ type: "spring", stiffness: 150, damping: 22 }}
      />
      <motion.span
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[91] -translate-x-1/2 -translate-y-[calc(100%+14px)] rounded-full bg-navy px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-gold uppercase"
        style={{ x: ringX, y: ringY }}
        animate={{ opacity: label ? 1 : 0, scale: label ? 1 : 0.85 }}
        transition={{ type: "spring", stiffness: 150, damping: 22 }}
      >
        {label}
      </motion.span>
    </>
  );
}
