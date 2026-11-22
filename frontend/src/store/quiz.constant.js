export const QUIZ_STORAGE_KEY = "azure-bay-quiz";

export const QUIZ_EVENT = "azure-bay-open-quiz";

export const QUIZ_TOTAL = 3;

export const QUIZ_RESULT_STEP = 3;

export const QUIZ_WIDE = "(min-width: 1024px)";

export const QUIZ_SCORE = {
  travellerExact: 4,
  travellerNear: 2,
  priority: 5,
  budgetExact: 4,
  budgetNear: 2,
  budgetStretch: 1,
};

export const QUIZ_COPY = {
  title: "Find My Perfect Room",
  entry: "Find My Perfect Room",
  progress: "Question {n} of {total}",
  next: "Next",
  back: "Back",
  seeRoom: "See matches",
  viewRoom: "View Room",
  retake: "Retake",
  book: "Book",
  again: "Start again",
  browse: "Browse all rooms",
  emptyTitle: "No room matches that mix.",
  emptyText: "Browse the list, or start the questions again.",
  resultLead: "Your best match",
  alternativeLead: "Also consider",
  stayTotal: "for your saved dates",
  perNight: "/ night",
  cmdk: "Find My Perfect Room",
  cmdkHint: "Answer 3 questions for a room match",
};

export const QUIZ_BUDGET = {
  value: { max: 150 },
  mid: { max: 250 },
  suite: { max: 9999 },
};

export const QUIZ_STEPS = [
  {
    id: "traveller",
    question: "Who is travelling?",
    options: [
      { value: "couple", label: "Couple", icon: "heart" },
      { value: "family", label: "Family", icon: "users" },
      { value: "friends", label: "Friends", icon: "users-round" },
      { value: "solo", label: "Solo", icon: "user" },
    ],
  },
  {
    id: "priority",
    question: "What matters most?",
    options: [
      { value: "sea", label: "Sea view", icon: "waves" },
      { value: "space", label: "Space", icon: "maximize" },
      { value: "privacy", label: "Privacy", icon: "lock" },
      { value: "budget", label: "Budget", icon: "wallet" },
    ],
  },
  {
    id: "budget",
    question: "Budget per night",
    options: [
      { value: "value", label: "Under $150", icon: "wallet" },
      { value: "mid", label: "$150 – $250", icon: "coins" },
      { value: "suite", label: "$250+", icon: "gem" },
    ],
  },
];
