import { addDays, addMonths, format } from "date-fns";
import { mockAvailabilityRange } from "../data/availability";
import { rooms } from "../data/rooms";
import { api } from "./api";
import {
  AVAILABILITY_SOURCE,
  FLEX_HINT_LIMIT,
  FLEX_OFFSET_DAYS,
} from "./availability.constant";
import { RESORT_FEE_PER_NIGHT, TAX_RATE } from "./pricing.constant";
import { parseStayDate, stayNights, toStayIso } from "./stay-date";

function isNightRecord(value) {
  return Boolean(value && typeof value.price === "number");
}

function addNight(nights, date, price, available) {
  if (!parseStayDate(date) || typeof price !== "number") return;
  nights[date] = { price, available: available !== false };
}

export function normalizeAvailability(result) {
  const nights = {};
  if (result?.nights && typeof result.nights === "object" && !Array.isArray(result.nights)) {
    Object.entries(result.nights).forEach(([date, night]) => {
      if (isNightRecord(night)) addNight(nights, date, night.price, night.available);
    });
    return { nights };
  }
  if (Array.isArray(result?.days)) {
    result.days.forEach((item) => {
      if (item && isNightRecord(item)) addNight(nights, item.date, item.price, item.available);
    });
  }
  return { nights };
}

async function fetchAvailabilityApi({ roomType, fromIso, toIso }) {
  const query = new URLSearchParams({ roomType, from: fromIso, to: toIso });
  const result = await api(`/availability?${query}`);
  return normalizeAvailability(result);
}

async function fetchAvailabilityMock({ roomType, fromIso, toIso }) {
  return { nights: mockAvailabilityRange(roomType, fromIso, toIso) };
}

export async function getRoomAvailability({ roomType, fromIso, toIso }) {
  if (AVAILABILITY_SOURCE === "api") {
    try {
      return await fetchAvailabilityApi({ roomType, fromIso, toIso });
    } catch (error) {
      // Offline / API down — keep calendar usable with mock, but live booking still enforces overlaps.
      if (import.meta.env.DEV) {
        console.warn("[availability] API failed, using mock:", error.message);
      }
      return fetchAvailabilityMock({ roomType, fromIso, toIso });
    }
  }
  return fetchAvailabilityMock({ roomType, fromIso, toIso });
}

export function sumStay(nights, checkInIso, nightCount) {
  const start = parseStayDate(checkInIso);
  if (!start || nightCount <= 0) return null;
  let total = 0;
  for (let index = 0; index < nightCount; index += 1) {
    const iso = toStayIso(addDays(start, index));
    const night = nights[iso];
    if (!night || !night.available) return null;
    total += night.price;
  }
  return total;
}

export function stayQuote(nights, checkInIso, checkOutIso) {
  const start = parseStayDate(checkInIso);
  const end = parseStayDate(checkOutIso);
  const count = stayNights(start, end);
  if (count <= 0) return null;
  const subtotal = sumStay(nights, checkInIso, count);
  if (subtotal == null) return null;
  const fees = count * RESORT_FEE_PER_NIGHT;
  const tax = Math.round((subtotal + fees) * TAX_RATE);
  return {
    nights: count,
    subtotal,
    fees,
    tax,
    total: subtotal + fees + tax,
  };
}

export function stayIncludesSoldOut(nights, checkInIso, checkOutIso) {
  const start = parseStayDate(checkInIso);
  const end = parseStayDate(checkOutIso);
  const count = stayNights(start, end);
  if (count <= 0) return false;
  for (let index = 0; index < count; index += 1) {
    const iso = toStayIso(addDays(start, index));
    const night = nights[iso];
    if (night && !night.available) return true;
  }
  return false;
}

