import { useWheel } from "@use-gesture/react";
import { useCallback, useRef } from "react";
import { WHEEL_MIN_DELTA, WHEEL_THROTTLE_MS } from "./carousel.constant";

export function peekCarouselOptions(reduce, extra = {}) {
  return {
    align: "start",
    containScroll: false,
    dragFree: false,
    skipSnaps: false,
    watchDrag: !reduce,
    duration: reduce ? 0 : 22,
    ...extra,
  };
}

export function mergeCarouselRef(emblaRef, nodeRef) {
  return (node) => {
    if (typeof emblaRef === "function") emblaRef(node);
    else if (emblaRef) emblaRef.current = node;
    nodeRef.current = node;
  };
}

export function useCarouselGestures(embla, reduce) {
  const nodeRef = useRef(null);
  const lastWheel = useRef(0);

  const onKeyDown = useCallback(
    (event) => {
      if (!embla) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        embla.scrollNext();
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        embla.scrollPrev();
      }
    },
    [embla],
  );

  useWheel(
    ({ event, delta: [dx, dy] }) => {
      if (reduce || !embla) return;
      if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < WHEEL_MIN_DELTA) return;
      const now = performance.now();
      if (now - lastWheel.current < WHEEL_THROTTLE_MS) return;
      lastWheel.current = now;
      event.preventDefault();
      if (dx > 0) embla.scrollNext();
      else embla.scrollPrev();
    },
    { target: nodeRef, eventOptions: { passive: false }, enabled: Boolean(embla) && !reduce },
  );

  return { nodeRef, onKeyDown };
}
