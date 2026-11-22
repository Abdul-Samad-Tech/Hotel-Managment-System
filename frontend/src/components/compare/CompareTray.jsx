import { AnimatePresence, motion, useMotionValue, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { roomsFromCompareIds, roomById } from "../../lib/compare";
import { duration, easeFlow } from "../../lib/motion";
import { onDeskPath, stickyStayVisible } from "../../lib/sticky-bar";
import { COMPARE_COPY, COMPARE_MAX } from "../../store/compare.constant";
import { useCompareIds, useCompareStore } from "../../store/compare.store";
import { Sheet } from "../ui/Sheet";
import { SmartImage } from "../ui/SmartImage";
import { clearCompare, removeFromCompare } from "./compare-actions";
import { CompareTable } from "./CompareTable";

export function CompareTray({ pastHero }) {
  const { pathname } = useLocation();
  const ids = useCompareIds();
  const draggingId = useCompareStore((state) => state.draggingId);
  const hidden = onDeskPath(pathname);
  const show = !hidden && (ids.length > 0 || pathname === "/rooms" || Boolean(draggingId));
  const lift = stickyStayVisible(pathname, pastHero);
  const announce = useCompareStore((state) => state.announce);

  if (hidden) return null;

  return (
    <>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
      <AnimatePresence>
        {show ? <CompareDock lift={lift} dragging={Boolean(draggingId)} ids={ids} /> : null}
      </AnimatePresence>
      <CompareGhost />
      <ComparePanel ids={ids} />
    </>
  );
}

function CompareDock({ lift, dragging, ids }) {
  const reduce = useReducedMotion();
  const picked = roomsFromCompareIds(ids);
  const fade = {
    duration: reduce ? 0 : duration.ui,
    ease: easeFlow,
  };
  const enter = reduce ? { opacity: 0 } : { opacity: 0, y: 28 };
  const leave = reduce ? { opacity: 0 } : { opacity: 0, y: 28 };
  const hint = dragging ? COMPARE_COPY.drop : COMPARE_COPY.empty;
  const ring = dragging ? "ring-2 ring-gold" : "";

  return (
    <>
      <motion.aside
        key="compare-desk"
        role="complementary"
        aria-label={COMPARE_COPY.region}
        data-compare-drop="true"
        initial={enter}
        animate={{ opacity: 1, y: 0 }}
        exit={leave}
        transition={fade}
        className={`fixed inset-x-4 bottom-4 z-[45] hidden lg:block ${ring}`}
      >
        <CompareDockBody picked={picked} hint={hint} count={ids.length} />
      </motion.aside>
      <motion.aside
        key="compare-mobile"
        role="complementary"
        aria-label={COMPARE_COPY.region}
        data-compare-drop="true"
        initial={enter}
        animate={{ opacity: 1, y: 0 }}
        exit={leave}
        transition={fade}
        className={`fixed inset-x-4 z-[45] lg:hidden ${ring}`}
        style={{
          bottom: lift
            ? "calc(5.25rem + env(safe-area-inset-bottom, 0px))"
            : "max(1rem, env(safe-area-inset-bottom, 0px))",
        }}
      >
        <CompareDockBody picked={picked} hint={hint} count={ids.length} />
      </motion.aside>
    </>
  );
}

function CompareDockBody({ picked, hint, count }) {
  const setPanelOpen = useCompareStore((state) => state.setPanelOpen);
  const canOpen = picked.length >= 2;

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/95 px-3 py-2 shadow-[0_16px_40px_rgba(7,27,43,0.16)] backdrop-blur-md">
      <CompareSlots picked={picked} hint={hint} count={count} />
      {count > 0 ? (
        <button
          type="button"
          onClick={clearCompare}
          className="inline-flex h-11 shrink-0 cursor-pointer items-center px-2 text-sm font-semibold text-navy underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          {COMPARE_COPY.clear}
        </button>
      ) : null}
      <button
        type="button"
        disabled={!canOpen}
        title={canOpen ? undefined : COMPARE_COPY.needTwo}
        onClick={() => setPanelOpen(true)}
        className="inline-flex h-11 shrink-0 cursor-pointer items-center rounded-full bg-navy px-4 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-40"
      >
        {COMPARE_COPY.action}
        {count ? ` (${count})` : ""}
      </button>
    </div>
  );
}

function CompareSlots({ picked, hint, count }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
      {Array.from({ length: COMPARE_MAX }, (_, index) => (
        <CompareSlot key={picked[index]?.id ?? `empty-${index}`} room={picked[index]} index={index} />
      ))}
      {count === 0 ? <p className="truncate text-sm text-muted">{hint}</p> : null}
    </div>
  );
}

function CompareSlot({ room, index }) {
  if (!room) {
    return (
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-dashed border-navy/20 text-[10px] text-muted">
        {index + 1}
      </span>
    );
  }

  return (
    <button
      type="button"
      aria-label={`${COMPARE_COPY.remove} ${room.name}`}
      onClick={() => removeFromCompare(room.id)}
      className="relative h-11 w-11 shrink-0 cursor-pointer overflow-hidden rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
    >
      <SmartImage src={room.image} alt="" width={44} height={44} className="h-11 w-11" />
      <span className="absolute top-0 right-0 grid h-4 w-4 place-items-center rounded-bl-md bg-navy text-white">
        <X className="h-3 w-3" aria-hidden="true" />
      </span>
    </button>
  );
}

function ComparePanel({ ids }) {
  const panelOpen = useCompareStore((state) => state.panelOpen);
  const setPanelOpen = useCompareStore((state) => state.setPanelOpen);
  const picked = roomsFromCompareIds(ids);

  return (
    <Sheet open={panelOpen} onOpenChange={setPanelOpen} title={COMPARE_COPY.title} wide>
      <CompareTable rooms={picked} onRemove={removeFromCompare} />
    </Sheet>
  );
}

function CompareGhost() {
  const reduce = useReducedMotion();
  const draggingId = useCompareStore((state) => state.draggingId);
  const room = roomById(draggingId);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  useEffect(() => {
    if (!draggingId) return undefined;
    const move = (event) => {
      x.set(event.clientX);
      y.set(event.clientY);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [draggingId, x, y]);

  if (reduce || !room) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-50 h-16 w-24 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl shadow-[0_16px_40px_rgba(7,27,43,0.24)]"
      style={{ x, y }}
    >
      <SmartImage src={room.image} alt="" width={96} height={64} className="h-full w-full" />
    </motion.div>
  );
}
