import { SLIDE_HANDLE_PX, SLIDE_THRESHOLD, SLIDE_TRACK_PAD_PX } from "./slide-reserve.constant";

export function clampSlideProgress(value) {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export function slideTravelPx(trackWidth) {
  const inner = Number(trackWidth) - SLIDE_TRACK_PAD_PX * 2;
  return Math.max(0, inner - SLIDE_HANDLE_PX);
}

export function progressFromOffset(offsetX, travel) {
  if (travel <= 0) return 0;
  return clampSlideProgress(offsetX / travel);
}

export function slideReachedEnd(progress) {
  return progress >= SLIDE_THRESHOLD;
}
