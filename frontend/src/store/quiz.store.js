import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { isKnownRoomId } from "../lib/compare";
import { emptyQuizAnswers, isQuizValue, matchRooms, sanitizeQuizAnswers } from "../lib/roomMatcher";
import { QUIZ_RESULT_STEP, QUIZ_STORAGE_KEY } from "./quiz.constant";
import { createSafeStorage } from "./search.storage";

function clampStep(step) {
  const next = Number.parseInt(String(step), 10);
  if (!Number.isFinite(next)) return 0;
  return Math.min(QUIZ_RESULT_STEP, Math.max(0, next));
}

function sanitizeQuizState(input) {
  const source = input && typeof input === "object" ? input : {};
  const answers = sanitizeQuizAnswers(source.answers);
  const resultId = typeof source.resultId === "string" && isKnownRoomId(source.resultId) ? source.resultId : "";
  const altId = typeof source.altId === "string" && isKnownRoomId(source.altId) ? source.altId : "";
  return {
    answers,
    resultId,
    altId: altId === resultId ? "" : altId,
    step: clampStep(source.step),
  };
}

function readPersistedQuiz() {
  try {
    if (typeof window === "undefined") return sanitizeQuizState({});
    const raw = window.localStorage.getItem(QUIZ_STORAGE_KEY);
    if (!raw) return sanitizeQuizState({});
    const parsed = JSON.parse(raw);
    const slice = parsed?.state && typeof parsed.state === "object" ? parsed.state : parsed;
    return sanitizeQuizState(slice);
  } catch {
    return sanitizeQuizState({});
  }
}

const initialQuiz = readPersistedQuiz();

export const useQuizStore = create(
  persist(
    (set, get) => ({
      ...initialQuiz,
      open: false,
      setOpen(open) {
        set({ open: open === true });
      },
      setAnswer(key, value) {
        if (!isQuizValue(key, value)) return;
        set((state) => ({
          answers: { ...state.answers, [key]: value },
          resultId: "",
          altId: "",
        }));
      },
      setStep(step) {
        set({ step: clampStep(step) });
      },
      complete() {
        const match = matchRooms(get().answers);
        set({
          resultId: match.best?.id ?? "",
          altId: match.alternative?.id ?? "",
          step: QUIZ_RESULT_STEP,
        });
      },
      reset() {
        set({ answers: emptyQuizAnswers(), resultId: "", altId: "", step: 0 });
      },
    }),
    {
      name: QUIZ_STORAGE_KEY,
      storage: createJSONStorage(() => createSafeStorage()),
      partialize: (state) => ({
        answers: state.answers,
        resultId: state.resultId,
        altId: state.altId,
        step: state.step,
      }),
      merge: (persisted, current) => ({
        ...current,
        ...sanitizeQuizState(persisted),
      }),
    },
  ),
);
