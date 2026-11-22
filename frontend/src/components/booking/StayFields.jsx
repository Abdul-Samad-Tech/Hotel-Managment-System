import * as DatePopover from "@radix-ui/react-popover";
import * as Select from "@radix-ui/react-select";
import { ArrowRight, BedDouble, CalendarDays, Check, ChevronDown, Minus, Plus, Users } from "lucide-react";
import { format as formatDate } from "date-fns";
import { Drawer } from "vaul";
import { roomTypes } from "../../data/site";
import { MEDIA_NARROW } from "../../lib/media.constant";
import { guestLabel } from "../../lib/stay-label";
import { useMediaQuery } from "../../hooks/use-media-query";
import { GUEST_LIMITS } from "../../store/search.constant";
import { AVAILABILITY_COPY } from "../../lib/availability.constant";
import { PriceCalendar } from "./PriceCalendar";
import { Price } from "../ui/Price";
import { InlineError } from "../ui/InlineError";

export function StayFields({
  checkIn,
  checkOut,
  adults,
  children,
  roomType,
  open,
  setOpen,
  onRange,
  setAdults,
  setChildren,
  setRoomType,
  months,
  price,
  busy,
  canSubmit,
  allowReserve,
  reduce,
  note,
  fault,
  noteId,
}) {
  const mobile = useMediaQuery(MEDIA_NARROW);
  const datesOpen = open === "dates";

  function setDatesOpen(next) {
    setOpen(next ? "dates" : (current) => (current === "dates" ? null : current));
  }

  const calendar = (
    <PriceCalendar
      selected={{ from: checkIn, to: checkOut }}
      onSelect={onRange}
      numberOfMonths={mobile ? 1 : months}
      defaultMonth={checkIn}
      roomType={roomType}
      checkIn={checkIn}
      checkOut={checkOut}
    />
  );

  return (
    <>
      <div className="grid items-center gap-2 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1.15fr_1fr_auto] xl:gap-0">
        {mobile ? (
          <>
            <div className="group/field relative xl:pr-4">
              <p id="check-in-label" className="text-[11px] font-medium tracking-[0.16em] text-muted uppercase">Check In</p>
              <button
                type="button"
                aria-labelledby="check-in-label"
                aria-expanded={datesOpen}
                onClick={() => setDatesOpen(true)}
                className="mt-1 flex min-h-11 w-full cursor-pointer items-center gap-2 text-left text-sm font-semibold text-navy focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
              >
                <CalendarDays className="h-4 w-4 text-gold" strokeWidth={1.6} />
                {formatDate(checkIn, "MMM d, yyyy")}
              </button>
              <FieldLine />
            </div>
            <div className="group/field relative xl:border-l xl:border-navy/10 xl:px-4">
              <p id="check-out-label" className="text-[11px] font-medium tracking-[0.16em] text-muted uppercase">Check Out</p>
              <button
                type="button"
                aria-labelledby="check-out-label"
                aria-expanded={datesOpen}
                onClick={() => setDatesOpen(true)}
                className="mt-1 flex min-h-11 w-full cursor-pointer items-center gap-2 text-left text-sm font-semibold text-navy focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
              >
                <CalendarDays className="h-4 w-4 text-gold" strokeWidth={1.6} />
                {formatDate(checkOut, "MMM d, yyyy")}
              </button>
              <FieldLine />
            </div>
          </>
        ) : (
          <DatePopover.Root open={datesOpen} onOpenChange={setDatesOpen}>
            <div className="group/field relative xl:pr-4">
              <p id="check-in-label" className="text-[11px] font-medium tracking-[0.16em] text-muted uppercase">Check In</p>
              <DatePopover.Trigger asChild>
                <button
                  type="button"
                  aria-labelledby="check-in-label"
                  className="mt-1 flex min-h-11 w-full cursor-pointer items-center gap-2 text-left text-sm font-semibold text-navy focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
                >
                  <CalendarDays className="h-4 w-4 text-gold" strokeWidth={1.6} />
                  {formatDate(checkIn, "MMM d, yyyy")}
                </button>
              </DatePopover.Trigger>
              <FieldLine />
            </div>
            <div className="group/field relative xl:border-l xl:border-navy/10 xl:px-4">
              <p id="check-out-label" className="text-[11px] font-medium tracking-[0.16em] text-muted uppercase">Check Out</p>
              <button
                type="button"
                aria-labelledby="check-out-label"
                onClick={() => setDatesOpen(true)}
                className="mt-1 flex min-h-11 w-full cursor-pointer items-center gap-2 text-left text-sm font-semibold text-navy focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
              >
                <CalendarDays className="h-4 w-4 text-gold" strokeWidth={1.6} />
                {formatDate(checkOut, "MMM d, yyyy")}
              </button>
              <FieldLine />
            </div>
            <DatePopover.Portal>
              <DatePopover.Content
                align="start"
                sideOffset={12}
                className="z-[60] max-h-[min(88vh,42rem)] overflow-y-auto rounded-2xl border border-navy/5 bg-white p-3 shadow-[0_16px_40px_rgba(7,27,43,0.14)] outline-none"
              >
                {calendar}
                <p className="px-2 pt-1 text-xs text-muted">
                  From <Price value={price} /> / night
                </p>
              </DatePopover.Content>
            </DatePopover.Portal>
          </DatePopover.Root>
        )}

        <DatePopover.Root open={open === "guests"} onOpenChange={(next) => setOpen(next ? "guests" : (current) => (current === "guests" ? null : current))}>
          <div className="group/field relative xl:border-l xl:border-navy/10 xl:px-4">
            <p id="guests-label" className="text-[11px] font-medium tracking-[0.16em] text-muted uppercase">Guests</p>
            <DatePopover.Trigger asChild>
              <button
                type="button"
                aria-labelledby="guests-label"
                className="mt-1 flex min-h-11 w-full cursor-pointer items-center gap-2 text-left text-sm font-semibold text-navy focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
              >
                <Users className="h-4 w-4 text-gold" strokeWidth={1.6} />
                <span className="flex-1">{guestLabel(adults, children)}</span>
              </button>
            </DatePopover.Trigger>
            <FieldLine />
          </div>
          <DatePopover.Portal>
            <DatePopover.Content
              align="start"
              sideOffset={12}
              className="z-[60] w-64 rounded-2xl border border-navy/5 bg-white p-4 shadow-[0_16px_40px_rgba(7,27,43,0.14)] outline-none"
            >
              <StayStepper label="Adults" value={adults} min={GUEST_LIMITS.adults.min} max={GUEST_LIMITS.adults.max} onChange={setAdults} />
              <StayStepper label="Children" value={children} min={GUEST_LIMITS.children.min} max={GUEST_LIMITS.children.max} onChange={setChildren} />
            </DatePopover.Content>
          </DatePopover.Portal>
        </DatePopover.Root>

        <div className="group/field relative xl:border-l xl:border-navy/10 xl:px-4">
          <span id="room-type-label" className="text-[11px] font-medium tracking-[0.16em] text-muted uppercase">Room Type</span>
          <Select.Root value={roomType} onValueChange={setRoomType}>
            <Select.Trigger
              aria-labelledby="room-type-label"
              className="mt-1 flex min-h-11 w-full cursor-pointer items-center gap-2 bg-transparent text-left text-sm font-semibold text-navy outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
            >
              <BedDouble className="h-4 w-4 shrink-0 text-gold" strokeWidth={1.6} />
              <Select.Value />
              <Select.Icon className="ml-auto">
                <ChevronDown className="h-4 w-4 text-navy/60" />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content
                position="popper"
                sideOffset={12}
                className="z-[60] w-[var(--radix-select-trigger-width)] overflow-hidden rounded-2xl bg-white p-1 text-navy shadow-[0_16px_40px_rgba(7,27,43,0.14)]"
              >
                <Select.Viewport>
                  {roomTypes.map((type) => (
                    <Select.Item
                      key={type}
                      value={type}
                      className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl px-3 text-sm outline-none data-[highlighted]:bg-gold/40"
                    >
                      <BedDouble className="h-4 w-4 text-gold" strokeWidth={1.6} aria-hidden="true" />
                      <Select.ItemText>{type}</Select.ItemText>
                      <Select.ItemIndicator className="ml-auto">
                        <Check className="h-4 w-4" aria-hidden="true" />
                      </Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
          <FieldLine />
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="group relative mt-2 inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-gold px-5 text-sm font-semibold text-navy hover:bg-gold-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-60 xl:mt-0 xl:ml-3"
        >
          {!reduce && (
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
              <span className="absolute inset-y-0 left-0 w-1/3 -translate-x-full bg-gradient-to-r from-transparent via-white/55 to-transparent transition-transform duration-[900ms] ease-[cubic-bezier(0.65,0,0.35,1)] group-hover:translate-x-[280%]" />
            </span>
          )}
          <span className="relative inline-flex items-center gap-2">
            {busy ? "Checking" : allowReserve ? "Reserve stay" : "Check Availability"}
            <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
          </span>
        </button>
      </div>
      {note && (
        <p id={noteId} className="px-2 pt-3 text-sm text-navy" role="status">
          {note}
        </p>
      )}
      <div className="px-2">
        <InlineError id={`${noteId}-error`}>{fault}</InlineError>
      </div>
      {mobile ? (
        <Drawer.Root open={datesOpen} onOpenChange={setDatesOpen} shouldScaleBackground={false}>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 z-[80] bg-navy/50" />
            <Drawer.Content className="fixed inset-x-0 bottom-0 z-[90] flex max-h-[92vh] flex-col rounded-t-2xl bg-white outline-none">
              <Drawer.Handle className="mx-auto mt-3 mb-2 h-1.5 w-12 rounded-full bg-navy/15" />
              <Drawer.Title className="px-4 font-display text-2xl text-navy">{AVAILABILITY_COPY.datesTitle}</Drawer.Title>
              <div className="mt-3 overflow-y-auto px-4 pb-6">
                {calendar}
                <p className="px-1 pt-2 text-xs text-muted">
                  From <Price value={price} /> / night
                </p>
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      ) : null}
    </>
  );
}

function FieldLine() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-gold transition-transform duration-[480ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-focus-within/field:scale-x-100 motion-reduce:transition-none"
    />
  );
}

export function StayStepper({ label, value, min, max, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm text-navy">{label}</span>
      <span className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          className="grid h-8 w-8 cursor-pointer place-items-center rounded-full border border-navy/10 text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-4 text-center text-sm font-semibold">{value}</span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
          className="grid h-8 w-8 cursor-pointer place-items-center rounded-full border border-navy/10 text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </span>
    </div>
  );
}
