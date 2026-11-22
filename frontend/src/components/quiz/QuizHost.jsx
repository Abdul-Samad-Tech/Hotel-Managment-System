import { useEffect } from "react";
import { useMediaQuery } from "../../lib/media";
import { QUIZ_COPY, QUIZ_EVENT, QUIZ_WIDE } from "../../store/quiz.constant";
import { useQuizStore } from "../../store/quiz.store";
import { Dialog } from "../ui/Dialog";
import { Drawer } from "../ui/Drawer";
import { QuizFlow } from "./QuizFlow";

export function QuizHost() {
  const open = useQuizStore((state) => state.open);
  const setOpen = useQuizStore((state) => state.setOpen);
  const wide = useMediaQuery(QUIZ_WIDE);

  useEffect(() => {
    const openQuiz = () => setOpen(true);
    window.addEventListener(QUIZ_EVENT, openQuiz);
    return () => window.removeEventListener(QUIZ_EVENT, openQuiz);
  }, [setOpen]);

  const body = (
    <div className="max-h-[min(70vh,36rem)] overflow-y-auto pr-1">
      <QuizFlow />
    </div>
  );

  if (wide) {
    return (
      <Dialog open={open} onOpenChange={setOpen} title={QUIZ_COPY.title} wide>
        {body}
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen} title={QUIZ_COPY.title}>
      {body}
    </Drawer>
  );
}
