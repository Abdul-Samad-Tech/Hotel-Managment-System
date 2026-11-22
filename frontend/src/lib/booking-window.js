import { addDays } from "date-fns";
import { api } from "./api";
import { parseStayDate, toStayIso } from "./stay-date";

function startOfLocalToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function defaultBookingWindow() {
  const today = startOfLocalToday();
  return {
    from: today,
    to: addDays(today, 365),
    fromKey: toStayIso(today),
    toKey: toStayIso(addDays(today, 365)),
  };
}

export async function loadBookingWindow() {
  try {
    const data = await api("/booking-window");
    const from = parseStayDate(data.from) || startOfLocalToday();
    const to = data.to ? parseStayDate(data.to) : null;
    return {
      from,
      to,
      fromKey: data.from || toStayIso(from),
      toKey: data.to || "",
    };
  } catch {
    return defaultBookingWindow();
  }
}

/** DayPicker disabled matchers for past + admin window. */
export function bookingDisabledMatchers(window) {
  const win = window || defaultBookingWindow();
  const matchers = [{ before: win.from }];
  if (win.to) matchers.push({ after: win.to });
  return matchers;
}

export function isDateInBookingWindow(date, window) {
  if (!date) return false;
  const win = window || defaultBookingWindow();
  if (date < win.from) return false;
  if (win.to && date > win.to) return false;
  return true;
}

export function isStayInBookingWindow(checkIn, checkOut, window) {
  if (!checkIn || !checkOut) return false;
  const win = window || defaultBookingWindow();
  if (checkIn < win.from) return false;
  if (win.to && checkOut > win.to) return false;
  return true;
}
