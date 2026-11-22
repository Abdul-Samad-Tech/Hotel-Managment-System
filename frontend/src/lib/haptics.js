import { HAPTIC_MS } from "./haptics.constant";
import { REDUCE_MOTION_QUERY } from "./media.constant";

export function motionIsReduced() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia(REDUCE_MOTION_QUERY).matches;
}

export function canVibrate() {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}

export function safeVibrate(durationMs) {
  if (!canVibrate() || motionIsReduced()) return false;
  try {
    return navigator.vibrate(durationMs) === true;
  } catch {
    return false;
  }
}

export function confirmHaptic() {
  safeVibrate(HAPTIC_MS);
}
