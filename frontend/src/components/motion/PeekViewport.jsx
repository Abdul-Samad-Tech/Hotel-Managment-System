import { PEEK_REGION } from "../../lib/carousel.constant";
import { mergeCarouselRef, useCarouselGestures } from "../../lib/carousel-gestures";
import { CURSOR_LABELS } from "../../lib/cursor.constant";

export function PeekViewport({ emblaRef, embla, reduce, label = PEEK_REGION.rooms, children, className = "", id }) {
  const { nodeRef, onKeyDown } = useCarouselGestures(embla, reduce);

  return (
    <div
      id={id}
      ref={mergeCarouselRef(emblaRef, nodeRef)}
      data-cursor={reduce ? undefined : CURSOR_LABELS.drag}
      tabIndex={0}
      onKeyDown={onKeyDown}
      aria-label={label}
      role="region"
      className={`overflow-hidden outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${className}`}
      data-room-swipe-ignore=""
    >
      {children}
    </div>
  );
}
