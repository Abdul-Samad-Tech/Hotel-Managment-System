import { useMemo } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import { defaultStay, roomTypes } from "../data/site";
import { isStayRangeValid, parseStayDate, toStayIso } from "../lib/stay-date";
import { GUEST_LIMITS, PARTY_MAX, RANGE_ERROR, SEARCH_STORAGE_KEY } from "./search.constant";
import { createSafeStorage } from "./search.storage";

function clampInt(value, min, max, fallback) {
  const next = Number.parseInt(String(value), 10);
  if (!Number.isFinite(next)) return fallback;
  return Math.min(max, Math.max(min, next));
}

function clampParty(adults, children) {
  const nextAdults = clampInt(adults, GUEST_LIMITS.adults.min, GUEST_LIMITS.adults.max, defaultStay.adults);
  let nextChildren = clampInt(children, GUEST_LIMITS.children.min, GUEST_LIMITS.children.max, defaultStay.children);
  const overflow = nextAdults + nextChildren - PARTY_MAX;
  if (overflow > 0) nextChildren = Math.max(GUEST_LIMITS.children.min, nextChildren - overflow);
  return { adults: nextAdults, children: nextChildren };
}

export function isSearchRangeValid(checkIn, checkOut) {
  return isStayRangeValid(parseStayDate(checkIn), parseStayDate(checkOut));
}

function sanitizeSearch(input) {
  const source = input && typeof input === "object" ? input : {};
  const checkIn = parseStayDate(source.checkIn) ? source.checkIn : defaultStay.checkIn;
  const checkOut = parseStayDate(source.checkOut) ? source.checkOut : defaultStay.checkOut;
  const roomType = roomTypes.includes(source.roomType) ? source.roomType : defaultStay.roomType;
  const party = clampParty(source.adults, source.children);
  const rangeOk = isSearchRangeValid(checkIn, checkOut);
  return {
    checkIn: rangeOk ? checkIn : defaultStay.checkIn,
    checkOut: rangeOk ? checkOut : defaultStay.checkOut,
    adults: party.adults,
    children: party.children,
    roomType,
    flexibleDates: source.flexibleDates === true,
    rangeError: rangeOk ? "" : RANGE_ERROR,
  };
}

function readPersistedSearch() {
  try {
    if (typeof window === "undefined") return sanitizeSearch({});
    const raw = window.localStorage.getItem(SEARCH_STORAGE_KEY);
    if (!raw) return sanitizeSearch({});
    const parsed = JSON.parse(raw);
    const slice = parsed?.state && typeof parsed.state === "object" ? parsed.state : parsed;
    return sanitizeSearch(slice);
  } catch {
    return sanitizeSearch({});
  }
}

const initialSearch = readPersistedSearch();

export const useSearchStore = create(
  persist(
    (set) => ({
      ...initialSearch,
      setDates(checkIn, checkOut) {
        set((state) => {
          const nextIn = parseStayDate(checkIn) ? checkIn : state.checkIn;
          const nextOut = parseStayDate(checkOut) ? checkOut : state.checkOut;
          if (!isSearchRangeValid(nextIn, nextOut)) {
            return { rangeError: RANGE_ERROR };
          }
          return { checkIn: nextIn, checkOut: nextOut, rangeError: "" };
        });
      },
      setRange(fromDate, toDate) {
        set((state) => {
          const checkIn = toStayIso(fromDate);
          if (!checkIn) return state;
          if (!toDate) {
            const rangeOk = isSearchRangeValid(checkIn, state.checkOut);
            return { checkIn, rangeError: rangeOk ? "" : RANGE_ERROR };
          }
          const checkOut = toStayIso(toDate);
          if (!checkOut) return { checkIn, rangeError: RANGE_ERROR };
          if (!isSearchRangeValid(checkIn, checkOut)) {
            return { checkIn, checkOut, rangeError: RANGE_ERROR };
          }
          return { checkIn, checkOut, rangeError: "" };
        });
      },
      setAdults(adults) {
        set((state) => clampParty(adults, state.children));
      },
      setChildren(children) {
        set((state) => clampParty(state.adults, children));
      },
      setPartyTotal(total) {
        set((state) => {
          const next = clampInt(total, 1, PARTY_MAX, state.adults + state.children);
          let children = Math.min(state.children, GUEST_LIMITS.children.max);
          let adults = next - children;
          if (adults < GUEST_LIMITS.adults.min) {
            children = Math.max(GUEST_LIMITS.children.min, next - GUEST_LIMITS.adults.min);
            adults = next - children;
          }
          if (adults > GUEST_LIMITS.adults.max) {
            adults = GUEST_LIMITS.adults.max;
            children = Math.min(GUEST_LIMITS.children.max, next - adults);
          }
          return clampParty(adults, children);
        });
      },
      setRoomType(roomType) {
        if (!roomTypes.includes(roomType)) return;
        set({ roomType });
      },
      setFlexibleDates(flexibleDates) {
        set({ flexibleDates: flexibleDates === true });
      },
      reset() {
        set(sanitizeSearch(defaultStay));
      },
    }),
    {
      name: SEARCH_STORAGE_KEY,
      storage: createJSONStorage(() => createSafeStorage()),
      partialize: (state) => ({
        checkIn: state.checkIn,
        checkOut: state.checkOut,
        adults: state.adults,
        children: state.children,
        roomType: state.roomType,
        flexibleDates: state.flexibleDates,
      }),
      merge: (persisted, current) => ({
        ...current,
        ...sanitizeSearch(persisted),
      }),
    },
  ),
);

export function useSearchStay() {
  const slice = useSearchStore(
    useShallow((state) => ({
      checkInIso: state.checkIn,
      checkOutIso: state.checkOut,
      adults: state.adults,
      children: state.children,
      roomType: state.roomType,
      flexibleDates: state.flexibleDates,
      rangeError: state.rangeError,
    })),
  );
  const checkIn = useMemo(
    () => parseStayDate(slice.checkInIso) ?? parseStayDate(defaultStay.checkIn),
    [slice.checkInIso],
  );
  const checkOut = useMemo(
    () => parseStayDate(slice.checkOutIso) ?? parseStayDate(defaultStay.checkOut),
    [slice.checkOutIso],
  );
  return {
    checkIn,
    checkOut,
    adults: slice.adults,
    children: slice.children,
    roomType: slice.roomType,
    flexibleDates: slice.flexibleDates === true,
    rangeValid: isStayRangeValid(checkIn, checkOut),
    rangeError: slice.rangeError || "",
  };
}
