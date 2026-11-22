/** Calm-ocean motion. Reuse these tokens; do not invent durations in components. */

export const easeTide = [0.22, 1, 0.36, 1];
export const easeFlow = [0.65, 0, 0.35, 1];

export const duration = {
  micro: 0.2,
  ui: 0.48,
  reveal: 0.9,
  ken: 14,
  breath: 3,
  wipe: 0.35,
};

export const springSoft = {
  type: "spring",
  stiffness: 150,
  damping: 22,
};

export const viewportOnce = { once: true, amount: 0.3 };

/** Irregular offsets so staggers do not feel evenly machined. */
export const tideDelays = [0, 0.07, 0.15, 0.22, 0.31, 0.4];

export function tideDelay(index) {
  return tideDelays[index] ?? 0.4 + (index - tideDelays.length) * 0.08;
}

/** Testimonials stars fill one after another. */
export const starStep = 0.06;
