import { X } from "lucide-react";
import { Drawer as VaulDrawer } from "vaul";

export function Drawer({ open, onOpenChange, title, trigger, children }) {
  return (
    <VaulDrawer.Root open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
      {trigger ? <VaulDrawer.Trigger asChild>{trigger}</VaulDrawer.Trigger> : null}
      <VaulDrawer.Portal>
        <VaulDrawer.Overlay className="bay-scrim fixed inset-0 z-[80]" />
        <VaulDrawer.Content className="bay-modal fixed inset-x-0 bottom-0 z-[80] rounded-t-2xl rounded-b-none p-6">
          <VaulDrawer.Handle className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-navy/15" />
          <button
            type="button"
            aria-label="Close"
            onClick={() => onOpenChange?.(false)}
            className="absolute top-3 right-3 grid h-11 w-11 cursor-pointer place-items-center rounded-full text-navy hover:bg-gold/40 focus-visible:outline-2 focus-visible:outline-gold"
          >
            <X className="h-4 w-4" />
          </button>
          <VaulDrawer.Title className="font-display text-2xl">{title}</VaulDrawer.Title>
          <div className="mt-4">{children}</div>
        </VaulDrawer.Content>
      </VaulDrawer.Portal>
    </VaulDrawer.Root>
  );
}
