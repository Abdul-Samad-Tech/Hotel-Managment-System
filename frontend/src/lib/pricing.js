import { addDays, getDay } from "date-fns";
import { rooms } from "../data/rooms";
import { parseStayDate, stayNights, toStayIso } from "./stay-date";
import {
  HIGH_SEASON_MONTHS,
  HIGH_SEASON_MULTIPLIER,
  RESORT_FEE_PER_NIGHT,
  TAX_RATE,
  WEEKDAY_SOFT_DAYS,
  WEEKDAY_SOFT_MULTIPLIER,
  WEEKEND_DAYS,
  WEEKEND_MULTIPLIER,
} from "./pricing.constant";

export function roomForPrice(roomOrId) {
  if (typeof roomOrId === "string") {
    return rooms.find((item) => item.id === roomOrId) ?? null;
  }
  if (roomOrId && typeof roomOrId.id === "string") {
    return rooms.find((item) => item.id === roomOrId.id) ?? null;
  }
  return null;
}

export function stayIso(value) {
  if (typeof value === "string") return parseStayDate(value) ? value : "";
  return toStayIso(value);
}

export function getNightlyPrice(roomId, date) {
  const room = roomForPrice(roomId);
  const iso = stayIso(date);
  const night = parseStayDate(iso);
  if (!room || !night) return null;
  let price = room.price;
  const weekday = getDay(night);
  const month = Number.parseInt(iso.slice(5, 7), 10);
  if (WEEKEND_DAYS.includes(weekday)) price = Math.round(price * WEEKEND_MULTIPLIER);
  else if (WEEKDAY_SOFT_DAYS.includes(weekday)) price = Math.round(price * WEEKDAY_SOFT_MULTIPLIER);
  if (HIGH_SEASON_MONTHS.includes(month)) price = Math.round(price * HIGH_SEASON_MULTIPLIER);
  return price;
}

export function getTotal(room, checkIn, checkOut) {
  const resolved = roomForPrice(room);
  const startIso = stayIso(checkIn);
  const endIso = stayIso(checkOut);
  const start = parseStayDate(startIso);
  const end = parseStayDate(endIso);
  const nights = stayNights(start, end);
  if (!resolved || nights <= 0) return null;
  let subtotal = 0;
  for (let index = 0; index < nights; index += 1) {
    const nightly = getNightlyPrice(resolved.id, toStayIso(addDays(start, index)));
    if (nightly == null) return null;
    subtotal += nightly;
  }
  const fees = nights * RESORT_FEE_PER_NIGHT;
  const tax = Math.round((subtotal + fees) * TAX_RATE);
  return { nights, subtotal, fees, tax, total: subtotal + fees + tax };
}
