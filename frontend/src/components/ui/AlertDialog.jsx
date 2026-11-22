import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";

export function AlertDialog({ open, onOpenChange, title, description, confirmLabel = "Confirm", onConfirm }) {
  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="bay-scrim fixed inset-0 z-[80]" />
        <AlertDialogPrimitive.Content className="bay-modal fixed top-1/2 left-1/2 z-[80] w-[min(28rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 p-6">
          <AlertDialogPrimitive.Title className="font-display text-2xl">{title}</AlertDialogPrimitive.Title>
          <AlertDialogPrimitive.Description className="mt-2 text-sm leading-6 text-muted">{description}</AlertDialogPrimitive.Description>
          <div className="mt-5 flex justify-end gap-2">
            <AlertDialogPrimitive.Cancel className="inline-flex h-11 cursor-pointer items-center rounded-full border border-navy/15 px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-gold">
              Keep stay
            </AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Action
              onClick={onConfirm}
              className="inline-flex h-11 cursor-pointer items-center rounded-full bg-navy px-4 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              {confirmLabel}
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
