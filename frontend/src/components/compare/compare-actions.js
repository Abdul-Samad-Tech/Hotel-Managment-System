import { confirmHaptic } from "../../lib/haptics";
import { COMPARE_COPY, COMPARE_STATUS } from "../../store/compare.constant";
import { useCompareStore } from "../../store/compare.store";
import { notify } from "../ui/BayToaster";

export function applyCompareResult(result) {
  if (result.status === COMPARE_STATUS.added) confirmHaptic();
  if (result.status === COMPARE_STATUS.full) notify(COMPARE_COPY.full);
  if (result.status === COMPARE_STATUS.missing) notify(COMPARE_COPY.missing);
  return result;
}

export function addToCompare(id) {
  return applyCompareResult(useCompareStore.getState().add(id));
}

export function toggleCompare(id) {
  return applyCompareResult(useCompareStore.getState().toggle(id));
}

export function removeFromCompare(id) {
  return applyCompareResult(useCompareStore.getState().remove(id));
}

export function clearCompare() {
  return applyCompareResult(useCompareStore.getState().clear());
}
