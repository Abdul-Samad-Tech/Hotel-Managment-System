import { useEffect, useId, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Drawer } from "vaul";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { requireSignedIn } from "../../lib/auth-gate";
import { duration, easeFlow, springSoft, tideDelay, viewportOnce } from "../../lib/motion";
import { toStayIso } from "../../lib/stay-date";
import { guestLabel, staySummary } from "../../lib/stay-label";
import { STICKY_EVENT, STICKY_FORM_ID } from "../../lib/sticky-bar.constant";
import { RANGE_ERROR } from "../../store/search.constant";
import { useSearchStay, useSearchStore } from "../../store/searchStore";
import { StayFields } from "../booking/StayFields";
import { notify } from "../ui/BayToaster";
import { useLocale } from "../../context/LocaleContext";

const nightly = {
  "Deluxe Room": 120,
  "Premium Ocean Suite": 220,
  "Presidential Suite": 380,
  "Family Suite": 260,
};

export function BookingBar({ overlap = true, initialRoomType, allowReserve = false }) {
  const reduce = useReducedMotion();
  const formRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { format } = useLocale();
  const mobile = useMaxWidth(767);
  const wide = useMinWidth(768);
  const { checkIn, checkOut, adults, children, roomType, rangeValid } = useSearchStay();
  const setRange = useSearchStore((state) => state.setRange);
  const setAdults = useSearchStore((state) => state.setAdults);
  const setChildren = useSearchStore((state) => state.setChildren);
  const setRoomType = useSearchStore((state) => state.setRoomType);
  const [open, setOpen] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [note, setNote] = useState("");
  const [fault, setFault] = useState("");
  const [busy, setBusy] = useState(false);
  const noteId = useId();
  const canSubmit = rangeValid && !busy;

  useEffect(() => {
    if (initialRoomType) setRoomType(initialRoomType);
  }, [initialRoomType, setRoomType]);

  useEffect(() => {
    function openStay() {
      setDrawerOpen(true);
    }
    window.addEventListener(STICKY_EVENT, openStay);
    return () => window.removeEventListener(STICKY_EVENT, openStay);
  }, []);

  function chooseRange(next) {
    if (!next?.from) return;
    setRange(next.from, next.to);
    if (next.to) setOpen(null);
    setNote("");
    setFault("");
  }

  function fail(message) {
    setNote("");
    setFault(message);
    notify(message);
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (!rangeValid) {
      fail(RANGE_ERROR);
      return;
    }
    if (!requireSignedIn(user, navigate, {
      returnTo: allowReserve ? "/booking" : "/",
      message: "Sign in to check availability and continue.",
    })) {
      return;
    }
    setOpen(null);
    setBusy(true);
    try {
      const query = new URLSearchParams({
        checkIn: toStayIso(checkIn),
        checkOut: toStayIso(checkOut),
        adults: String(adults),
        children: String(children),
        roomType,
      });
      const result = await api(`/availability?${query}`);
      if (!result.available) {
        fail(result.message);
        return;
      }
      if (!allowReserve) {
        setFault("");
        setNote(`${result.message} Total ${format(result.total)} for ${guestLabel(adults, children)}.`);
        return;
      }
      const saved = await api("/reservations", {
        method: "POST",
        body: {
          checkIn: toStayIso(checkIn),
          checkOut: toStayIso(checkOut),
          adults,
          children,
          roomType,
        },
      });
      setFault("");
      setNote(`Confirmed ${saved.reservation.confirmationCode} for room ${saved.reservation.roomNumber}.`);
      setDrawerOpen(false);
    } catch (error) {
      fail(error.message);
    } finally {
      setBusy(false);
    }
  }

  const summary = staySummary(checkIn, checkOut, adults, children, roomType);

  const fields = (
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
      setRoomType={(value) => {
        setRoomType(value);
        setNote("");
        setFault("");
      }}
      months={wide ? 2 : 1}
      price={nightly[roomType]}
      busy={busy}
      canSubmit={canSubmit}
      allowReserve={allowReserve}
      reduce={reduce}
      note={note}
      fault={fault || (rangeValid ? "" : RANGE_ERROR)}
      noteId={noteId}
    />
  );

  return (
    <motion.div
      id="booking"
      className={overlap ? "relative z-30 -mt-14 px-4 sm:-mt-[4.5rem]" : "relative"}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportOnce}
      transition={reduce ? { duration: duration.micro, ease: easeFlow } : { ...springSoft, delay: tideDelay(4) }}
    >
      {mobile ? (
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="page-wrap flex w-full items-center justify-between gap-3 rounded-[22px] border border-white bg-white/95 px-4 py-3 text-left shadow-[0_18px_50px_rgba(7,27,43,0.12)]"
        >
          <span>
            <span className="block text-[11px] font-medium tracking-[0.16em] text-muted uppercase">Check availability</span>
            <span className="mt-1 block text-sm font-semibold text-navy">{summary}</span>
          </span>
          <span className="inline-flex h-11 shrink-0 items-center rounded-full bg-gold px-4 text-sm font-semibold text-navy">Dates</span>
        </button>
      ) : (
        <form
          id={STICKY_FORM_ID}
          ref={formRef}
          onSubmit={onSubmit}
          className="page-wrap rounded-[22px] border border-white bg-white/95 p-3 shadow-[0_18px_50px_rgba(7,27,43,0.12)] backdrop-blur-xl sm:px-5 sm:py-3.5"
        >
          {fields}
        </form>
      )}

      <Drawer.Root open={mobile && drawerOpen} onOpenChange={setDrawerOpen} shouldScaleBackground={false}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[60] bg-navy/50" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-[70] max-h-[88vh] overflow-y-auto rounded-t-2xl bg-white px-4 pt-3 pb-6 outline-none">
            <Drawer.Handle className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-navy/15" />
            <Drawer.Title className="font-display text-2xl text-navy">Your stay</Drawer.Title>
            <form id={mobile ? STICKY_FORM_ID : undefined} onSubmit={onSubmit} className="mt-4">
              {mobile ? fields : null}
            </form>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </motion.div>
  );
}

function useMaxWidth(width) {
  return useMedia(`(max-width: ${width}px)`);
}

function useMinWidth(width) {
  return useMedia(`(min-width: ${width}px)`);
}

function useMedia(query) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setMatches(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}
