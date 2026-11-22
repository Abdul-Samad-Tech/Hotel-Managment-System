import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { beachAccess, experienceCards, experienceCopy, experiencesIntro, houseHours, spaTreatments } from "../data/experiences";
import { useSiteMedia } from "../hooks/use-site-media";
import { CURSOR_LABELS } from "../lib/cursor.constant";
import { duration, easeTide, viewportOnce } from "../lib/motion";
import { PageBanner } from "../components/layout/PageBanner";
import { Badge } from "../components/ui/Badge";
import { Price } from "../components/ui/Price";

export function ExperiencesPage() {
  const reduce = useReducedMotion();
  const { media, byKey } = useSiteMedia("experiences");
  const introImage = byKey["experiences-intro"]?.url || byKey["experiences-intro"]?.src || experiencesIntro.image;
  const blocks = useMemo(() => {
    const pick = (group, fallback) => {
      const hit = media.find((item) => item.group === group);
      return hit?.url || hit?.src || fallback;
    };
    return [
      { ...experienceCards[0], image: pick("dining", experienceCards[0].image), text: experienceCopy.dining },
      { ...experienceCards[2], image: pick("spa", experienceCards[2].image), text: experienceCopy.spa },
      { ...experienceCards[1], image: pick("pool", experienceCards[1].image), text: experienceCopy.pool },
      { ...beachAccess, image: pick("beach", beachAccess.image), text: experienceCopy.beach },
    ];
  }, [media]);

  return (
    <main>
      <PageBanner
        eyebrow={experiencesIntro.eyebrow}
        title={experiencesIntro.titleLead}
        accent={experiencesIntro.titleAccent}
        text={experiencesIntro.text}
        image={introImage}
      />
      <section className="bg-cream py-14">
        <div className="page-wrap grid gap-16">
          {blocks.map((block, index) => (
            <article id={block.id} key={block.id} className="grid scroll-mt-28 items-center gap-6 md:grid-cols-2" data-cursor={CURSOR_LABELS.view}>
              <motion.img
                src={block.image}
                alt={block.title}
                className={`aspect-[4/3] w-full rounded-[18px] object-cover ${index % 2 ? "md:order-2" : ""}`}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewportOnce}
                transition={{ duration: reduce ? duration.micro : duration.reveal, ease: easeTide }}
              />
              <div className={index % 2 ? "md:order-1" : ""}>
                <h2 className="font-display text-4xl text-navy">{block.title}</h2>
                <p className="mt-3 max-w-md text-sm leading-7 text-muted">{block.text}</p>
              </div>
            </article>
          ))}

          <div>
            <h2 className="font-display text-3xl text-navy">Spa treatments</h2>
            <ul className="mt-5 grid gap-4 sm:grid-cols-3">
              {spaTreatments.map((item) => (
                <li key={item.name} className="rounded-2xl bg-white p-5 shadow-[0_16px_40px_rgba(7,27,43,0.08)]">
                  <p className="font-display text-xl text-navy">{item.name}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge tone="outline" className="normal-case tracking-normal">{item.duration}</Badge>
                    <Badge className="normal-case tracking-normal"><Price value={item.price} /></Badge>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <article className="rounded-[24px] bg-navy p-6 text-white">
            <h2 className="font-display text-2xl">Opening hours</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-3">
              {houseHours.map((row) => (
                <li key={row.place}>
                  <p className="text-sm text-white/70">{row.place}</p>
                  <p className="mt-1 text-gold">{row.hours}</p>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>
    </main>
  );
}
