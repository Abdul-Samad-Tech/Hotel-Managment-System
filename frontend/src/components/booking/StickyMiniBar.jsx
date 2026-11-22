import * as DatePopover from "@radix-ui/react-popover";
import { CalendarDays, Users } from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Drawer } from "vaul";
import { useLocation, useNavigate } from "react-router-dom";
import { rooms } from "../../data/rooms";
import { useAuth } from "../../context/AuthContext";
import { useMediaQuery } from "../../hooks/use-media-query";
import { requireSignedIn } from "../../lib/auth-gate";
import { duration, easeFlow } from "../../lib/motion";
import { stayAdultsLabel, stayDateRangeLabel } from "../../lib/stay-label";
import { stickyStayVisible } from "../../lib/sticky-bar";
import { STICKY_COPY, STICKY_EVENT, STICKY_FORM_ID, STICKY_REGION } from "../../lib/sticky-bar.constant";
import { GUEST_LIMITS, RANGE_ERROR } from "../../store/search.constant";
import { useSearchStay, useSearchStore } from "../../store/searchStore";
import { PriceCalendar } from "./PriceCalendar";
import { StayFields, StayStepper } from "./StayFields";

function roomPrice(roomType) {
  return rooms.find((room) => room.selectLabel === roomType)?.price ?? 120;
}

function runStayCheck(pathname, navigate, user) {
  if (!requireSignedIn(user, navigate, {
    returnTo: pathname === "/" ? "/" : "/booking",
    message: "Sign in to check availability and continue booking.",
  })) {
    return;
  }
  if (pathname === "/") {
    const form = document.getElementById(STICKY_FORM_ID);
    if (form) {
      form.requestSubmit();
      return;
    }
    document.getElementById("booking")?.scrollIntoView({ block: "center" });
    window.dispatchEvent(new CustomEvent(STICKY_EVENT));
    return;
  }
  navigate("/booking");
}

