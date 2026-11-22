import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";

export function Accordion({ items }) {
  return (
    <AccordionPrimitive.Root type="single" collapsible className="grid gap-2">
      {items.map((item) => (
        <AccordionPrimitive.Item key={item.value} value={item.value} className="overflow-hidden rounded-2xl bg-white shadow-[0_10px_24px_rgba(7,27,43,0.06)]">
          <AccordionPrimitive.Header>
            <AccordionPrimitive.Trigger className="group flex min-h-11 w-full cursor-pointer items-center justify-between px-4 text-left text-sm font-semibold text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
              {item.title}
              <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" aria-hidden="true" />
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>
          <AccordionPrimitive.Content className="px-4 pb-4 text-sm leading-6 text-muted">{item.body}</AccordionPrimitive.Content>
        </AccordionPrimitive.Item>
      ))}
    </AccordionPrimitive.Root>
  );
}