export function findCheaperStays(
  nights,
  checkInIso,
  checkOutIso,
  offsetDays = FLEX_OFFSET_DAYS,
  limit = FLEX_HINT_LIMIT,
) {
  const start = parseStayDate(checkInIso);
  const end = parseStayDate(checkOutIso);
  const nightCount = stayNights(start, end);
  const current = sumStay(nights, checkInIso, nightCount);
  if (!start || current == null) return [];
  const found = [];
  for (let offset = -offsetDays; offset <= offsetDays; offset += 1) {
    if (offset === 0) continue;
    const nextIn = toStayIso(addDays(start, offset));
    const nextDate = parseStayDate(nextIn);
    if (!nextDate) continue;
    const total = sumStay(nights, nextIn, nightCount);
    if (total == null || total >= current) continue;
    const checkOutNext = toStayIso(addDays(nextDate, nightCount));
    found.push({
      checkInIso: nextIn,
      checkOutIso: checkOutNext,
      total,
      saving: current - total,
      label: format(nextDate, "d MMM"),
    });
  }
  return found
    .sort((left, right) => right.saving - left.saving || left.checkInIso.localeCompare(right.checkInIso))
    .slice(0, Math.max(0, limit));
}

export function findCheaperStay(nights, checkInIso, checkOutIso, offsetDays = FLEX_OFFSET_DAYS) {
  return findCheaperStays(nights, checkInIso, checkOutIso, offsetDays, 1)[0] ?? null;
}

export function lowerPriceIsos(nights, monthDate) {
  const prefix = format(monthDate, "yyyy-MM");
  const priced = Object.entries(nights).filter(([iso, night]) => iso.startsWith(prefix) && night.available);
  if (priced.length < 2) return [];
  const min = Math.min(...priced.map((entry) => entry[1].price));
  const max = Math.max(...priced.map((entry) => entry[1].price));
  if (min === max) return [];
  return priced.filter((entry) => entry[1].price === min).map((entry) => entry[0]);
}

export function soldOutIsos(nights, monthDate, monthCount = 1) {
  if (!monthDate) return [];
  const prefixes = new Set();
  for (let index = 0; index < monthCount; index += 1) {
    prefixes.add(format(addMonths(monthDate, index), "yyyy-MM"));
  }
  return Object.entries(nights)
    .filter(([iso, night]) => prefixes.has(iso.slice(0, 7)) && night && !night.available)
    .map(([iso]) => iso);
}

function stayFullyOpen(nights, checkInIso, nightCount) {
  const start = parseStayDate(checkInIso);
  if (!start || nightCount <= 0) return false;
  for (let index = 0; index < nightCount; index += 1) {
    const iso = toStayIso(addDays(start, index));
    const night = nights[iso];
    if (!night || !night.available) return false;
  }
  return true;
}

/** How many catalog rooms are fully open for a stay (sync mock or preloaded nights map per room type). */
export function countOpenRoomsForStay(checkInIso, checkOutIso, catalog = rooms) {
  const start = parseStayDate(checkInIso);
  const end = parseStayDate(checkOutIso);
  const nightCount = stayNights(start, end);
  if (nightCount <= 0) return 0;
  let open = 0;
  for (const room of catalog) {
    const nights = mockAvailabilityRange(room.selectLabel, checkInIso, checkOutIso);
    if (stayFullyOpen(nights, checkInIso, nightCount)) open += 1;
  }
  return open;
}

/**
 * Nearby stay window with the most open rooms. Used by smart empty states.
 * @returns {{ checkInIso: string, checkOutIso: string, roomCount: number } | null}
 */
export function findOpenStayAlternative(
  checkInIso,
  checkOutIso,
  offsetDays = FLEX_OFFSET_DAYS,
  catalog = rooms,
) {
  const start = parseStayDate(checkInIso);
  const end = parseStayDate(checkOutIso);
  const nightCount = stayNights(start, end);
  if (!start || nightCount <= 0) return null;

  let best = null;
  for (let offset = -offsetDays; offset <= offsetDays; offset += 1) {
    const nextIn = toStayIso(addDays(start, offset));
    const nextDate = parseStayDate(nextIn);
    if (!nextDate) continue;
    const nextOut = toStayIso(addDays(nextDate, nightCount));
    const roomCount = countOpenRoomsForStay(nextIn, nextOut, catalog);
    if (roomCount <= 0) continue;
    if (!best || roomCount > best.roomCount || (roomCount === best.roomCount && Math.abs(offset) < Math.abs(best.offset))) {
      best = { checkInIso: nextIn, checkOutIso: nextOut, roomCount, offset };
    }
  }
  if (!best) return null;
  return {
    checkInIso: best.checkInIso,
    checkOutIso: best.checkOutIso,
    roomCount: best.roomCount,
  };
}
