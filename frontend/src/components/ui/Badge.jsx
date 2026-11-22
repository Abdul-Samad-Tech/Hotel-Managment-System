import { cva } from "class-variance-authority";
import { cn } from "../../lib/cn";

const badge = cva("inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] uppercase", {
  variants: {
    tone: {
      gold: "bg-gold text-navy",
      navy: "bg-navy text-white",
      outline: "border border-navy/15 text-navy",
    },
  },
  defaultVariants: { tone: "gold" },
});

export function Badge({ tone = "gold", className = "", children }) {
  return <span className={cn(badge({ tone }), className)}>{children}</span>;
}
