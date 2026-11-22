import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

export function Select({ id, label, value, onValueChange, placeholder = "Choose", options }) {
  return (
    <div>
      {label ? (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-navy">
          {label}
        </label>
      ) : null}
      <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
        <SelectPrimitive.Trigger
          id={id}
          className="flex min-h-11 w-full cursor-pointer items-center justify-between rounded-xl border border-navy/15 bg-white px-3 text-left text-sm text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon>
            <ChevronDown className="h-4 w-4 text-navy/50" aria-hidden="true" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={8}
            className="z-[80] max-h-64 w-[var(--radix-select-trigger-width)] overflow-hidden rounded-2xl bg-white p-1 text-navy shadow-[0_16px_40px_rgba(7,27,43,0.12)]"
          >
            <SelectPrimitive.Viewport>
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  className="flex min-h-11 cursor-pointer items-center justify-between rounded-xl px-3 text-sm outline-none data-[highlighted]:bg-gold/40"
                >
                  <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator>
                    <Check className="h-4 w-4" aria-hidden="true" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </div>
  );
}
