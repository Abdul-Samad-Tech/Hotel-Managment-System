import { addDays, addMonths, endOfMonth, format as formatDate, startOfMonth } from "date-fns";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { useReducedMotion } from "framer-motion";
import "react-day-picker/style.css";
import {
  findCheaperStays,
  lowerPriceIsos,
  soldOutIsos,
  stayIncludesSoldOut,
  stayQuote,
} from "../../lib/availability";
import { AVAILABILITY_COPY, FLEX_OFFSET_DAYS } from "../../lib/availability.constant";
import { MEDIA_NARROW } from "../../lib/media.constant";
import { duration } from "../../lib/motion";
import { parseStayDate, toStayIso } from "../../lib/stay-date";
import { flexSavingChipLabel } from "../../lib/stay-label";
import { defaultStay } from "../../data/site";
import { useLocale } from "../../context/LocaleContext";
import { useMediaQuery } from "../../hooks/use-media-query";
import { useSearchStore } from "../../store/searchStore";
import { Price, priceParts } from "../ui/Price";
import { EmptyState } from "../ui/EmptyState";
import { ErrorState } from "../ui/ErrorState";
import { InlineError } from "../ui/InlineError";
import { Skeleton } from "../ui/Skeleton";
import { useBookingWindow } from "../../hooks/use-booking-window";
import { bookingDisabledMatchers } from "../../lib/booking-window";
import { useRoomAvailability } from "./use-room-availability";

const PriceCalendarContext = createContext(null);

function windowForMonth(month, monthCount) {
  if (!month) return { fromIso: defaultStay.checkIn, toIso: defaultStay.checkOut };
  const start = addDays(startOfMonth(month), -(FLEX_OFFSET_DAYS + 7));
  const last = addMonths(month, Math.max(monthCount, 1) - 1);
  const end = addDays(endOfMonth(last), FLEX_OFFSET_DAYS + 14);
  return { fromIso: toStayIso(start), toIso: toStayIso(end) };
}

function compactNightly(usd, currency) {
  const { amount, prefix } = priceParts(usd, currency);
  if (amount >= 10000) return `${prefix}${Math.round(amount / 1000)}k`;
  return `${prefix}${amount}`;
}

function PriceDayButton(props) {
  const { day, modifiers, children, ...buttonProps } = props;
  const ctx = useContext(PriceCalendarContext);
  const ref = useRef(null);
  const iso = toStayIso(day.date);
  const night = ctx?.nights[iso];
  const soldOut = Boolean(night && !night.available);
  const lower = Boolean(modifiers.cheaper);

  useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <button {...buttonProps} type="button" ref={ref} className={`${buttonProps.className ?? ""} relative`}>
      <span className={soldOut ? "line-through decoration-navy/40" : undefined}>{children}</span>
      {night?.available ? (
        <span aria-hidden="true" className="text-[9px] leading-none text-navy/70">
          {ctx.compact(night.price)}
        </span>
      ) : null}
      {soldOut ? (
        <span aria-hidden="true" className="text-[9px] leading-none text-muted">
          —
        </span>
      ) : null}
      {lower ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-gold"
        />
      ) : null}
      {lower ? <span className="sr-only">{AVAILABILITY_COPY.lower}</span> : null}
    </button>
  );
}

function MonthSkeleton({ months }) {
  return (
    <div className="grid gap-4" aria-busy="true" aria-label={AVAILABILITY_COPY.loading}>
      {Array.from({ length: months }, (_, monthIndex) => (
        <div key={monthIndex} className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }, (_, cell) => (
            <Skeleton key={cell} className="h-11 w-11 rounded-xl" />
          ))}
        </div>
      ))}
    </div>
  );
}

function StaySummary({ quote, formatMoney }) {
  if (!quote) return null;
  const nightLabel = quote.nights === 1 ? AVAILABILITY_COPY.nightWord : AVAILABILITY_COPY.nightsWord;
  return (
    <p className="mt-3 px-1 text-sm font-medium text-navy" role="status">
      {quote.nights} {nightLabel} - {formatMoney(quote.total)} {AVAILABILITY_COPY.totalWord},{" "}
      {AVAILABILITY_COPY.taxesIncluded}
    </p>
  );
}

