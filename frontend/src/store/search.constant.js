export const SEARCH_STORAGE_KEY = "azure-bay-search";

export const GUEST_LIMITS = {
  adults: { min: 1, max: 6 },
  children: { min: 0, max: 4 },
};

export const PARTY_MAX = GUEST_LIMITS.adults.max + GUEST_LIMITS.children.max;

export const RANGE_ERROR = "Check-out is later than check-in.";

export const SEARCH_CHIP = {
  lead: "Your dates:",
  clear: "Clear dates",
};
