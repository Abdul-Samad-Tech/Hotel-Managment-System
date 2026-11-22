import { addDays, addMonths, format, isBefore, startOfDay } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { api } from "../../lib/api";
import { stayIncludesSoldOut } from "../../lib/availability";
import { parseStayDate, stayNights, toStayIso } from "../../lib/stay-date";
import { InlineError } from "../ui/InlineError";
import { Skeleton } from "../ui/Skeleton";

/**
 * Desk-only: move a confirmed stay. Nights held by other guests on this room are disabled.
 */
export function MoveDatesForm({ detail, onMoveDates }) {
  const [checkIn, setCheckIn] = useState(() => parseStayDate(detail.checkIn));
  const [checkOut, setCheckOut] = useState(() => parseStayDate(detail.checkOut));
  const [nights, setNights] = useState({});
  const [loading, setLoading] = useState(true);
  const [fault, setFault] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    if (!detail.roomType) {
      setLoading(false);
      setFault("This stay has no room type — cannot check inventory.");
      return undefined;
    }
    setLoading(true);
    const fromIso = toStayIso(addDays(startOfDay(new Date()), -1));
    const toIso = toStayIso(addMonths(startOfDay(new Date()), 4));
    const query = new URLSearchParams({
      roomType: detail.roomType,
      from: fromIso,
      to: toIso,
      ignoreReservationId: String(detail.id),
    });
    if (detail.roomId) query.set("roomId", String(detail.roomId));
    api(`/availability?${query}`)
      .then((data) => {
        if (!live) return;
        setNights(data.nights && typeof data.nights === "object" ? data.nights : {});
        setFault("");
      })
      .catch((error) => {
        if (!live) return;
        setNights({});
        setFault(error.message);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [detail.id, detail.roomType, detail.roomId]);

  const soldOutDates = useMemo(
    () =>
      Object.entries(nights)
        .filter(([, night]) => night && night.available === false)
        .map(([iso]) => parseStayDate(iso))
        .filter(Boolean),
    [nights],
  );

  const today = startOfDay(new Date());
  const checkInIso = toStayIso(checkIn);
  const checkOutIso = toStayIso(checkOut);
  const blockedStay =
    checkInIso && checkOutIso && Object.keys(nights).length > 0
      ? stayIncludesSoldOut(nights, checkInIso, checkOutIso)
      : false;
  const nightsCount = stayNights(checkIn, checkOut);

  async function onSubmit(event) {
    event.preventDefault();
    if (!checkIn || !checkOut || nightsCount <= 0) {
      setFault("Choose a check-in and a later check-out.");
      return;
    }
    if (blockedStay) {
      setFault("Those dates include a night already reserved by another guest.");
      return;
    }
    setBusy(true);
    setFault("");
    try {
      await Promise.resolve(onMoveDates?.(detail.id, checkInIso, checkOutIso));
    } catch (error) {
      setFault(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="grid gap-3 border-t border-navy/10 pt-4" onSubmit={onSubmit}>
      <div>
        <p className="text-sm font-semibold text-navy">Move dates</p>
        <p className="mt-1 text-xs text-muted">
          Grey nights are already held on this room by another guest. This stay’s current nights stay selectable.
        </p>
      </div>
      {loading ? <Skeleton className="h-48 w-full" /> : null}
      {!loading ? (
        <DayPicker
          mode="range"
          selected={{ from: checkIn, to: checkOut }}
          onSelect={(next) => {
            if (!next?.from) return;
            setCheckIn(next.from);
            setCheckOut(next.to || next.from);
            setFault("");
          }}
          disabled={[{ before: today }, ...soldOutDates]}
          modifiers={{ soldOut: soldOutDates }}
          modifiersClassNames={{ soldOut: "opacity-40 line-through" }}
          defaultMonth={checkIn || today}
        />
      ) : null}
      <p className="text-sm text-navy">
        {checkIn && checkOut
          ? `${format(checkIn, "d MMM yyyy")} – ${format(checkOut, "d MMM yyyy")}${nightsCount > 0 ? ` · ${nightsCount} night${nightsCount === 1 ? "" : "s"}` : ""}`
          : "Select a range"}
      </p>
      <InlineError id="move-dates-error">{fault || (blockedStay ? "Those dates include a night already reserved by another guest." : "")}</InlineError>
      <button
        type="submit"
        disabled={busy || loading || blockedStay || nightsCount <= 0 || isBefore(checkOut, checkIn)}
        className="h-11 cursor-pointer rounded-full bg-navy text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "Saving…" : "Move dates"}
      </button>
    </form>
  );
}
