import { ArrowRight, ArrowUpRight, Flower2, Infinity, Umbrella, UtensilsCrossed } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { beachAccess, experienceCards, experienceLinks, experiencesIntro } from "../../data/experiences";
import { CURSOR_LABELS } from "../../lib/cursor.constant";
import { duration, easeTide, tideDelay, viewportOnce } from "../../lib/motion";
import { RevealText } from "../motion/RevealText";
import { CircleButton, Eyebrow, PillButton } from "../ui/Buttons";

const icons = {
  dining: UtensilsCrossed,
  spa: Flower2,
  pool: Infinity,
  waves: Umbrella,
};

export function ExperiencesSection() {
  const reduce = useReducedMotion();
  const sectionRef = useRef(null);
  const catalog = [...experienceCards, beachAccess];
  const [featuredId, setFeaturedId] = useState(experienceCards.find((card) => card.featured)?.id ?? catalog[0].id);
  const featured = catalog.find((card) => card.id === featuredId) ?? catalog[0];
  const stacked = catalog.filter((card) => card.id !== featured.id).slice(0, 2);
  const linkTarget = {
    Restaurant: "dining",
    "Spa & Wellness": "spa",
    "Infinity Pool": "pool",
    "Beach Access": "beach",
  };
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-4%", "4%"]);

  return (
    <section ref={sectionRef} id="experiences" className="relative overflow-hidden bg-navy py-16 text-white lg:py-20">
      <motion.img
        src={experiencesIntro.image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-45"
        style={{ y, scale: reduce ? 1 : 1.08 }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,22,36,0.9)_0%,rgba(7,22,36,0.72)_46%,rgba(7,22,36,0.42)_100%)]" />

      <div className="page-wrap relative z-10 grid items-center gap-10 lg:grid-cols-[0.78fr_1.22fr]">
        <div>
          <motion.div
            initial={reduce ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={viewportOnce}
            transition={{ duration: reduce ? duration.micro : duration.ui, ease: easeTide }}
          >
            <Eyebrow>{experiencesIntro.eyebrow}</Eyebrow>
          </motion.div>
          <RevealText
            inView
            className="mt-3 font-display text-[2.15rem] leading-[1.12] font-medium lg:text-[2.65rem]"
            lines={[
              "An Experience",
              <span key="sea" className="text-gold italic">
                by the Sea
              </span>,
            ]}
          />
          <motion.p
            className="mt-4 max-w-md text-sm leading-7 text-white/75"
            initial={reduce ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={viewportOnce}
            transition={{ duration: reduce ? duration.micro : duration.ui, delay: reduce ? 0 : tideDelay(2), ease: easeTide }}
          >
            {experiencesIntro.text}
          </motion.p>
          <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3">
            {experienceLinks.map((link, index) => {
              const Icon = icons[link.icon];
              return (
                <motion.li
                  key={link.label}
                  initial={reduce ? false : { opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={viewportOnce}
                  transition={{
                    duration: reduce ? duration.micro : duration.ui,
                    delay: reduce ? 0 : tideDelay(index),
                    ease: easeTide,
                  }}
                >
                  <button
                    type="button"
                    aria-pressed={linkTarget[link.label] === featuredId}
                    onClick={() => setFeaturedId(linkTarget[link.label])}
                    className={`flex min-h-11 cursor-pointer items-center gap-2.5 rounded-full text-left text-[13px] hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${linkTarget[link.label] === featuredId ? "text-gold" : ""}`}
                  >
                    <motion.span
                      className="grid h-9 w-9 place-items-center rounded-full bg-gold/15 text-gold"
                      initial={reduce ? false : { scale: 0.92, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={viewportOnce}
                      transition={{ duration: reduce ? duration.micro : duration.ui, delay: reduce ? 0 : tideDelay(index), ease: easeTide }}
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.5} />
                    </motion.span>
                    {link.label}
                  </button>
                </motion.li>
              );
            })}
          </ul>
          <motion.div
            className="mt-7"
            initial={reduce ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={viewportOnce}
            transition={{ duration: reduce ? duration.micro : duration.ui, delay: reduce ? 0 : tideDelay(4), ease: easeTide }}
          >
            <PillButton href="/experiences" roll>
              Explore Experiences
              <ArrowRight className="h-4 w-4" />
            </PillButton>
          </motion.div>
        </div>

        <div id="gallery" className="grid gap-4 lg:grid-cols-[1.35fr_0.85fr] lg:grid-rows-2">
          <ExperienceCard card={featured} index={0} className="min-h-[280px] lg:row-span-2 lg:min-h-[480px]" />
          {stacked.map((card, index) => (
            <ExperienceCard key={`slot-${index}`} card={card} index={index + 1} className="min-h-[200px]" />
          ))}
        </div>
      </div>
      <p id={beachAccess.id} className="sr-only">
        Private beach access is included with every stay.
      </p>
    </section>
  );
}

function ExperienceCard({ card, index, className = "" }) {
  const reduce = useReducedMotion();
  const fine = useFinePointer();
  const spotRef = useRef(null);
  const [hot, setHot] = useState(false);

  function follow(event) {
    const spot = spotRef.current;
    if (!spot || reduce || !fine) return;
    const box = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - box.left;
    const y = event.clientY - box.top;
    spot.style.background = `radial-gradient(180px circle at ${x}px ${y}px, rgba(242, 192, 120, 0.22), transparent 70%)`;
    spot.style.opacity = "1";
  }

  function leave() {
    setHot(false);
    if (spotRef.current) spotRef.current.style.opacity = "0";
  }

  return (
    <motion.article
      id={card.id}
      onMouseEnter={() => setHot(true)}
      onMouseMove={follow}
      onMouseLeave={leave}
      initial={reduce ? { opacity: 0 } : { clipPath: "inset(100% 0% 0% 0% round 18px)" }}
      whileInView={reduce ? { opacity: 1 } : { clipPath: "inset(0% 0% 0% 0% round 18px)" }}
      viewport={viewportOnce}
      transition={{
        duration: reduce ? duration.micro : duration.reveal,
        delay: reduce ? 0 : tideDelay(index),
        ease: easeTide,
      }}
      className={`group relative overflow-hidden rounded-[18px] border border-white/25 focus-within:ring-2 focus-within:ring-gold ${className}`}
      data-cursor={CURSOR_LABELS.view}
    >
      <AnimatePresence initial={false}>
        <motion.img
          key={card.image}
          src={card.image}
          alt={card.title}
          className="absolute inset-0 h-full w-full object-cover"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? undefined : { opacity: 0 }}
          transition={{ duration: reduce ? duration.micro : duration.ui, ease: easeTide }}
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/15 to-transparent" />
      <span
        ref={spotRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200"
      />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
        <motion.h3
          key={card.title}
          className="font-display text-2xl text-white"
          initial={false}
          animate={{ y: hot && !reduce ? 0 : 10, opacity: hot || reduce ? 1 : 0.86 }}
          transition={{ duration: duration.micro, ease: easeTide }}
        >
          {card.title}
        </motion.h3>
        <CircleButton
          href={card.id === "dining" ? "/dining" : `/experiences#${card.id}`}
          label={`Open ${card.title}`}
          variant="outline"
          className="relative"
          data-cursor={CURSOR_LABELS.view}
        >
          <motion.span
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-gold"
            initial={false}
            animate={{ scale: hot && !reduce ? 1 : 0.55, opacity: hot && !reduce ? 1 : 0 }}
            transition={{ duration: duration.ui, ease: easeTide }}
          />
          <ArrowUpRight className={`relative h-4 w-4 ${hot && !reduce ? "text-navy" : ""}`} />
        </CircleButton>
      </div>
    </motion.article>
  );
}

function useFinePointer() {
  const [fine, setFine] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(pointer: fine)");
    const sync = () => setFine(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return fine;
}
