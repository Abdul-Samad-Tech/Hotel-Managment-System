import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

export function Sheet({ open, onOpenChange, title, trigger, children, wide = false }) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger> : null}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="bay-scrim fixed inset-0 z-[80]" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={`bay-modal fixed top-0 right-0 z-[80] flex h-full flex-col rounded-none rounded-l-2xl p-6 ${wide ? "w-[min(56rem,100%)]" : "w-[min(22rem,100%)]"}`}
        >
          <DialogPrimitive.Title className="font-display text-2xl">{title}</DialogPrimitive.Title>
          <div className="mt-4 min-h-0 flex-1 overflow-y-auto">{children}</div>
          <DialogPrimitive.Close
            aria-label="Close"
            className="absolute top-3 right-3 grid h-11 w-11 cursor-pointer place-items-center rounded-full text-navy hover:bg-gold/40 focus-visible:outline-2 focus-visible:outline-gold"
          >
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
