import * as SliderPrimitive from "@radix-ui/react-slider";

export function Slider({ min, max, step = 1, value, onValueChange, label = "Price" }) {
  return (
    <SliderPrimitive.Root
      min={min}
      max={max}
      step={step}
      value={value}
      onValueChange={onValueChange}
      minStepsBetweenThumbs={1}
      aria-label={label}
      className="relative flex h-11 w-full touch-none items-center"
    >
      <SliderPrimitive.Track className="relative h-1 w-full rounded-full bg-navy/10">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-gold" />
      </SliderPrimitive.Track>
      {value.map((_, index) => (
        <SliderPrimitive.Thumb
          key={index === 0 ? "min" : "max"}
          aria-label={index === 0 ? `${label} minimum` : `${label} maximum`}
          className="block h-5 w-5 cursor-grab rounded-full border-2 border-gold bg-white shadow-[0_4px_12px_rgba(7,27,43,0.16)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold active:cursor-grabbing"
        />
      ))}
    </SliderPrimitive.Root>
  );
}
