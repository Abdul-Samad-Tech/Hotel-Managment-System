import { motion, useReducedMotion } from "framer-motion";
import { springSoft } from "../../lib/motion";

function onTabKey(event, items, value, onValueChange) {
  const current = items.findIndex((item) => item.value === value);
  if (current < 0) return;
  let next = current;
  if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (current + 1) % items.length;
  else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (current - 1 + items.length) % items.length;
  else if (event.key === "Home") next = 0;
  else if (event.key === "End") next = items.length - 1;
  else return;
  event.preventDefault();
  onValueChange(items[next].value);
  const tabs = event.currentTarget.parentElement?.querySelectorAll('[role="tab"]');
  tabs?.[next]?.focus();
}

export function Tabs({ value, onValueChange, items, layoutId = "bay-tab-pill" }) {
  const reduce = useReducedMotion();

  return (
    <div role="tablist" className="inline-flex max-w-full gap-1 overflow-x-auto rounded-full bg-navy/5 p-1">
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onValueChange(item.value)}
            onKeyDown={(event) => onTabKey(event, items, value, onValueChange)}
            className={`relative min-h-11 cursor-pointer rounded-full px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${selected ? "text-navy" : "text-navy/60"}`}
          >
            {selected ? (
              reduce ? (
                <span className="absolute inset-0 rounded-full bg-gold" />
              ) : (
                <motion.span layoutId={layoutId} className="absolute inset-0 rounded-full bg-gold" transition={springSoft} />
              )
            ) : null}
            <span className="relative">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
