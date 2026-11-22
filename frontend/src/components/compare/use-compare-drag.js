import { useDrag } from "@use-gesture/react";
import { useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { CURSOR_LABELS } from "../../lib/cursor.constant";
import { COMPARE_DROP } from "../../store/compare.constant";
import { useCompareStore } from "../../store/compare.store";
import { addToCompare } from "./compare-actions";

export function useFinePointer() {
  const [fine, setFine] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(pointer: fine)");
    const sync = () => setFine(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return fine;
}

export function useCompareDrag(roomId) {
  const reduce = useReducedMotion();
  const fine = useFinePointer();
  const setDragging = useCompareStore((state) => state.setDragging);
  const enabled = Boolean(fine && !reduce && roomId);

  const bind = useDrag(
    ({ tap, first, last, xy: [px, py] }) => {
      if (tap) return;
      if (first) setDragging(roomId);
      if (!last) return;
      const node = document.elementFromPoint(px, py);
      if (node?.closest(`[data-${COMPARE_DROP}]`)) addToCompare(roomId);
      setDragging("");
    },
    { enabled, filterTaps: true, threshold: 12, pointer: { capture: true } },
  );

  if (!enabled) return { bind: {}, fine: false, cursorLabel: undefined };

  return {
    bind: bind(),
    fine: true,
    cursorLabel: CURSOR_LABELS.drag,
  };
}
