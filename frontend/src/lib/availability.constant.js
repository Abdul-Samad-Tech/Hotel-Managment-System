/** Live inventory: GET /api/v1/rooms/availability?roomType&from&to marks reserved nights sold out. */
export const AVAILABILITY_SOURCE = "api";

export const FLEX_OFFSET_DAYS = 3;

export const FLEX_HINT_LIMIT = 3;

export const AVAILABILITY_COPY = {
  flexible: "Flexible dates ±3 days",
  flexibleHelp: "After you pick dates, see nearby stays of the same length that cost less.",
  soldOut: "Sold out",
  lower: "Lower",
  emptyTitle: "No rates this month",
  emptyText: "Move to another month, or choose a different room type.",
  errorTitle: "Rates could not load",
  errorText: "Try again to see prices for these dates.",
  loading: "Loading rates",
  legend: "Price per night. A gold dot marks the lower nights this month.",
  soldOutStay: "Those nights include a date that is sold out.",
  taxesIncluded: "all taxes included",
  flexCheaperMid: "is",
  flexCheaperTail: "cheaper",
  flexNone: "No cheaper stays within ±3 days.",
  datesTitle: "Choose dates",
  nightsWord: "nights",
  nightWord: "night",
  totalWord: "total",
};
