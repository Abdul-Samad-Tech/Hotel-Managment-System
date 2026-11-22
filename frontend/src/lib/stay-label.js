import { format as formatDate } from "date-fns";
import { SEARCH_CHIP } from "../store/search.constant";

export function guestLabel(adults, children) {
  const adultText = `${adults} Adult${adults === 1 ? "" : "s"}`;
  const childText = children === 1 ? "1 Child" : children === 0 ? "0 Child" : `${children} Children`;
  return `${adultText} · ${childText}`;
}

export function staySummary(checkIn, checkOut, adults, children, roomType) {
  if (!checkIn || !checkOut) return roomType;
  return `${formatDate(checkIn, "MMM d")} – ${formatDate(checkOut, "MMM d")} · ${guestLabel(adults, children)} · ${roomType}`;
}

export function stayDateRangeLabel(checkIn, checkOut) {
  if (!checkIn || !checkOut) return "";
  const sameMonth =
    formatDate(checkIn, "MMM yyyy") === formatDate(checkOut, "MMM yyyy");
  if (sameMonth) return `${formatDate(checkIn, "MMM d")} - ${formatDate(checkOut, "d")}`;
  return `${formatDate(checkIn, "MMM d")} - ${formatDate(checkOut, "MMM d")}`;
}

export function stayAdultsLabel(adults) {
  return `${adults} Adult${adults === 1 ? "" : "s"}`;
}

export function datesChipLabel(checkIn, checkOut, adults) {
  const range = stayDateRangeLabel(checkIn, checkOut);
  if (!range) return "";
  return `${SEARCH_CHIP.lead} ${range}, ${stayAdultsLabel(adults)}`;
}

export function flexSavingChipLabel(checkIn, checkOut, savingText) {
  const range = stayDateRangeLabel(checkIn, checkOut);
  if (!range || !savingText) return "";
  return `${range} is ${savingText} cheaper`;
}

