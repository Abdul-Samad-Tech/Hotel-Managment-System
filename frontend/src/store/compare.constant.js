export const COMPARE_STORAGE_KEY = "azure-bay-compare";

export const COMPARE_MAX = 3;

export const COMPARE_STATUS = {
  added: "added",
  removed: "removed",
  exists: "exists",
  full: "full",
  missing: "missing",
  cleared: "cleared",
};

export const COMPARE_COPY = {
  region: "Compare rooms",
  title: "Compare rooms",
  action: "Compare",
  book: "Book",
  remove: "Remove",
  clear: "Clear",
  empty: "Tap Compare on a room, or drag one here.",
  browse: "Browse rooms",
  drop: "Drop here to compare",
  full: "Compare up to 3 rooms.",
  missing: "That room is not on the list.",
  needTwo: "Add another room to compare.",
  dragHandle: "Drag to compare",
  hasAmenity: "Included",
  noAmenity: "Not included",
};

export const COMPARE_DROP = "compare-drop";

/** Display sizes for the compare sheet (not stored on room records). */
export const COMPARE_SIZE_BY_ID = {
  "deluxe-sea-view": "32 m²",
  "premium-ocean-suite": "48 m²",
  "presidential-suite": "85 m²",
  "family-suite": "56 m²",
};

export const COMPARE_FALLBACK_VIEW = "Resort view";
export const COMPARE_FALLBACK_SIZE = "—";
