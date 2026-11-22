import * as TooltipPrimitive from "@radix-ui/react-tooltip";

export function Tooltip({ label, children }) {
  return (
    <TooltipPrimitive.Provider delayDuration={200}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            sideOffset={8}
            className="z-[80] rounded-xl bg-navy px-3 py-1.5 text-xs text-cream shadow-[0_10px_24px_rgba(7,27,43,0.18)]"
          >
            {label}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
