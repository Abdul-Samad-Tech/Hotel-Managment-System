import { X } from "lucide-react";
import { datesChipLabel } from "../../lib/stay-label";
import { showSearchChip } from "../../lib/sticky-bar";
import { SEARCH_CHIP } from "../../store/search.constant";
import { useSearchStay, useSearchStore } from "../../store/searchStore";
import { useLocation } from "react-router-dom";

export function SearchDatesChip() {
  const { pathname } = useLocation();
  const { checkIn, checkOut, adults } = useSearchStay();
  const reset = useSearchStore((state) => state.reset);
  const label = datesChipLabel(checkIn, checkOut, adults);

  if (!showSearchChip(pathname) || !label) return null;

  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-white/95 py-0 pl-3 text-sm text-navy shadow-[0_8px_24px_rgba(7,27,43,0.08)]">
      <span className="truncate">{label}</span>
      <button
        type="button"
        aria-label={SEARCH_CHIP.clear}
        onClick={() => reset()}
        className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </span>
  );
}
