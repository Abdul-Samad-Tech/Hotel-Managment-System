import { ArrowRight, ChevronDown, MapPin, Play, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Fade from "embla-carousel-fade";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { heroCopy, heroSlides, weather } from "../../data/site";
import { CURSOR_LABELS } from "../../lib/cursor.constant";
import { duration, easeFlow, easeTide } from "../../lib/motion";
import { MagneticButton } from "../motion/MagneticButton";
import { RevealText } from "../motion/RevealText";
import { Eyebrow, PillButton } from "../ui/Buttons";
import { ScriptBadge } from "../ui/ScriptBadge";
import { SmartImage } from "../ui/SmartImage";

export function Hero({ onPlay }) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [emblaRef, embla] = useEmblaCarousel({ loop: true, duration: reduce ? 0 : 30, watchDrag: !reduce }, [Fade()]);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, reduce ? 0 : 70]);

  useEffect(() => {
    if (!embla) return undefined;
    const sync = () => setIndex(embla.selectedScrollSnap());
    embla.on("select", sync);
    sync();
    return () => embla.off("select", sync);
  }, [embla]);

  useEffect(() => {
    if (!embla || reduce || paused) return undefined;
    const id = window.setInterval(() => embla.scrollNext(), 5000);
    return () => window.clearInterval(id);
  }, [embla, paused, reduce]);

  const slide = heroSlides[index];

  return (
    <section id="hero" className="relative h-[640px] overflow-hidden bg-navy sm:h-[700px] lg:h-[740px]">
      <motion.div className="absolute inset-0 overflow-hidden" style={{ y }} ref={emblaRef}>
        <div className="flex h-full">
          {heroSlides.map((item, itemIndex) => (
            <div key={item.id} className="h-full min-w-0 flex-[0_0_100%]">
              <SmartImage
                src={heroCopy.image}
                alt={itemIndex === 0 ? "Infinity pool and resort villas at sunset, Azure Bay Maldives" : ""}
                className="h-[115%] w-full"
                imgClassName="kenburns h-full w-full"
                imgStyle={{ objectPosition: item.position }}
                priority={itemIndex === 0}
                width={1920}
                height={1080}
              />
            </div>
          ))}
        </div>
      </motion.div>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,22,36,0.88)_0%,rgba(7,22,36,0.55)_36%,rgba(7,22,36,0.08)_62%,rgba(7,22,36,0.22)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-navy/35 to-transparent" />

      <div className="relative z-10 mx-auto flex h-full w-[min(1140px,calc(100%-1.5rem))] items-center pb-24 pt-16">
        <div className="w-full max-w-[640px]">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: duration.ui, ease: easeTide }}
          >
            <Eyebrow>{heroCopy.eyebrow}</Eyebrow>
          </motion.div>
          <RevealText
            as="h1"
            className="mt-4 font-display text-[2.55rem] leading-[1.08] font-medium text-white sm:text-[3.4rem] lg:text-[4.15rem]"
            delay={0.08}
            lines={[
              <>
                Where <OceanShimmer />
              </>,
              "Meet Unforgettable",
              "Stays",
            ]}
          />
          <motion.p
            className="mt-5 max-w-[460px] text-sm leading-[1.65] font-light text-white/90 sm:text-[15px]"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: duration.reveal, delay: 0.42, ease: easeTide }}
          >
            {heroCopy.text}
          </motion.p>
          <motion.div
            className="mt-7 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6"
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: duration.reveal, delay: 0.55, ease: easeTide }}
          >
            <MagneticButton className="inline-flex">
              <PillButton href="/rooms" roll>
                Explore Our Rooms
                <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
              </PillButton>
            </MagneticButton>
            <button
              type="button"
              data-cursor={CURSOR_LABELS.play}
              onClick={onPlay}
              className="inline-flex cursor-pointer items-center gap-3 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
            >
              <motion.span
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-white/10 backdrop-blur-sm"
                whileHover={reduce ? undefined : { scale: 1.08 }}
                whileTap={reduce ? undefined : { scale: 0.96 }}
              >
                <Play className="h-4 w-4 fill-white" />
              </motion.span>
              Watch Resort Video
            </button>
          </motion.div>
        </div>
      </div>

      <motion.aside
        className="absolute top-28 right-6 z-20 hidden w-[210px] rounded-2xl border border-white/20 bg-[rgba(10,24,40,0.55)] p-3.5 text-white shadow-[0_16px_40px_rgba(0,0,0,0.22)] backdrop-blur-md lg:block lg:right-14"
        initial={reduce ? false : { opacity: 0, x: 18, filter: "blur(8px)" }}
        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
        transition={{ duration: duration.reveal, delay: 0.48, ease: easeTide }}
      >
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-gold">
            <Sun className="h-5 w-5" strokeWidth={1.5} />
          </span>
          <div>
            <p className="font-display text-[1.7rem] leading-none">{weather.temp}</p>
            <p className="mt-1 text-xs text-white/80">{weather.condition}</p>
          </div>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-[11px] tracking-wide text-white/75">
          <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
          {weather.place}
        </p>
      </motion.aside>

      <div className="absolute right-16 bottom-28 z-10 hidden lg:block">
        <ScriptBadge className="-rotate-3" />
      </div>

      {!reduce && (
        <button
          type="button"
          aria-pressed={paused}
          onClick={() => setPaused((value) => !value)}
          className="absolute top-24 right-4 z-20 inline-flex h-11 cursor-pointer items-center rounded-full border border-white/30 bg-navy/45 px-4 text-[11px] tracking-[0.16em] text-white uppercase focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          {paused ? "Play slides" : "Pause slides"}
        </button>
      )}

      <div
        className="absolute top-1/2 right-3 z-20 hidden -translate-y-1/2 flex-col items-center gap-2.5 md:flex"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <p className="sr-only" aria-live="polite">
          Slide {slide.id} of 03
        </p>
        <span className="relative h-14 w-px overflow-hidden bg-white/35" aria-hidden="true">
          <motion.span
            key={`${index}-${paused ? "hold" : "run"}`}
            className="absolute inset-x-0 top-0 h-full origin-top bg-gold"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: reduce || paused ? 0 : 1 }}
            transition={{ duration: 5, ease: "linear" }}
          />
        </span>
        {heroSlides.map((item, itemIndex) => {
          const active = itemIndex === index;
          return (
            <button
              key={item.id}
              type="button"
              aria-label={`Show slide ${item.id}`}
              aria-current={active ? "true" : undefined}
              onClick={() => embla?.scrollTo(itemIndex)}
              className={`inline-flex min-h-11 min-w-8 cursor-pointer items-center justify-center px-1 text-[11px] tracking-[0.18em] drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
                active ? "font-semibold text-gold" : "text-white/75 hover:text-white"
              }`}
            >
              {item.id}
            </button>
          );
        })}
      </div>

      <a
        href="#booking"
        className="absolute bottom-24 left-1/2 z-20 inline-flex -translate-x-1/2 flex-col items-center gap-1 text-[11px] tracking-[0.18em] text-white/80 uppercase hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
      >
        Scroll
        <ChevronDown className="h-4 w-4" aria-hidden="true" />
      </a>

      <svg
        viewBox="0 0 1440 90"
        preserveAspectRatio="none"
        className="absolute bottom-0 left-0 z-10 h-16 w-full text-white md:h-[88px]"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M0 48C160 90 320 8 520 36C740 68 900 96 1100 48C1260 12 1360 24 1440 42V90H0Z"
        />
      </svg>
    </section>
  );
}

function OceanShimmer() {
  const reduce = useReducedMotion();

  return (
    <span className="relative inline-block text-gold italic">
      Ocean Vibes
      {!reduce && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent"
          initial={{ x: "-140%", opacity: 0 }}
          animate={{ x: "320%", opacity: [0, 0.85, 0] }}
          transition={{ duration: 0.95, delay: 1.15, ease: easeFlow }}
        />
      )}
    </span>
  );
}
