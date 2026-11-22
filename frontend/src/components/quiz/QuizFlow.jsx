import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Coins, Gem, Heart, Lock, Maximize2, User, Users, UsersRound, Wallet, Waves } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { isKnownRoomId, roomById } from "../../lib/compare";
import { duration, easeFlow } from "../../lib/motion";
import { getTotal } from "../../lib/pricing";
import { whyThisRoom } from "../../lib/roomMatcher";
import { QUIZ_COPY, QUIZ_RESULT_STEP, QUIZ_STEPS, QUIZ_TOTAL } from "../../store/quiz.constant";
import { useQuizStore } from "../../store/quiz.store";
import { useSearchStay } from "../../store/searchStore";
import { PillButton } from "../ui/Buttons";
import { EmptyState } from "../ui/EmptyState";
import { Price } from "../ui/Price";
import { SmartImage } from "../ui/SmartImage";

const OPTION_ICONS = {
  heart: Heart,
  users: Users,
  "users-round": UsersRound,
  user: User,
  waves: Waves,
  maximize: Maximize2,
  lock: Lock,
  wallet: Wallet,
  coins: Coins,
  gem: Gem,
};

export function QuizFlow() {
  const reduce = useReducedMotion();
  const step = useQuizStore((state) => state.step);
  const answers = useQuizStore((state) => state.answers);
  const resultId = useQuizStore((state) => state.resultId);
  const altId = useQuizStore((state) => state.altId);
  const open = useQuizStore((state) => state.open);
  const previous = useRef(step);
  const direction = step >= previous.current ? 1 : -1;
  previous.current = step;
  const current = QUIZ_STEPS[step];
  const slide = {
    duration: reduce ? 0 : duration.ui,
    ease: easeFlow,
  };

  useEffect(() => {
    if (!open || !current) return undefined;
    const selected = answers[current.id];
    const value = selected || current.options[0]?.value;
    const node = document.getElementById(`quiz-opt-${current.id}-${value}`);
    node?.focus();
    return undefined;
  }, [answers, current, open, step]);

  if (step >= QUIZ_RESULT_STEP) {
    return (
      <motion.div
        key="quiz-result"
        initial={reduce ? { opacity: 0 } : { opacity: 0, x: 28 }}
        animate={{ opacity: 1, x: 0 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, x: -28 }}
        transition={slide}
      >
        <QuizResult resultId={resultId} altId={altId} />
      </motion.div>
    );
  }

  if (!current) return null;

  const chosen = answers[current.id];
  const progress = QUIZ_COPY.progress.replace("{n}", String(step + 1)).replace("{total}", String(QUIZ_TOTAL));
  const progressPct = ((step + 1) / QUIZ_TOTAL) * 100;

  return (
    <div>
      <QuizProgress label={progress} percent={progressPct} reduce={reduce} />
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={current.id}
          custom={direction}
          initial={reduce ? { opacity: 0 } : { opacity: 0, x: direction * 36 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, x: direction * -36 }}
          transition={slide}
        >
          <h3 id="quiz-question" className="mt-3 font-display text-2xl text-navy">
            {current.question}
          </h3>
          <div
            role="radiogroup"
            aria-labelledby="quiz-question"
            className="mt-4 grid gap-2 sm:grid-cols-2"
            onKeyDown={(event) => {
              if (event.key !== "ArrowDown" && event.key !== "ArrowUp" && event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
                return;
              }
              event.preventDefault();
              const index = current.options.findIndex((option) => option.value === chosen);
              const start = index < 0 ? 0 : index;
              const delta = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : -1;
              const next = current.options[(start + delta + current.options.length) % current.options.length];
              useQuizStore.getState().setAnswer(current.id, next.value);
            }}
          >
            {current.options.map((option) => (
              <QuizOption
                key={option.value}
                stepId={current.id}
                option={option}
                checked={chosen === option.value}
              />
            ))}
          </div>
          <QuizNav step={step} ready={Boolean(chosen)} last={step === QUIZ_TOTAL - 1} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function QuizProgress({ label, percent, reduce }) {
  return (
    <div>
      <p className="text-xs tracking-[0.16em] text-muted uppercase">{label}</p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-navy/10" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percent)} aria-label={label}>
        <motion.div
          className="h-full rounded-full bg-gold"
          initial={false}
          animate={{ width: `${percent}%` }}
          transition={{ duration: reduce ? 0 : duration.ui, ease: easeFlow }}
        />
      </div>
    </div>
  );
}

function QuizOption({ stepId, option, checked }) {
  const setAnswer = useQuizStore((state) => state.setAnswer);
  const Icon = OPTION_ICONS[option.icon] ?? Wallet;

  return (
    <button
      type="button"
      role="radio"
      id={`quiz-opt-${stepId}-${option.value}`}
      aria-checked={checked}
      onClick={() => setAnswer(stepId, option.value)}
      className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl px-4 text-left text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
        checked ? "bg-navy text-white" : "bg-cream text-navy hover:bg-gold/30"
      }`}
    >
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${checked ? "bg-white/15" : "bg-white"}`}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      {option.label}
    </button>
  );
}

