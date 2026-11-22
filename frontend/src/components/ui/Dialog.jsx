import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

export function Dialog({ open, onOpenChange, title, description, trigger, children, wide = false }) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger> : null}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="bay-scrim fixed inset-0 z-[80]" />
        <DialogPrimitive.Content
          {...(description ? {} : { "aria-describedby": undefined })}
          className={`bay-modal fixed top-1/2 left-1/2 z-[80] -translate-x-1/2 -translate-y-1/2 p-6 ${
            wide ? "w-[min(36rem,calc(100%-2rem))]" : "w-[min(28rem,calc(100%-2rem))]"
          }`}
        >
          <DialogPrimitive.Title className="font-display text-2xl">{title}</DialogPrimitive.Title>
          {description ? <DialogPrimitive.Description className="mt-2 text-sm text-muted">{description}</DialogPrimitive.Description> : null}
          <div className="mt-4">{children}</div>
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
