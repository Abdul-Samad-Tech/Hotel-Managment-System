import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useReducedMotion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { requireSignedIn } from "../../lib/auth-gate";
import { shouldHideBookNow } from "../../lib/sticky-bar";

const cookieKey = "azure-bay-cookie";

export function CookieCard() {
  const [choice, setChoice] = useState(() => window.localStorage.getItem(cookieKey));
  if (choice) return null;

  function choose(value) {
    window.localStorage.setItem(cookieKey, value);
    setChoice(value);
  }

  return (
    <aside
      className="fixed bottom-24 left-4 z-40 w-[min(18rem,calc(100%-2rem))] rounded-2xl bg-white p-4 text-navy shadow-[0_16px_40px_rgba(7,27,43,0.16)] lg:bottom-4"
    >
      <p className="text-sm leading-6">This browser can remember your currency choice. Nothing else is stored.</p>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => choose("accepted")} className="inline-flex h-11 cursor-pointer items-center rounded-full bg-gold px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy">
          Accept
        </button>
        <button type="button" onClick={() => choose("dismissed")} className="inline-flex h-11 cursor-pointer items-center rounded-full px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-gold">
          Not now
        </button>
      </div>
    </aside>
  );
}

export function BookNowBar({ pastHero = false }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  if (shouldHideBookNow(pathname, pastHero)) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-navy/10 bg-cream px-4 py-3 lg:hidden">
      <button
        type="button"
        onClick={() => {
          if (!requireSignedIn(user, navigate, {
            returnTo: "/booking",
            message: "Sign in to book your stay.",
          })) {
            return;
          }
          navigate("/booking");
        }}
        className="flex h-11 w-full cursor-pointer items-center justify-center rounded-full bg-gold text-sm font-semibold text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
      >
        Book Now
      </button>
    </div>
  );
}

export function BackToTop() {
  const reduce = useReducedMotion();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" })}
      className="fixed right-4 bottom-24 z-30 grid h-11 w-11 place-items-center rounded-full bg-navy text-white shadow-[0_12px_28px_rgba(7,27,43,0.28)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold lg:bottom-6"
    >
      <ArrowUp className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
