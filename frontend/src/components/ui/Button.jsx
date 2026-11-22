import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/cn";

const button = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        gold: "min-h-11 rounded-full bg-gold px-5 text-sm text-navy hover:bg-gold-deep",
        navy: "min-h-11 rounded-full bg-navy px-5 text-sm text-white hover:bg-[#16324a]",
        outline: "min-h-11 rounded-full border border-navy/20 bg-transparent px-5 text-sm text-navy hover:border-gold",
        circle: "h-11 w-11 rounded-full bg-navy text-white hover:bg-[#16324a]",
      },
    },
    defaultVariants: { variant: "gold" },
  },
);

export function Button({ variant = "gold", className = "", type = "button", asChild = false, children, ...props }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp type={asChild ? undefined : type} className={cn(button({ variant }), className)} {...props}>
      {children}
    </Comp>
  );
}
