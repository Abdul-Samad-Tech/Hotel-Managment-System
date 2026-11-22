import { QUIZ_COPY, QUIZ_EVENT } from "../../store/quiz.constant";
import { useQuizStore } from "../../store/quiz.store";

const styles = {
  toolbar:
    "inline-flex h-11 cursor-pointer items-center rounded-full border border-navy/15 bg-white px-4 text-sm font-semibold text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
  text: "inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-navy underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
};

export function QuizEntry({ tone = "toolbar", className = "" }) {
  const setOpen = useQuizStore((state) => state.setOpen);

  return (
    <button
      type="button"
      className={`${styles[tone] ?? styles.toolbar} ${className}`}
      onClick={() => {
        setOpen(true);
        window.dispatchEvent(new CustomEvent(QUIZ_EVENT));
      }}
    >
      {QUIZ_COPY.entry}
    </button>
  );
}
