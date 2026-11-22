import * as Dialog from "@radix-ui/react-dialog";
import { Command } from "cmdk";
import { Search } from "lucide-react";

const groupHeading =
  "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:tracking-[0.18em] [&_[cmdk-group-heading]]:text-gold [&_[cmdk-group-heading]]:uppercase";

export function DeskCommand({ open, onOpenChange, sections, onSelect }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="bay-scrim fixed inset-0 z-[70]" />
        <Dialog.Content aria-describedby={undefined} className="bay-modal fixed top-[12%] left-1/2 z-[80] w-[min(560px,calc(100%-1.5rem))] -translate-x-1/2 p-3">
          <Dialog.Title className="sr-only">Desk commands</Dialog.Title>
          <Command label="Desk commands" className="bg-transparent">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-navy/50" aria-hidden="true" />
              <Command.Input
                placeholder="Jump to a section"
                className="h-11 w-full rounded-full border border-navy/10 bg-white pr-4 pl-10 text-sm text-navy placeholder:text-navy/45 focus:outline-2 focus:outline-gold"
              />
            </div>
            <Command.List className="mt-3 max-h-72 overflow-y-auto">
              <Command.Empty className="px-3 py-6 text-center text-sm text-muted" role="status">
                Nothing matches.
              </Command.Empty>
              <Command.Group heading="Desk" className={groupHeading}>
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <Command.Item
                      key={section.id}
                      value={section.label}
                      onSelect={() => {
                        onSelect(section.id);
                        onOpenChange(false);
                      }}
                      className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl px-3 text-sm text-navy data-[selected=true]:bg-gold/40"
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.6} />
                      {section.label}
                    </Command.Item>
                  );
                })}
              </Command.Group>
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
