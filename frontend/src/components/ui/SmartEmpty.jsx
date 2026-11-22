import { Link } from "react-router-dom";
import { countOpenRoomsForStay, findOpenStayAlternative } from "../../lib/availability";
import { LIST_EMPTY, WHATSAPP_HREF } from "../../lib/list-empty.constant";
import { stayDateRangeLabel } from "../../lib/stay-label";
import { parseStayDate } from "../../lib/stay-date";
import { EmptyState } from "../ui/EmptyState";

const actionClass =
  "inline-flex h-11 cursor-pointer items-center rounded-full px-5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";

export function RoomsEmptyState({
  query,
  checkInIso,
  checkOutIso,
  onClearFilters,
  onSwitchDates,
}) {
  const checkIn = parseStayDate(checkInIso);
  const checkOut = parseStayDate(checkOutIso);
  const range = stayDateRangeLabel(checkIn, checkOut);
  const openNow = checkInIso && checkOutIso ? countOpenRoomsForStay(checkInIso, checkOutIso) : -1;
  const alt =
    openNow === 0 && checkInIso && checkOutIso
      ? findOpenStayAlternative(checkInIso, checkOutIso)
      : null;

  let title = query ? LIST_EMPTY.roomsSearchTitle : LIST_EMPTY.roomsFiltersTitle;
  let text = query ? LIST_EMPTY.roomsSearchText : LIST_EMPTY.roomsFiltersText;

  if (openNow === 0 && range) {
    title = LIST_EMPTY.roomsAvailabilityLead.replace("{range}", range);
    if (alt) {
      const altRange = stayDateRangeLabel(parseStayDate(alt.checkInIso), parseStayDate(alt.checkOutIso));
      text = LIST_EMPTY.roomsAvailabilityHint
        .replace("{count}", String(alt.roomCount))
        .replace("{range}", altRange);
    } else {
      text = LIST_EMPTY.roomsFiltersText;
    }
  }

  return (
    <EmptyState title={title} text={text}>
      <div className="flex flex-wrap justify-center gap-3">
        {onSwitchDates ? (
          <button type="button" onClick={() => onSwitchDates(alt)} className={`${actionClass} bg-gold text-navy`}>
            {LIST_EMPTY.roomsSwitchDates}
          </button>
        ) : null}
        <button type="button" onClick={onClearFilters} className={`${actionClass} border border-navy/15 bg-white text-navy`}>
          {LIST_EMPTY.roomsClear}
        </button>
        <a
          href={WHATSAPP_HREF}
          target="_blank"
          rel="noreferrer"
          className={`${actionClass} bg-navy text-white`}
        >
          {LIST_EMPTY.roomsWhatsapp}
        </a>
      </div>
    </EmptyState>
  );
}

export function WishlistEmptyState({ onBrowse }) {
  return (
    <EmptyState title={LIST_EMPTY.wishlistTitle} text={LIST_EMPTY.wishlistText}>
      <Link
        to="/rooms"
        onClick={onBrowse}
        className={`${actionClass} bg-gold text-navy`}
      >
        {LIST_EMPTY.wishlistBrowse}
      </Link>
    </EmptyState>
  );
}

export function CompareEmptyState({ onBrowse }) {
  return (
    <EmptyState title={LIST_EMPTY.compareTitle} text={LIST_EMPTY.compareText}>
      <Link to="/rooms" onClick={onBrowse} className={`${actionClass} bg-gold text-navy`}>
        {LIST_EMPTY.compareBrowse}
      </Link>
    </EmptyState>
  );
}

export function BookingsEmptyState() {
  return (
    <EmptyState title={LIST_EMPTY.bookingsTitle} text={LIST_EMPTY.bookingsText}>
      <Link to="/rooms" className={`${actionClass} bg-gold text-navy`}>
        {LIST_EMPTY.bookingsBrowse}
      </Link>
    </EmptyState>
  );
}
