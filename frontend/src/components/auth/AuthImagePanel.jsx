import { motion, useReducedMotion } from "framer-motion";
import { duration, easeFlow } from "../../lib/motion";
import { Logo } from "../ui/Brand";
import { ScriptBadge } from "../ui/ScriptBadge";

const copy = {
  signin: {
    eyebrow: "Welcome Back",
    lead: "Your",
    accent: "Ocean Escape",
    end: "Awaits",
    text: "Sign in to manage your bookings and exclusive offers.",
  },
  signup: {
    eyebrow: "Join Us",
    lead: "Start Your",
    accent: "Unforgettable",
    end: "Journey",
    text: "Create an account to book faster and enjoy member-only perks.",
  },
};

export function AuthImagePanel({ mode, variant = "overlay", side = "left" }) {
  const reduce = useReducedMotion();
  const banner = variant === "banner";
  const endAligned = !banner && side === "right";

  return (
    <div className="relative h-full overflow-hidden bg-navy">
      <motion.img
        key={mode}
        src="/auth/auth-bg.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-[58%_42%]"
        initial={reduce ? false : { scale: 1.05 }}
        animate={{ scale: 1 }}
        transition={{ duration: reduce ? 0 : 0.7, ease: [0.77, 0, 0.175, 1] }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-navy/75 via-navy/20 to-navy/25" />
      {banner && (
        <div className="absolute top-4 left-5 z-10">
          <Logo compact />
        </div>
      )}
      <motion.div
        className={`flex h-full flex-col ${banner ? "relative justify-end p-6" : "absolute inset-y-0 w-[30%] justify-between p-8 xl:p-12"}`}
        initial={false}
        animate={banner ? undefined : { left: endAligned ? "66%" : "0%" }}
        transition={{ duration: reduce ? 0 : 0.7, ease: [0.77, 0, 0.175, 1] }}
      >
        {!banner && <Logo />}
        <div className={`relative ${banner ? "" : "max-w-xs"}`}>
          {Object.entries(copy).map(([key, item]) => {
            const active = key === mode;
            return (
              <motion.div
                key={key}
                aria-hidden={active ? undefined : true}
                className={active ? "relative" : "pointer-events-none absolute inset-0"}
                initial={false}
                animate={{ opacity: active ? 1 : 0 }}
                transition={{ duration: reduce ? duration.micro : duration.ui, ease: easeFlow }}
              >
                <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-gold">{item.eyebrow}</p>
                <h2 className={`mt-3 font-display font-medium leading-[1.05] text-white ${banner ? "text-3xl" : "text-4xl"}`}>
                  <span className={banner ? "" : "block"}>
                    {item.lead} <span className="text-gold italic">{item.accent}</span>
                  </span>
                  {banner ? ` ${item.end}` : <span className="block">{item.end}</span>}
                </h2>
                {!banner && <p className="mt-4 max-w-sm text-sm leading-6 text-white/80">{item.text}</p>}
              </motion.div>
            );
          })}
          {!banner && <ScriptBadge className="mt-8 origin-left -rotate-2 scale-90 text-left" />}
          <div className="mt-6 flex items-center gap-2" aria-hidden="true">
            <span className={`h-1.5 rounded-full ${mode === "signin" ? "w-7 bg-gold" : "w-1.5 bg-white/55"}`} />
            <span className={`h-1.5 rounded-full ${mode === "signup" ? "w-7 bg-gold" : "w-1.5 bg-white/55"}`} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
