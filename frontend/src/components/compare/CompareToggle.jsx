import { COMPARE_COPY, COMPARE_MAX } from "../../store/compare.constant";
import { useCompareIds } from "../../store/compare.store";
import { toggleCompare } from "./compare-actions";

export function CompareToggle({
  roomId,
  className = "mt-2 inline-flex min-h-11 scroll-mb-32 cursor-pointer items-center gap-2 text-sm text-navy focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-gold",
}) {
  const ids = useCompareIds();
  const checked = ids.includes(roomId);
  const full = ids.length >= COMPARE_MAX && !checked;

  return (
    <label className={className} title={full ? COMPARE_COPY.full : undefined}>
      <input
        type="checkbox"
        className="h-4 w-4 accent-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        checked={checked}
        disabled={full}
        onChange={() => toggleCompare(roomId)}
      />
      {COMPARE_COPY.action}
    </label>
  );
}
