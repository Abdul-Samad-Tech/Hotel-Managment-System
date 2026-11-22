import { useCallback, useRef } from "react";
import { DOUBLE_TAP_MS } from "../store/wishlist.constant";

export function useDoubleTap(onDoubleTap, windowMs = DOUBLE_TAP_MS) {
  const lastTap = useRef(0);

  return useCallback(
    (event) => {
      const now = performance.now();
      if (now - lastTap.current < windowMs) {
        event.preventDefault();
        event.stopPropagation();
        lastTap.current = 0;
        onDoubleTap(event);
        return true;
      }
      lastTap.current = now;
      return false;
    },
    [onDoubleTap, windowMs],
  );
}
