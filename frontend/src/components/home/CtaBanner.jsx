import { ArrowRight, Play } from "lucide-react";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ctaCopy } from "../../data/site";
import { duration, easeFlow, easeTide, tideDelay, viewportOnce } from "../../lib/motion";
import { RevealText } from "../motion/RevealText";
import { Eyebrow, PillButton } from "../ui/Buttons";
import { ScriptBadge } from "../ui/ScriptBadge";

export function CtaBanner({ onPlay }) {
  const reduce = useReducedMotion();
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-4%", "4%"]);

  return (
    <section ref={sectionRef} className="relative min-h-[280px] overflow-hidden bg-navy">
      <motion.img
        src={ctaCopy.image}
        alt="Sunset over the ocean at Azure Bay"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ y, scale: reduce ? 1 : 1.08 }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,22,36,0.78)_0%,rgba(7,22,36,0.35)_58%,rgba(7,22,36,0.2)_100%)]" />
      <div className="page-wrap relative flex min-h-[280px] flex-col items-start justify-center gap-8 py-12 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl">
          <motion.div
            initial={reduce ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={viewportOnce}
            transition={{ duration: reduce ? duration.micro : duration.ui, ease: easeTide }}
          >
            <Eyebrow>{ctaCopy.eyebrow}</Eyebrow>
          </motion.div>
          <RevealText
            inView
            className="mt-3 font-display text-4xl leading-tight font-medium text-white sm:text-[2.7rem]"
            lines={[
              <>
                {ctaCopy.titleLead} <span className="text-gold italic">{ctaCopy.titleAccent}</span>
              </>,
            ]}
          />
          <motion.p
            className="mt-3 max-w-md text-sm leading-7 text-white/80"
            initial={reduce ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={viewportOnce}
            transition={{ duration: reduce ? duration.micro : duration.ui, delay: reduce ? 0 : tideDelay(1), ease: easeTide }}
          >
            {ctaCopy.text}
          </motion.p>
          <motion.div
            className="mt-6"
            initial={reduce ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={viewportOnce}
            transition={{ duration: reduce ? duration.micro : duration.ui, delay: reduce ? 0 : tideDelay(2), ease: easeTide }}
          >
            <span className="group relative inline-flex">
              <PillButton href="/booking" roll>
                Check Availability
                <ArrowRight className="h-4 w-4" />
              </PillButton>
              {!reduce && (
                <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
                  <span className="absolute inset-y-0 left-0 w-1/3 -translate-x-full bg-gradient-to-r from-transparent via-white/55 to-transparent transition-transform duration-[900ms] ease-[cubic-bezier(0.65,0,0.35,1)] group-hover:translate-x-[280%]" />
                </span>
              )}
            </span>
          </motion.div>
        </div>
        <div className="flex flex-col items-start gap-6 sm:items-end">
          <button
            type="button"
            onClick={onPlay}
            className="inline-flex cursor-pointer items-center gap-3 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
          >
            <span className="relative inline-flex h-11 w-11 items-center justify-center">
              {reduce ? null : (
                <motion.span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full border border-white/80"
                  animate={{ scale: [1, 1.35], opacity: [0.4, 0] }}
                  transition={{ duration: duration.breath, repeat: Infinity, ease: easeFlow }}
                />
              )}
              <motion.span
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/80"
                whileHover={reduce ? undefined : { scale: 1.04 }}
                whileTap={reduce ? undefined : { scale: 0.98 }}
                transition={{ duration: duration.micro, ease: easeTide }}
              >
                <Play className="h-4 w-4 fill-white" />
              </motion.span>
            </span>
            Watch Resort Tour
          </button>
          <ScriptBadge inView className="-rotate-3" />
        </div>
      </div>
    </section>
  );
}
