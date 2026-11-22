import { guestCount, rooms } from "../data/rooms";
import { QUIZ_BUDGET, QUIZ_SCORE, QUIZ_STEPS } from "../store/quiz.constant";

export function emptyQuizAnswers() {
  return { traveller: "", priority: "", budget: "" };
}

export function isQuizValue(key, value) {
  const step = QUIZ_STEPS.find((item) => item.id === key);
  if (!step) return false;
  return step.options.some((option) => option.value === value);
}

export function sanitizeQuizAnswers(input) {
  const source = input && typeof input === "object" ? input : {};
  const next = emptyQuizAnswers();
  if (isQuizValue("traveller", source.traveller)) next.traveller = source.traveller;
  if (isQuizValue("priority", source.priority)) next.priority = source.priority;
  if (isQuizValue("budget", source.budget)) next.budget = source.budget;
  return next;
}

export function quizAnswersComplete(answers) {
  return Boolean(answers.traveller && answers.priority && answers.budget);
}

export function budgetMaxFor(budget) {
  return QUIZ_BUDGET[budget]?.max ?? null;
}

function hasAmenity(room, token) {
  return room.amenities.some((item) => item.toLowerCase().includes(token.toLowerCase()));
}

function hasSeaView(room) {
  return hasAmenity(room, "sea view") || hasAmenity(room, "sea doors") || hasAmenity(room, "ocean window");
}

function isSpacious(room) {
  return guestCount(room) >= 4 || hasAmenity(room, "sitting room") || hasAmenity(room, "terrace");
}

function isPrivate(room) {
  return (
    room.id === "presidential-suite" ||
    hasAmenity(room, "terrace") ||
    hasAmenity(room, "sitting room") ||
    hasAmenity(room, "marble")
  );
}

function scoreTraveller(room, traveller) {
  const guests = guestCount(room);
  if (traveller === "solo") {
    if (guests === 2) return QUIZ_SCORE.travellerExact;
    return 0;
  }
  if (traveller === "couple") {
    if (guests === 2) return QUIZ_SCORE.travellerExact;
    if (guests === 4) return QUIZ_SCORE.travellerNear;
    return 0;
  }
  if (traveller === "friends") {
    if (guests === 4) return QUIZ_SCORE.travellerExact;
    if (guests === 6) return QUIZ_SCORE.travellerNear;
    return 0;
  }
  if (traveller === "family") {
    if (guests === 6) return QUIZ_SCORE.travellerExact;
    if (guests === 4) return QUIZ_SCORE.travellerNear;
    return 0;
  }
  return 0;
}

function scorePriority(room, priority) {
  if (priority === "sea" && hasSeaView(room)) return QUIZ_SCORE.priority;
  if (priority === "space" && isSpacious(room)) return QUIZ_SCORE.priority;
  if (priority === "privacy" && isPrivate(room)) return QUIZ_SCORE.priority;
  if (priority === "budget") {
    const cheapest = Math.min(...rooms.map((item) => item.price));
    if (room.price === cheapest) return QUIZ_SCORE.priority;
    if (room.price <= cheapest + 100) return QUIZ_SCORE.travellerNear;
  }
  return 0;
}

function scoreBudget(room, budget) {
  const max = budgetMaxFor(budget);
  if (max == null) return 0;
  if (budget === "suite") {
    if (room.price >= 250) return QUIZ_SCORE.budgetExact;
    if (room.price >= 200) return QUIZ_SCORE.budgetNear;
    return 0;
  }
  if (room.price <= max) {
    const headroom = max - room.price;
    if (headroom <= 40) return QUIZ_SCORE.budgetExact;
    if (headroom <= 120) return QUIZ_SCORE.budgetNear;
    return QUIZ_SCORE.budgetStretch;
  }
  return 0;
}

export function scoreRoom(room, answers) {
  if (!room || !answers) return 0;
  return (
    scoreTraveller(room, answers.traveller) +
    scorePriority(room, answers.priority) +
    scoreBudget(room, answers.budget)
  );
}

export function whyThisRoom(room, answers) {
  if (!room || !quizAnswersComplete(answers)) return "";
  const parts = [];
  const guests = guestCount(room);

  if (answers.traveller === "solo" && guests === 2) parts.push("a calm fit for one");
  if (answers.traveller === "couple" && guests === 2) parts.push("scaled for two");
  if (answers.traveller === "friends" && guests >= 4) parts.push("room for a small group");
  if (answers.traveller === "family" && guests >= 4) parts.push("space for a family stay");

  if (answers.priority === "sea" && hasSeaView(room)) parts.push("a strong sea outlook");
  if (answers.priority === "space" && isSpacious(room)) parts.push("extra floor space");
  if (answers.priority === "privacy" && isPrivate(room)) parts.push("more privacy");
  if (answers.priority === "budget") parts.push("a kinder nightly rate");

  if (answers.budget === "value" && room.price <= 150) parts.push("staying under $150");
  if (answers.budget === "mid" && room.price <= 250) parts.push("landing in your mid range");
  if (answers.budget === "suite" && room.price >= 250) parts.push("matching a suite budget");

  if (parts.length === 0) return room.summary;
  if (parts.length === 1) return `Chosen for ${parts[0]}.`;
  const last = parts[parts.length - 1];
  const lead = parts.slice(0, -1).join(", ");
  return `Chosen for ${lead}, and ${last}.`;
}

/**
 * Rank rooms by quiz answers. Pure and unit-testable.
 * @returns {{ best: object | null, alternative: object | null, bestWhy: string, alternativeWhy: string }}
 */
export function matchRooms(answers, catalog = rooms) {
  if (!quizAnswersComplete(answers)) {
    return { best: null, alternative: null, bestWhy: "", alternativeWhy: "" };
  }

  const ranked = catalog
    .map((room) => ({ room, score: scoreRoom(room, answers) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.room.price - b.room.price;
    });

  const best = ranked[0]?.room ?? null;
  const alternative = ranked[1]?.room ?? null;

  return {
    best,
    alternative,
    bestWhy: best ? whyThisRoom(best, answers) : "",
    alternativeWhy: alternative ? whyThisRoom(alternative, answers) : "",
  };
}

/** @deprecated Prefer matchRooms; kept for store/legacy callers */
export function findQuizRoom(answers) {
  return matchRooms(answers).best;
}
