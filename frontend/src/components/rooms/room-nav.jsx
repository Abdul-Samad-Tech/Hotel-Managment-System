import { useDrag } from "@use-gesture/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useReducedMotion } from "framer-motion";
import { useRoomCatalog } from "../../hooks/use-room-catalog";
import { CircleButton } from "../ui/Buttons";

export function roomNeighbors(slug, list = []) {
  const index = list.findIndex((item) => item.id === slug);
  if (index < 0 || !list.length) return { prev: null, next: null, index: -1 };
  const prev = list[(index - 1 + list.length) % list.length];
  const next = list[(index + 1) % list.length];
  return { prev, next, index };
}

export function useRoomSwipeNav(slug, enabled = true) {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const { rooms } = useRoomCatalog();
  const { prev, next } = roomNeighbors(slug, rooms);

  function goPrev() {
    if (prev) navigate(`/rooms/${prev.id}`);
  }

  function goNext() {
    if (next) navigate(`/rooms/${next.id}`);
  }

  const bind = useDrag(
    ({ direction: [dx], distance: [distX], last, cancel, event }) => {
      if (reduce || !enabled || !last) return;
      if (distX < 56) return;
      const target = event?.target;
      if (target?.closest?.("button, a, input, textarea, [role='dialog'], [data-vaul-drawer], [data-room-swipe-ignore]")) {
        cancel?.();
        return;
      }
      if (dx < 0) goNext();
      else if (dx > 0) goPrev();
    },
    {
      axis: "x",
      filterTaps: true,
      pointer: { touch: true },
      enabled: Boolean(enabled && !reduce && (prev || next)),
    },
  );

  return { prev, next, goPrev, goNext, bind };
}

export function RoomNeighborButtons({ prev, next, onPrev, onNext, className = "" }) {
  if (!prev && !next) return null;
  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      <CircleButton
        className="h-11 w-11"
        label={prev ? `Previous room, ${prev.name}` : "Previous room"}
        variant="light"
        onClick={onPrev}
        disabled={!prev}
      >
        <ChevronLeft className="h-4 w-4" />
      </CircleButton>
      <CircleButton
        className="h-11 w-11"
        label={next ? `Next room, ${next.name}` : "Next room"}
        variant="light"
        onClick={onNext}
        disabled={!next}
      >
        <ChevronRight className="h-4 w-4" />
      </CircleButton>
    </div>
  );
}