function FlexibleChips({ hints, onApply, formatMoney }) {
  if (hints.length === 0) {
    return <p className="mt-2 text-sm text-muted">{AVAILABILITY_COPY.flexNone}</p>;
  }
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {hints.map((hint) => {
        const checkIn = parseStayDate(hint.checkInIso);
        const checkOut = parseStayDate(hint.checkOutIso);
        const label = flexSavingChipLabel(checkIn, checkOut, formatMoney(hint.saving));
        return (
          <button
            key={`${hint.checkInIso}-${hint.checkOutIso}`}
            type="button"
            disabled={!checkIn || !checkOut}
            onClick={() => checkIn && checkOut && onApply({ from: checkIn, to: checkOut })}
            className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-navy/10 bg-cream px-3 text-sm text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function FlexibleToggle({ flexibleDates, onToggle }) {
  return (
    <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-2 text-sm text-navy">
      <input
        type="checkbox"
        className="h-4 w-4 accent-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        checked={flexibleDates}
        onChange={(event) => onToggle(event.target.checked)}
      />
      <span>
        {AVAILABILITY_COPY.flexible}
        <span className="mt-0.5 block text-xs text-muted">{AVAILABILITY_COPY.flexibleHelp}</span>
      </span>
    </label>
  );
}

function NavButton(props) {
  return <button {...props} type="button" />;
}

function PriceGrid({
  nights,
  cheaperDates,
  soldOutDates,
  windowDisabled,
  selected,
  onSelect,
  month,
  setMonth,
  monthCount,
  defaultMonth,
  formatMoney,
}) {
  return (
    <DayPicker
      mode="range"
      selected={selected}
      onSelect={onSelect}
      numberOfMonths={monthCount}
      month={month}
      onMonthChange={setMonth}
      defaultMonth={defaultMonth}
      disabled={[...windowDisabled, ...soldOutDates]}
      className="azure-calendar azure-calendar-prices"
      modifiers={{ cheaper: cheaperDates, soldOut: soldOutDates }}
      modifiersClassNames={{ cheaper: "azure-day-lower", soldOut: "azure-day-sold" }}
      components={{ DayButton: PriceDayButton, NextMonthButton: NavButton, PreviousMonthButton: NavButton }}
      labels={{
        labelDayButton(date, modifiers) {
          const iso = toStayIso(date);
          const night = nights[iso];
          const stamp = formatDate(date, "PPP");
          if (!night) return stamp;
          if (!night.available) return `${stamp}, ${AVAILABILITY_COPY.soldOut}`;
          const lower = modifiers.cheaper ? `, ${AVAILABILITY_COPY.lower} rate this month` : "";
          return `${stamp}, ${formatMoney(night.price)} per night${lower}`;
        },
      }}
    />
  );
}

export function PriceCalendar({
  selected,
  onSelect,
  numberOfMonths = 1,
  defaultMonth,
  roomType,
  checkIn,
  checkOut,
}) {
  const reduce = useReducedMotion();
  const narrow = useMediaQuery(MEDIA_NARROW);
  const { format, currency } = useLocale();
  const { window: bookingWindow } = useBookingWindow();
  const windowDisabled = useMemo(() => bookingDisabledMatchers(bookingWindow), [bookingWindow]);
  const flexibleDates = useSearchStore((state) => state.flexibleDates);
  const setFlexibleDates = useSearchStore((state) => state.setFlexibleDates);
  const [month, setMonth] = useState(defaultMonth);
  const [monthSource, setMonthSource] = useState(defaultMonth);
  if (defaultMonth !== monthSource) {
    setMonthSource(defaultMonth);
    setMonth(defaultMonth);
  }
  const monthCount = narrow ? 1 : numberOfMonths;
  const viewed = month ?? defaultMonth ?? parseStayDate(defaultStay.checkIn);
  const range = windowForMonth(viewed, monthCount);
  const { status, nights, fault, retry } = useRoomAvailability(roomType, range.fromIso, range.toIso);
  const fadeMs = reduce ? 0 : duration.ui * 1000;

  const cheaperDates = useMemo(() => {
    if (!viewed) return [];
    const months = [viewed];
    if (monthCount > 1) months.push(addMonths(viewed, 1));
    return months.flatMap((item) => lowerPriceIsos(nights, item)).map((iso) => parseStayDate(iso)).filter(Boolean);
  }, [nights, monthCount, viewed]);

  const soldOutDates = useMemo(() => {
    if (!viewed) return [];
    return soldOutIsos(nights, viewed, monthCount)
      .map((iso) => parseStayDate(iso))
      .filter(Boolean);
  }, [nights, monthCount, viewed]);

  const checkInIso = toStayIso(checkIn);
  const checkOutIso = toStayIso(checkOut);
  const soldOutStay = stayIncludesSoldOut(nights, checkInIso, checkOutIso);
  const quote = status === "ready" && !soldOutStay ? stayQuote(nights, checkInIso, checkOutIso) : null;
  const flexHints =
    flexibleDates && status === "ready" && checkInIso && checkOutIso && !soldOutStay
      ? findCheaperStays(nights, checkInIso, checkOutIso)
      : [];

  return (
    <PriceCalendarContext.Provider value={{ nights, compact: (usd) => compactNightly(usd, currency) }}>
      <div style={{ transitionProperty: "opacity", transitionDuration: `${fadeMs}ms` }}>
        {status === "loading" ? <MonthSkeleton months={monthCount} /> : null}
        {status === "error" ? (
          <ErrorState title={AVAILABILITY_COPY.errorTitle} text={fault || AVAILABILITY_COPY.errorText} onRetry={retry} />
        ) : null}
        {status === "empty" ? <EmptyState title={AVAILABILITY_COPY.emptyTitle} text={AVAILABILITY_COPY.emptyText} /> : null}
        {status === "ready" ? (
          <div className={narrow ? "max-h-[min(70vh,36rem)] overflow-y-auto overscroll-contain pr-1" : undefined}>
            <PriceGrid
              nights={nights}
              cheaperDates={cheaperDates}
              soldOutDates={soldOutDates}
              windowDisabled={windowDisabled}
              selected={selected}
              onSelect={onSelect}
              month={viewed}
              setMonth={setMonth}
              monthCount={monthCount}
              defaultMonth={defaultMonth}
              formatMoney={format}
            />
          </div>
        ) : null}
        {status === "ready" ? <StaySummary quote={quote} formatMoney={format} /> : null}
        <p className="px-1 pt-2 text-[11px] leading-5 text-muted">{AVAILABILITY_COPY.legend}</p>
        <FlexibleToggle flexibleDates={flexibleDates} onToggle={setFlexibleDates} />
        {flexibleDates && status === "ready" && !soldOutStay ? (
          <FlexibleChips hints={flexHints} onApply={onSelect} formatMoney={format} />
        ) : null}
        <InlineError id="stay-sold-out">{soldOutStay ? AVAILABILITY_COPY.soldOutStay : ""}</InlineError>
      </div>
    </PriceCalendarContext.Provider>
  );
}
