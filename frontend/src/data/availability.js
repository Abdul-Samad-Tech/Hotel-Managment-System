import { addDays, getDay, isAfter } from "date-fns";
import { rooms } from "./rooms";
import { parseStayDate, toStayIso } from "../lib/stay-date";

function nightHash(iso, roomType) {
  const text = `${iso}:${roomType}`;
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 33 + text.charCodeAt(index)) % 10007;
  }
  return hash;
}

export function mockNightRate(roomType, iso) {
  const room = rooms.find((item) => item.selectLabel === roomType);
  const base = room ? room.price : 120;
  const date = parseStayDate(iso);
  if (!date) return null;
  const hash = nightHash(iso, roomType);
  if (hash % 23 === 0) {
    return { date: iso, price: base, available: false };
  }
  const weekday = getDay(date);
  let price = base;
  if (weekday === 5 || weekday === 6) price = Math.round(base * 1.12);
  else if (weekday === 1 || weekday === 2) price = Math.round(base * 0.88);
  if (hash % 9 === 0) price = Math.round(price * 0.92);
  return { date: iso, price, available: true };
}

export function mockAvailabilityRange(roomType, fromIso, toIso) {
  const start = parseStayDate(fromIso);
  const end = parseStayDate(toIso);
  const nights = {};
  if (!start || !end || isAfter(start, end)) return nights;
  let cursor = start;
  while (!isAfter(cursor, end)) {
    const iso = toStayIso(cursor);
    const night = mockNightRate(roomType, iso);
    if (night) nights[iso] = { price: night.price, available: night.available };
    cursor = addDays(cursor, 1);
  }
  return nights;
}