export function StickyMiniBar({ past }) {
  const reduce = useReducedMotion();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const desktop = useMediaQuery("(min-width: 1024px)");
  const { checkIn, checkOut, adults, children, roomType, rangeValid } = useSearchStay();
  const setRange = useSearchStore((state) => state.setRange);
  const setAdults = useSearchStore((state) => state.setAdults);
  const setChildren = useSearchStore((state) => state.setChildren);
  const setRoomType = useSearchStore((state) => state.setRoomType);
  const [open, setOpen] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const hidden = !stickyStayVisible(pathname, past);
  const fade = { duration: reduce ? 0 : duration.ui, ease: easeFlow };

  function chooseRange(next) {
    if (!next?.from) return;
    setRange(next.from, next.to);
    if (next.to) setOpen(null);
  }

  function openField(field) {
    if (desktop) {
      setOpen(field);
      return;
    }
    setOpen(field);
    setDrawerOpen(true);
  }

  return (
    <AnimatePresence>
      {hidden ? null : (
        <motion.aside
          key="sticky-stay"
          role="complementary"
          aria-label={STICKY_REGION}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -18 }}
          transition={fade}
        >
          <div className="fixed inset-x-0 top-0 z-[55] hidden border-b border-navy/10 bg-white/95 shadow-[0_10px_28px_rgba(7,27,43,0.08)] backdrop-blur-md lg:block">
            <div className="page-wrap flex h-[64px] items-center justify-between gap-3">
              <MiniFields
                checkIn={checkIn}
                checkOut={checkOut}
                adults={adults}
                children={children}
                roomType={roomType}
                open={open}
                setOpen={setOpen}
                onRange={chooseRange}
                setAdults={setAdults}
                setChildren={setChildren}
              />
              <StayButton
                disabled={!rangeValid}
                label={STICKY_COPY.check}
                onClick={() => runStayCheck(pathname, navigate, user)}
              />
            </div>
          </div>
          <div className="fixed inset-x-4 z-40 lg:hidden" style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}>
            <div className="flex items-center gap-2 rounded-full bg-navy px-2 py-2 text-white shadow-[0_16px_40px_rgba(7,27,43,0.28)]">
              <button
                type="button"
                onClick={() => openField("dates")}
                className="min-h-11 min-w-0 flex-1 truncate rounded-full px-3 text-left text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                {stayDateRangeLabel(checkIn, checkOut)}
              </button>
              <button
                type="button"
                onClick={() => openField("guests")}
                className="min-h-11 shrink-0 rounded-full px-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                {stayAdultsLabel(adults)}
              </button>
              <StayButton
                disabled={!rangeValid}
                label={STICKY_COPY.check}
                onClick={() => runStayCheck(pathname, navigate, user)}
              />
            </div>
          </div>
          <Drawer.Root open={!desktop && drawerOpen} onOpenChange={setDrawerOpen} shouldScaleBackground={false}>
            <Drawer.Portal>
              <Drawer.Overlay className="fixed inset-0 z-[60] bg-navy/50" />
              <Drawer.Content className="fixed inset-x-0 bottom-0 z-[70] max-h-[88vh] overflow-y-auto rounded-t-2xl bg-white px-4 pt-3 pb-6 outline-none">
                <Drawer.Handle className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-navy/15" />
                <Drawer.Title className="font-display text-2xl text-navy">Your stay</Drawer.Title>
                <form
                  className="mt-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    setDrawerOpen(false);
                    runStayCheck(pathname, navigate, user);
                  }}
                >
                  <StayFields
                    checkIn={checkIn}
                    checkOut={checkOut}
                    adults={adults}
                    children={children}
                    roomType={roomType}
                    open={open}
                    setOpen={setOpen}
                    onRange={chooseRange}
                    setAdults={setAdults}
                    setChildren={setChildren}
                    setRoomType={setRoomType}
                    months={1}
                    price={roomPrice(roomType)}
                    busy={false}
                    canSubmit={rangeValid}
                    allowReserve={false}
                    reduce={reduce}
                    note=""
                    fault={rangeValid ? "" : RANGE_ERROR}
                    noteId="sticky-stay"
                  />
                </form>
              </Drawer.Content>
            </Drawer.Portal>
          </Drawer.Root>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function MiniFields({ checkIn, checkOut, adults, children, roomType, open, setOpen, onRange, setAdults, setChildren }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-1">
      <DatePopover.Root open={open === "dates"} onOpenChange={(next) => setOpen(next ? "dates" : null)}>
        <DatePopover.Trigger asChild>
          <button
            type="button"
            className="inline-flex min-h-11 min-w-0 cursor-pointer items-center gap-2 rounded-full px-3 text-sm font-semibold text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            <CalendarDays className="h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
            <span className="truncate">{stayDateRangeLabel(checkIn, checkOut)}</span>
          </button>
        </DatePopover.Trigger>
        <DatePopover.Portal>
          <DatePopover.Content
            align="start"
            sideOffset={8}
            className="z-[70] max-h-[min(88vh,42rem)] overflow-y-auto rounded-2xl border border-navy/5 bg-white p-3 shadow-[0_16px_40px_rgba(7,27,43,0.14)] outline-none"
          >
            <PriceCalendar
              selected={{ from: checkIn, to: checkOut }}
              onSelect={onRange}
              numberOfMonths={2}
              defaultMonth={checkIn}
              roomType={roomType}
              checkIn={checkIn}
              checkOut={checkOut}
            />
          </DatePopover.Content>
        </DatePopover.Portal>
      </DatePopover.Root>
      <DatePopover.Root open={open === "guests"} onOpenChange={(next) => setOpen(next ? "guests" : null)}>
        <DatePopover.Trigger asChild>
          <button
            type="button"
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-3 text-sm font-semibold text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            <Users className="h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
            {stayAdultsLabel(adults)}
          </button>
        </DatePopover.Trigger>
        <DatePopover.Portal>
          <DatePopover.Content
            align="start"
            sideOffset={8}
            className="z-[70] w-64 rounded-2xl border border-navy/5 bg-white p-4 shadow-[0_16px_40px_rgba(7,27,43,0.14)] outline-none"
          >
            <StayStepper label="Adults" value={adults} min={GUEST_LIMITS.adults.min} max={GUEST_LIMITS.adults.max} onChange={setAdults} />
            <StayStepper label="Children" value={children} min={GUEST_LIMITS.children.min} max={GUEST_LIMITS.children.max} onChange={setChildren} />
          </DatePopover.Content>
        </DatePopover.Portal>
      </DatePopover.Root>
    </div>
  );
}

function StayButton({ disabled, label, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={disabled ? RANGE_ERROR : undefined}
      onClick={onClick}
      className="inline-flex h-11 shrink-0 cursor-pointer items-center rounded-full bg-gold px-4 text-sm font-semibold text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-60"
    >
      {label}
    </button>
  );
}
