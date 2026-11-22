import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { duration } from "../../lib/motion";

export function CountUp({ value, prefix = "", className = "" }) {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [shown, setShown] = useState(reduce ? value : 0);

  useEffect(() => {
    if (reduce || !inView) return undefined;
    const start = performance.now();
    const ms = duration.reveal * 1000;
    let frame;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / ms);
      const eased = 1 - (1 - t) ** 3;
      setShown(Math.round(value * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, reduce, value]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {shown}
    </span>
  );
}