function QuizNav({ step, ready, last }) {
  const setStep = useQuizStore((state) => state.setStep);
  const complete = useQuizStore((state) => state.complete);

  return (
    <div className="mt-5 flex items-center justify-between gap-3">
      <button
        type="button"
        disabled={step === 0}
        onClick={() => setStep(step - 1)}
        className="inline-flex h-11 cursor-pointer items-center px-2 text-sm font-semibold text-navy underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-40"
      >
        {QUIZ_COPY.back}
      </button>
      <button
        type="button"
        disabled={!ready}
        onClick={() => (last ? complete() : setStep(step + 1))}
        className="inline-flex h-11 cursor-pointer items-center rounded-full bg-gold px-5 text-sm font-semibold text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-40"
      >
        {last ? QUIZ_COPY.seeRoom : QUIZ_COPY.next}
      </button>
    </div>
  );
}

function QuizResult({ resultId, altId }) {
  const reset = useQuizStore((state) => state.reset);
  const setOpen = useQuizStore((state) => state.setOpen);
  const answers = useQuizStore((state) => state.answers);
  const { checkIn, checkOut } = useSearchStay();
  const best = isKnownRoomId(resultId) ? roomById(resultId) : null;
  const alternative = isKnownRoomId(altId) ? roomById(altId) : null;

  if (!best) {
    return (
      <EmptyState title={QUIZ_COPY.emptyTitle} text={QUIZ_COPY.emptyText}>
        <div className="flex flex-wrap justify-center gap-3">
          <PillButton href="/rooms" onClick={() => setOpen(false)}>
            {QUIZ_COPY.browse}
          </PillButton>
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-11 cursor-pointer items-center text-sm font-semibold text-navy underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            {QUIZ_COPY.retake}
          </button>
        </div>
      </EmptyState>
    );
  }

  return (
    <div className="space-y-6">
      <QuizMatchCard
        lead={QUIZ_COPY.resultLead}
        room={best}
        why={whyThisRoom(best, answers)}
        checkIn={checkIn}
        checkOut={checkOut}
        onClose={() => setOpen(false)}
      />
      {alternative ? (
        <QuizMatchCard
          lead={QUIZ_COPY.alternativeLead}
          room={alternative}
          why={whyThisRoom(alternative, answers)}
          checkIn={checkIn}
          checkOut={checkOut}
          onClose={() => setOpen(false)}
          compact
        />
      ) : null}
      <button
        type="button"
        onClick={reset}
        className="inline-flex h-11 cursor-pointer items-center text-sm font-semibold text-navy underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
      >
        {QUIZ_COPY.retake}
      </button>
      <p>
        <Link
          to="/rooms"
          onClick={() => setOpen(false)}
          className="text-sm font-semibold text-navy underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          {QUIZ_COPY.browse}
        </Link>
      </p>
    </div>
  );
}

function QuizMatchCard({ lead, room, why, checkIn, checkOut, onClose, compact = false }) {
  const quote = getTotal(room, checkIn, checkOut);

  return (
    <article>
      <p className="text-xs tracking-[0.16em] text-muted uppercase">{lead}</p>
      <SmartImage
        src={room.image}
        alt=""
        width={640}
        height={compact ? 384 : 480}
        className={`mt-3 w-full rounded-2xl ${compact ? "aspect-[5/3]" : "aspect-[4/3]"}`}
      />
      <h3 className={`mt-3 font-display text-navy ${compact ? "text-xl" : "text-2xl"}`}>{room.name}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{why}</p>
      <p className="mt-3 text-sm font-semibold text-navy">
        {quote ? (
          <>
            <Price value={quote.total} />{" "}
            <span className="font-normal text-muted">
              {QUIZ_COPY.stayTotal} ({quote.nights} night{quote.nights === 1 ? "" : "s"})
            </span>
          </>
        ) : (
          <>
            <Price value={room.price} /> <span className="font-normal text-muted">{QUIZ_COPY.perNight}</span>
          </>
        )}
      </p>
      <div className="mt-4">
        <PillButton href={`/rooms/${room.id}`} onClick={onClose}>
          {QUIZ_COPY.viewRoom}
        </PillButton>
      </div>
    </article>
  );
}
