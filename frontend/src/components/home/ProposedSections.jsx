import useEmblaCarousel from "embla-carousel-react";
import { useReducedMotion } from "framer-motion";
import { rooms } from "../../data/rooms";
import { faqs } from "../../data/site";
import { PEEK_REGION, PEEK_SLIDE } from "../../lib/carousel.constant";
import { peekCarouselOptions } from "../../lib/carousel-gestures";
import { CountUp } from "../motion/CountUp";
import { Marquee } from "../motion/Marquee";
import { PeekViewport } from "../motion/PeekViewport";
import { Accordion } from "../ui/Accordion";
import { CircleButton } from "../ui/Buttons";
import { EmptyState } from "../ui/EmptyState";
import { SmartImage } from "../ui/SmartImage";
import { ChevronLeft, ChevronRight } from "lucide-react";

const stats = [
  { value: 4, suffix: "", label: "Room types" },
  { value: 4, suffix: "", label: "Experiences" },
  { value: 3, suffix: "", label: "Guest stories" },
  { value: 24, suffix: "", label: "Hour desk" },
];

const offers = rooms.map((room) => ({
  id: room.id,
  name: room.name,
  price: room.price,
  text: room.summary,
  image: room.image,
}));

const marks = ["Beachfront", "24/7 concierge", "Sea-view rooms", "Ocean dining", "Spa", "Infinity pool"];

export function ProposedHomeSections() {
  return (
    <div className="grid gap-10 border-t border-navy/10 pt-10">
      <header>
        <p className="text-[11px] font-medium tracking-[0.22em] text-gold uppercase">Not on the home page yet</p>
        <h2 className="mt-2 font-display text-3xl">Proposed sections</h2>
        <ol className="mt-3 grid gap-1 text-sm text-muted">
          <li>Stats strip — after the features row, before rooms.</li>
          <li>Offers slider — after rooms, before experiences.</li>
          <li>Questions — after testimonials, before the closing banner.</li>
          <li>House marks — a slow line just above the closing banner.</li>
        </ol>
      </header>
      <StatsStrip />
      <OffersSlider />
      <Questions />
      <HouseMarks />
    </div>
  );
}

function StatsStrip() {
  return (
    <section aria-label="House numbers" className="grid grid-cols-2 gap-4 rounded-2xl bg-white p-6 shadow-[0_16px_40px_rgba(7,27,43,0.08)] sm:grid-cols-4">
      {stats.map((item) => (
        <p key={item.label} className="text-center">
          <CountUp value={item.value} className="font-display text-4xl text-navy" />
          <span className="mt-1 block text-xs tracking-[0.14em] text-muted uppercase">{item.label}</span>
        </p>
      ))}
    </section>
  );
}

function OffersSlider() {
  const reduce = useReducedMotion();
  const [ref, embla] = useEmblaCarousel(peekCarouselOptions(reduce, { loop: true, dragFree: false }));

  return (
    <section aria-label="Stays">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-2xl">Stays</h3>
        <div className="flex gap-2">
          <CircleButton className="h-11 w-11" label="Previous stay" variant="light" onClick={() => embla?.scrollPrev()}>
            <ChevronLeft className="h-4 w-4" />
          </CircleButton>
          <CircleButton className="h-11 w-11" label="Next stay" variant="light" onClick={() => embla?.scrollNext()}>
            <ChevronRight className="h-4 w-4" />
          </CircleButton>
        </div>
      </div>
      {offers.length === 0 ? (
        <EmptyState title="No stays to show." text="Check back shortly." />
      ) : (
        <PeekViewport emblaRef={ref} embla={embla} reduce={reduce} label={PEEK_REGION.offers}>
          <ul className={`flex gap-4 ${reduce ? "" : "cursor-grab active:cursor-grabbing"}`}>
            {offers.map((offer) => (
              <li key={offer.id} className={`overflow-hidden rounded-2xl bg-white shadow-[0_16px_40px_rgba(7,27,43,0.08)] ${PEEK_SLIDE.offers}`}>
                <SmartImage src={offer.image} alt="" width={640} height={480} className="aspect-[4/3] w-full" />
                <div className="p-4">
                  <p className="font-display text-xl text-navy">{offer.name}</p>
                  <p className="mt-1 text-sm text-muted">{offer.text}</p>
                  <p className="mt-3 text-sm font-semibold text-navy">${offer.price} <span className="font-normal text-muted">/ night</span></p>
                </div>
              </li>
            ))}
          </ul>
        </PeekViewport>
      )}
    </section>
  );
}

function Questions() {
  return (
    <section aria-label="Questions" className="max-w-xl">
      <h3 className="mb-3 font-display text-2xl">Questions</h3>
      <Accordion items={faqs.map((item) => ({ value: item.label, title: item.label, body: item.text }))} />
    </section>
  );
}

function HouseMarks() {
  return (
    <section aria-label="The house" className="rounded-2xl bg-navy py-4 text-white">
      <Marquee>
        <p className="flex gap-10 px-5 text-sm tracking-[0.18em] uppercase">
          {marks.map((mark) => (
            <span key={mark}>{mark}</span>
          ))}
        </p>
      </Marquee>
    </section>
  );
}
