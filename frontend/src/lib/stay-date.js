import { differenceInCalendarDays, format, isValid, parse, parseISO } from "date-fns";

const parseRef = parseISO("2020-06-15T12:00:00.000Z");
const isoPattern = /^\d{4}-\d{2}-\d{2}$/;

export function parseStayDate(value) {
  if (typeof value !== "string" || !isoPattern.test(value)) return null;
  const parsed = parse(value, "yyyy-MM-dd", parseRef);
  return isValid(parsed) ? parsed : null;
}

export function toStayIso(date) {
  if (!date || !isValid(date)) return "";
  return format(date, "yyyy-MM-dd");
}

export function stayNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  return differenceInCalendarDays(checkOut, checkIn);
}

export function isStayRangeValid(checkIn, checkOut) {
  return stayNights(checkIn, checkOut) > 0;
}
