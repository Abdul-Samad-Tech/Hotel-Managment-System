import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthImagePanel } from "../components/auth/AuthImagePanel";
import { SignInForm } from "../components/auth/SignInForm";
import { SignUpForm } from "../components/auth/SignUpForm";
import { Logo } from "../components/ui/Brand";
import { notify } from "../components/ui/BayToaster";
import { takeAuthNote, takeReturnPath } from "../lib/auth-gate";

const ease = [0.77, 0, 0.175, 1];

function useMinWidth(width) {
  const query = `(min-width: ${width}px)`;
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setMatches(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

export function AuthPage() {
  const reduce = useReducedMotion();
  const desktop = useMinWidth(1024);
  const tablet = useMinWidth(768);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const mode = pathname === "/register" ? "signup" : "signin";

  useEffect(() => {
    const note = takeAuthNote();
    if (note) notify(note);
  }, []);

  function onSignedIn(path, message) {
    notify(message);
    const returnTo = takeReturnPath(path);
    window.setTimeout(() => navigate(returnTo || path), 700);
  }

  const slide = reduce ? { duration: 0 } : { duration: 0.7, ease };
  const imageOnLeft = mode === "signin";
  const leftClip = "polygon(0% 0%, 70% 0%, 50% 100%, 0% 100%)";
  const rightClip = "polygon(30% 0%, 100% 0%, 100% 100%, 50% 100%)";

  return (
    <main className={desktop ? "relative h-svh overflow-hidden bg-cream" : "min-h-svh bg-cream"}>
      {desktop ? (
        <>
          <motion.div
            className="absolute inset-0 z-0"
            initial={false}
            animate={{ clipPath: imageOnLeft ? leftClip : rightClip }}
            transition={slide}
          >
            <AuthImagePanel mode={mode} side={imageOnLeft ? "left" : "right"} />
          </motion.div>
          <motion.div
            className="absolute inset-y-0 left-0 z-20 flex w-[min(420px,38vw)] items-center"
            initial={false}
            animate={{ x: imageOnLeft ? "56vw" : "12vw" }}
            transition={slide}
          >
            <FormCard tone={imageOnLeft ? "right" : "left"}>
              <FormStage mode={mode} onNotice={notify} onSignedIn={onSignedIn} />
            </FormCard>
          </motion.div>
        </>
      ) : (
        <div className="flex min-h-svh flex-col items-center px-4 py-8">
          {tablet ? (
            <div className="mb-6 h-56 w-full overflow-hidden rounded-[28px]">
              <AuthImagePanel mode={mode} variant="banner" />
            </div>
          ) : (
            <div className="mb-6 self-start">
              <Logo compact tone="dark" />
            </div>
          )}
          <FormCard>
            <FormStage mode={mode} onNotice={notify} onSignedIn={onSignedIn} />
          </FormCard>
        </div>
      )}

    </main>
  );
}

function FormCard({ children, tone = "right" }) {
  const wash =
    tone === "right"
      ? "linear-gradient(148deg, rgba(255,255,255,0.58) 0%, rgba(255,255,255,0.74) 18%, rgba(255,255,255,0.9) 42%, rgba(255,255,255,0.97) 100%)"
      : "linear-gradient(212deg, rgba(255,255,255,0.58) 0%, rgba(255,255,255,0.74) 18%, rgba(255,255,255,0.9) 42%, rgba(255,255,255,0.97) 100%)";

  return (
    <div
      className="w-full rounded-[28px] px-6 py-5 shadow-[0_24px_60px_rgba(11,31,51,0.12)] sm:px-7"
      style={{ background: wash }}
    >
      {children}
    </div>
  );
}

function FormStage({ mode, onNotice, onSignedIn }) {
  return (
    <div>
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
        >
          {mode === "signin" ? (
            <SignInForm onNotice={onNotice} onSignedIn={onSignedIn} />
          ) : (
            <SignUpForm onNotice={onNotice} onSignedIn={onSignedIn} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
