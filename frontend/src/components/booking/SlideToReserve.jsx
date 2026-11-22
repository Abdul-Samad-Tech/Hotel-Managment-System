import { useDrag } from "@use-gesture/react";
import { animate, motion, useMotionValue, useReducedMotion } from "framer-motion";
import { Check, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CURSOR_LABELS } from "../../lib/cursor.constant";
import { confirmHaptic } from "../../lib/haptics";
import { duration, easeTide } from "../../lib/motion";
import { progressFromOffset, slideReachedEnd, slideTravelPx } from "../../lib/slide-reserve";
import { SLIDE_COPY, SLIDE_HANDLE_PX, SLIDE_TRACK_PAD_PX } from "../../lib/slide-reserve.constant";

export function SlideToReserve({ disabled, busy, onConfirm }) {
  const reduce = useReducedMotion();
  const [status, setStatus] = useState("");
  const locked = Boolean(disabled || busy);

  useEffect(() => {
    if (busy) {
      setStatus(SLIDE_COPY.statusBusy);
      return;
    }
    if (disabled) {
      setStatus(SLIDE_COPY.statusDisabled);
      return;
    }
    setStatus(SLIDE_COPY.statusIdle);
  }, [busy, disabled]);

  async function runConfirm() {
    if (locked) return false;
    setStatus(SLIDE_COPY.statusComplete);
    confirmHaptic();
    try {
      const ok = await Promise.resolve(onConfirm());
      if (ok === false) setStatus(SLIDE_COPY.statusIdle);
      return ok;
    } catch {
      setStatus(SLIDE_COPY.statusIdle);
      return false;
    }
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <p className="sr-only" aria-live="polite">
        {status}
      </p>
      {reduce ? null : (
        <SlideTrack disabled={disabled} busy={busy} onConfirm={runConfirm} onStatus={setStatus} />
      )}
      <button
        type="button"
        disabled={locked}
        onClick={() => {
          void runConfirm();
        }}
        className="inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-full bg-gold px-5 text-sm font-semibold text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {busy ? SLIDE_COPY.holding : SLIDE_COPY.confirm}
      </button>
    </div>
  );
}

function SlideTrack({ disabled, busy, onConfirm, onStatus }) {
  const trackRef = useRef(null);
  const sent = useRef(false);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [complete, setComplete] = useState(false);
  const x = useMotionValue(0);
  const pad = SLIDE_TRACK_PAD_PX;
  const move = { duration: dragging ? 0 : duration.micro, ease: easeTide };
  const showCheck = complete || slideReachedEnd(progress);
  const trackLocked = Boolean(disabled || busy || complete);

  useSlideDrag({
    trackRef,
    locked: Boolean(disabled || busy),
    sent,
    progress,
    setProgress,
    setDragging,
    setComplete,
    x,
    onConfirm,
    onStatus,
  });

  return (
    <div
      ref={trackRef}
      aria-hidden="true"
      data-slide-reserve="track"
      data-slide-progress={String(progress)}
      data-cursor={CURSOR_LABELS.drag}
      className={`relative w-full touch-none select-none overflow-hidden rounded-full bg-navy ${
        trackLocked ? "pointer-events-none opacity-60" : "cursor-grab active:cursor-grabbing"
      }`}
      style={{ height: SLIDE_HANDLE_PX + pad * 2, padding: pad }}
    >
      <p
        className="pointer-events-none absolute inset-0 grid place-items-center text-sm font-semibold text-white/80"
        style={{ opacity: 1 - progress }}
      >
        {busy ? SLIDE_COPY.holding : SLIDE_COPY.hint}
      </p>
      <motion.div
        className="pointer-events-none absolute origin-left rounded-full bg-gold/35"
        style={{ top: pad, right: pad, bottom: pad, left: pad }}
        animate={{ transform: `scaleX(${progress})` }}
        transition={move}
      />
      <div className="pointer-events-none relative h-full" style={{ width: `calc(100% - ${SLIDE_HANDLE_PX}px)` }}>
        <motion.div
          className="grid h-11 w-11 place-items-center rounded-full bg-gold text-navy shadow-[0_8px_20px_rgba(242,192,120,0.42)]"
          style={{ x }}
          transition={move}
        >
          {showCheck ? (
            <Check className="h-5 w-5" aria-hidden="true" />
          ) : (
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          )}
        </motion.div>
      </div>
    </div>
  );
}

function useSlideDrag({
  trackRef,
  locked,
  sent,
  progress,
  setProgress,
  setDragging,
  setComplete,
  x,
  onConfirm,
  onStatus,
}) {
  useDrag(
    ({ first, last, canceled, offset: [ox] }) => {
      if (locked || sent.current) return;
      const travel = slideTravelPx(trackRef.current?.clientWidth ?? 0);
      if (first) setDragging(true);
      const next = progressFromOffset(ox, travel);
      x.set(next * travel);
      setProgress(next);
      if (slideReachedEnd(next)) onStatus(SLIDE_COPY.statusReady);
      else if (next > 0.05) onStatus(SLIDE_COPY.statusSliding);
      else onStatus(SLIDE_COPY.statusIdle);
      if (!last && !canceled) return;
      setDragging(false);
      void finishSlide({
        next,
        travel,
        sent,
        setProgress,
        setComplete,
        x,
        onConfirm,
        onStatus,
      });
    },
    {
      target: trackRef,
      axis: "x",
      filterTaps: true,
      preventScroll: true,
      enabled: !locked,
      pointer: { touch: true, capture: true },
      eventOptions: { passive: false },
      from: () => [progress * slideTravelPx(trackRef.current?.clientWidth ?? 0), 0],
      bounds: () => {
        const travel = slideTravelPx(trackRef.current?.clientWidth ?? 0);
        return { left: 0, right: travel, top: 0, bottom: 0 };
      },
    },
  );
}

async function finishSlide({ next, travel, sent, setProgress, setComplete, x, onConfirm, onStatus }) {
  if (!slideReachedEnd(next)) {
    setProgress(0);
    animate(x, 0, { duration: duration.micro, ease: easeTide });
    onStatus(SLIDE_COPY.statusIdle);
    return;
  }

  sent.current = true;
  setProgress(1);
  setComplete(true);
  x.set(travel);
  onStatus(SLIDE_COPY.statusComplete);

  try {
    const ok = await Promise.resolve(onConfirm());
    if (ok !== false) return;
    sent.current = false;
    setComplete(false);
    setProgress(0);
    animate(x, 0, { duration: duration.micro, ease: easeTide });
    onStatus(SLIDE_COPY.statusIdle);
  } catch {
    sent.current = false;
    setComplete(false);
    setProgress(0);
    animate(x, 0, { duration: duration.micro, ease: easeTide });
    onStatus(SLIDE_COPY.statusIdle);
  }
}
