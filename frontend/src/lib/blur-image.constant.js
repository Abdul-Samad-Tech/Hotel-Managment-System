export const IMAGE_STATUS = {
  loading: "loading",
  ready: "ready",
  error: "error",
};

export const IMAGE_COPY = {
  fault: "Photo could not load.",
  retry: "Try again",
};

/** Default cream placeholder when no dominant color is known. */
export const IMAGE_PLACEHOLDER = "#efe8dc";

/** Soft resort tones for deterministic dominant-color placeholders. */
export const IMAGE_DOMINANT_TONES = [
  "#efe8dc",
  "#e7dfd2",
  "#d9cfc0",
  "#c9bba8",
  "#b7c4c8",
  "#9eb0b8",
];
