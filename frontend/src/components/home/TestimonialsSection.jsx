import { ArrowRight, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { testimonials as staticTestimonials, testimonialsIntro } from "../../data/testimonials";
import { api } from "../../lib/api";
import { PEEK_REGION, PEEK_SLIDE } from "../../lib/carousel.constant";
import { peekCarouselOptions } from "../../lib/carousel-gestures";
import { duration, easeTide, starStep, tideDelay, viewportOnce } from "../../lib/motion";
import { PeekViewport } from "../motion/PeekViewport";
import { RevealText } from "../motion/RevealText";
import { Badge } from "../ui/Badge";
import { CircleButton, Eyebrow } from "../ui/Buttons";
import { EmptyState } from "../ui/EmptyState";
import { Skeleton } from "../ui/Skeleton";
import { SmartImage } from "../ui/SmartImage";

const AVATARS = [
  "/assets/azure-bay/avatars/guest-1.jpg",
  "/assets/azure-bay/avatars/guest-2.jpg",
  "/assets/azure-bay/avatars/guest-3.jpg",
];

function mapFeedbackToStories(rows) {
  return (rows || []).map((row, index) => ({
    id: String(row.id),
    name: row.guest || "Guest",
    city: "Verified stay",
    quote: row.comment || row.title || "",
    avatar: AVATARS[index % AVATARS.length],
    stars: Math.min(5, Math.max(1, Number(row.rating) || 5)),
  }));
}

export function TestimonialsSection() {
  const reduce = useReducedMotion();
  const sectionRef = useRef(null);
  const seen = useInView(sectionRef, viewportOnce);
  const [emblaRef, embla] = useEmblaCarousel(peekCarouselOptions(reduce, { loop: true, dragFree: false }));
  const [stories, setStories] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    api("/feedback")
      .then((data) => {
        if (!alive) return;
        const live = mapFeedbackToStories(data.feedback);
        setStories(live.length ? live : staticTestimonials.map((item) => ({ ...item, stars: 5 })));
      })
      .catch(() => {
        if (alive) setStories(staticTestimonials.map((item) => ({ ...item, stars: 5 })));
      })
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const reviewCount = stories.length;
  const average = reviewCount
    ? stories.reduce((sum, item) => sum + (item.stars || 5), 0) / reviewCount
    : 0;

  return (
    <section ref={sectionRef} className="overflow-hidden bg-white py-14 lg:py-16" aria-labelledby="reviews-title">
      <div className="page-wrap">
        <div className="grid items-start gap-8 lg:grid-cols-[280px_1fr]">
          <div>
            <motion.div
              initial={reduce ? false : { opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={viewportOnce}
              transition={{ duration: reduce ? duration.micro : duration.ui, ease: easeTide }}
            >
              <Eyebrow>{testimonialsIntro.eyebrow}</Eyebrow>
            </motion.div>
            <RevealText
              as="h2"
              id="reviews-title"
              inView
              className="mt-3 font-display text-[2.05rem] leading-[1.12] font-medium text-navy lg:text-[2.35rem]"
              lines={[
                testimonialsIntro.titleLead,
                <span key="accent" className="whitespace-nowrap text-gold italic">
                  {testimonialsIntro.titleAccent}
                </span>,
              ]}
            />
            <motion.p
              className="mt-4 text-sm leading-7 text-muted"
              initial={reduce ? false : { opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={viewportOnce}
              transition={{ duration: reduce ? duration.micro : duration.ui, delay: reduce ? 0 : tideDelay(2), ease: easeTide }}
            >
              {testimonialsIntro.text}
            </motion.p>
            <motion.a
              href="#reviews"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-navy hover:text-gold"
              initial={reduce ? false : { opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={viewportOnce}
              transition={{ duration: reduce ? duration.micro : duration.ui, delay: reduce ? 0 : tideDelay(3), ease: easeTide }}
            >
              View All Reviews
              <ArrowRight className="h-4 w-4" />
            </motion.a>
            <div className="mt-6 flex items-center gap-3 rounded-2xl bg-cream px-4 py-3">
              <p className="font-display text-3xl text-navy">{ready ? average.toFixed(1) : "—"}</p>
              <p className="text-sm leading-5 text-muted">
                from {ready ? reviewCount : "…"} guest {reviewCount === 1 ? "story" : "stories"}
              </p>
            </div>
            <div className="mt-6 flex gap-2">
              <CircleButton className="h-11 w-11" label="Previous reviews" variant="light" onClick={() => embla?.scrollPrev()}>
                <ChevronLeft className="h-4 w-4" />
              </CircleButton>
              <CircleButton className="h-11 w-11" label="Next reviews" variant="light" onClick={() => embla?.scrollNext()}>
                <ChevronRight className="h-4 w-4" />
              </CircleButton>
            </div>
          </div>

          {!ready ? (
            <Skeleton className="min-h-[16rem] w-full" />
          ) : stories.length === 0 ? (
            <EmptyState title="No guest stories yet." text="Check back after your stay." />
          ) : (
          <PeekViewport id="reviews" emblaRef={emblaRef} embla={embla} reduce={reduce} label={PEEK_REGION.reviews}>
          <ul className={`flex touch-pan-y gap-4 ${reduce ? "" : "cursor-grab active:cursor-grabbing"}`}>
              {stories.map((item) => (
                <motion.li
                  key={item.id}
                  initial={reduce ? { opacity: 0 } : { opacity: 0 }}
                  animate={seen ? { opacity: 1 } : undefined}
                  transition={{ duration: reduce ? duration.micro : duration.ui, ease: easeTide }}
                  className={`flex flex-col rounded-2xl bg-white p-5 shadow-[0_14px_36px_rgba(7,27,43,0.08)] ${PEEK_SLIDE.reviews}`}
                >
                  <SmartImage
                    src={item.avatar}
                    alt=""
                    width={44}
                    height={44}
                    className="h-11 w-11 rounded-full"
                  />
                  <motion.p
                    className="mt-4 flex-1 text-sm leading-6 text-muted"
                    initial={reduce ? false : { opacity: 0 }}
                    animate={seen ? { opacity: 1 } : undefined}
                    transition={{
                      duration: reduce ? duration.micro : duration.ui,
                      delay: reduce ? 0 : duration.ui,
                      ease: easeTide,
                    }}
                  >
                    “{item.quote}”
                  </motion.p>
                  <p className="mt-4 text-sm font-semibold text-navy">{item.name}</p>
                  <Badge className="mt-2 w-fit">Verified Stay</Badge>
                  <p className="text-xs text-muted">{item.city}</p>
                  <p className="mt-3 flex gap-0.5" aria-label={`${item.stars || 5} out of 5 stars`}>
                    {Array.from({ length: item.stars || 5 }).map((_, starIndex) => (
                      <motion.span
                        key={starIndex}
                        className="inline-flex"
                        initial={reduce ? false : { opacity: 0, scale: 0.7 }}
                        animate={seen ? { opacity: 1, scale: 1 } : undefined}
                        transition={{
                          duration: duration.micro,
                          delay: reduce ? 0 : duration.ui + starIndex * starStep,
                          ease: easeTide,
                        }}
                      >
                        <Star className="h-3.5 w-3.5 fill-gold text-gold" aria-hidden="true" />
                      </motion.span>
                    ))}
                  </p>
                </motion.li>
              ))}
          </ul>
          </PeekViewport>
          )}
        </div>
      </div>
    </section>
  );
}
