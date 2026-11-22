import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, BedDouble, ChevronLeft, ChevronRight, Heart, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { roomsIntro } from "../../data/rooms";
import { useRoomCatalog } from "../../hooks/use-room-catalog";
import { PEEK_REGION, PEEK_SLIDE } from "../../lib/carousel.constant";
import { peekCarouselOptions } from "../../lib/carousel-gestures";
import { CURSOR_LABELS } from "../../lib/cursor.constant";
import { LIST_EMPTY } from "../../lib/list-empty.constant";
import { duration, easeTide, tideDelay, viewportOnce } from "../../lib/motion";
import { useDoubleTap } from "../../hooks/use-double-tap";
import { useWishlistHas } from "../../store/wishlistStore";
import { PeekViewport } from "../motion/PeekViewport";
import { toggleWishlistWithUndo } from "../wishlist/wishlist-actions";
import { Price, PriceCount } from "../ui/Price";
import { RevealText } from "../motion/RevealText";
import { Badge } from "../ui/Badge";
import { CircleButton, Eyebrow, PillButton } from "../ui/Buttons";
import { BlurImage } from "../ui/BlurImage";
import { EmptyState } from "../ui/EmptyState";
import { QuizEntry } from "../quiz/QuizEntry";
import { RoomCardSkeleton, SkeletonSet } from "../ui/Skeleton";
import { Tooltip } from "../ui/Tooltip";

export function RoomsSection() {
  const reduce = useReducedMotion();
  const { rooms } = useRoomCatalog();
  const [active, setActive] = useState(0);
  const [ready, setReady] = useState(false);
  const [quick, setQuick] = useState(null);
  const [emblaRef, embla] = useEmblaCarousel(peekCarouselOptions(reduce, { loop: true }));
  const count = String(active + 1).padStart(2, "0");

  useEffect(() => {
    let left = rooms.length;
    if (!left) {
      setReady(true);
      return;
    }
    setReady(false);
    rooms.forEach((room) => {
      const image = new Image();
      const done = () => {
        left -= 1;
        if (left <= 0) setReady(true);
      };
      image.onload = done;
      image.onerror = done;
      image.src = room.image;
    });
  }, [rooms]);

  useEffect(() => {
    if (!embla) return undefined;
    const sync = () => setActive(embla.selectedScrollSnap());
    embla.on("select", sync);
    sync();
    return () => embla.off("select", sync);
  }, [embla]);

  return (
    <section id="rooms" className="relative overflow-x-hidden bg-cream py-14 lg:py-16">
      <img
        src="/assets/azure-bay/decor/palm-leaf.svg"
        alt=""
        className="pointer-events-none absolute top-6 -left-16 hidden h-[340px] w-40 lg:block"
      />
      <div className="page-wrap relative grid items-start gap-8 lg:grid-cols-[minmax(280px,340px)_1fr] lg:gap-10">
        <div>
          <motion.div
            initial={reduce ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={viewportOnce}
            transition={{ duration: reduce ? duration.micro : duration.ui, ease: easeTide }}
          >
            <Eyebrow>{roomsIntro.eyebrow}</Eyebrow>
          </motion.div>
          <RevealText
            inView
            className="mt-3 font-display text-[2rem] leading-[1.15] font-medium text-navy lg:text-[2.2rem]"
            lines={[
              <span key="lead" className="lg:whitespace-nowrap">Comfort Redefined</span>,
              <span key="accent" className="lg:whitespace-nowrap">
                with <span className="text-gold italic">Ocean Views</span>
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
            {roomsIntro.text}
          </motion.p>
          <motion.div
            className="mt-6"
            initial={reduce ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={viewportOnce}
            transition={{ duration: reduce ? duration.micro : duration.ui, delay: reduce ? 0 : tideDelay(3), ease: easeTide }}
          >
            <PillButton variant="navy" href="/rooms" roll>
              Explore All Rooms
              <ArrowRight className="h-4 w-4" />
            </PillButton>
            <div className="mt-3">
              <QuizEntry tone="text" />
            </div>
          </motion.div>
          <div className="mt-8 flex items-center gap-3">
            <CircleButton className="h-11 w-11" label="Previous room" variant="light" onClick={() => embla?.scrollPrev()}>
              <ChevronLeft className="h-4 w-4" />
            </CircleButton>
            <p className="min-w-16 text-center text-sm tracking-[0.18em] text-navy">
              <DigitRoll value={count} />
              <span className="text-muted"> / 04</span>
            </p>
            <CircleButton className="h-11 w-11" label="Next room" variant="light" onClick={() => embla?.scrollNext()}>
              <ChevronRight className="h-4 w-4" />
            </CircleButton>
          </div>
        </div>

        {rooms.length === 0 ? (
          <EmptyState title="No rooms to show." text="Check back shortly." />
        ) : (
        <PeekViewport emblaRef={emblaRef} embla={embla} reduce={reduce} label={PEEK_REGION.rooms}>
        {!ready ? (
          <SkeletonSet label={LIST_EMPTY.roomsLoading}>
            <ul className="flex gap-4">
              {rooms.map((room) => (
                <li key={room.id} className={PEEK_SLIDE.rooms}>
                  <RoomCardSkeleton />
                </li>
              ))}
            </ul>
          </SkeletonSet>
        ) : (
        <ul className={`flex touch-pan-y gap-4 ${reduce ? "" : "cursor-grab active:cursor-grabbing"}`}>
          {rooms.map((room, cardIndex) => (
            <RoomCarouselCard
              key={room.id}
              room={room}
              cardIndex={cardIndex}
              reduce={reduce}
              onQuick={() => setQuick(room)}
            />
          ))}
        </ul>
        )}
        </PeekViewport>
        )}
      </div>
      <QuickView room={quick} onClose={() => setQuick(null)} />
    </section>
  );
}

function RoomCarouselCard({ room, cardIndex, reduce, onQuick }) {
  const saved = useWishlistHas(room.id);
  const onDoubleTap = useDoubleTap(() => toggleWishlistWithUndo(room.id));

  return (
    <motion.li
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportOnce}
      transition={{
        duration: reduce ? duration.micro : cardIndex % 2 === 0 ? duration.ui : duration.reveal,
        delay: reduce ? 0 : tideDelay(cardIndex),
        ease: easeTide,
      }}
      className={`group overflow-hidden rounded-2xl bg-white shadow-[0_16px_40px_rgba(7,27,43,0.08)] ${PEEK_SLIDE.rooms}`}
    >
      <motion.div
        className="relative aspect-[4/3] overflow-hidden"
        initial="rest"
        whileHover="hover"
        onPointerUp={onDoubleTap}
      >
        <motion.div
          className="h-full w-full"
          variants={{ rest: { scale: 1 }, hover: { scale: reduce ? 1 : 1.06 } }}
          transition={{ duration: duration.reveal, ease: easeTide }}
        >
          <BlurImage
            src={room.image}
            alt={`${room.name} with ocean light and warm wood`}
            className="h-full w-full"
          />
        </motion.div>
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-navy"
          variants={{ rest: { opacity: 0 }, hover: { opacity: reduce ? 0 : 0.16 } }}
          transition={{ duration: duration.ui, ease: easeTide }}
        />
        {room.badge && <Badge className="absolute top-3 left-3">{room.badge}</Badge>}
        <button
          type="button"
          aria-pressed={saved}
          aria-label={saved ? `Remove ${room.name} from wishlist` : `Save ${room.name}`}
          onClick={() => toggleWishlistWithUndo(room.id)}
          className="absolute top-3 right-3 z-[2] grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-navy/55 text-white hover:bg-navy focus-visible:outline-2 focus-visible:outline-gold"
        >
          <Heart className={`h-4 w-4 ${saved ? "fill-gold text-gold" : ""}`} />
        </button>
        <button
          type="button"
          data-cursor={CURSOR_LABELS.view}
          onClick={onQuick}
          className="absolute inset-x-3 bottom-3 z-[2] min-h-11 cursor-pointer rounded-full bg-white/90 px-3 text-xs font-semibold text-navy focus-visible:outline-2 focus-visible:outline-gold [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:transition-opacity [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:focus-visible:opacity-100"
        >
          Quick view
        </button>
      </motion.div>
      <div className="p-3.5">
        <h3 className="font-display text-[15px] leading-snug text-navy">{room.name}</h3>
        <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">
          <Tooltip label={room.guests}>
            <span tabIndex={0} className="inline-flex items-center gap-1 rounded-full outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
              <Users className="h-3.5 w-3.5" strokeWidth={1.6} />
              {room.guests}
            </span>
          </Tooltip>
          <Tooltip label={room.bed}>
            <span tabIndex={0} className="inline-flex items-center gap-1 rounded-full outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
              <BedDouble className="h-3.5 w-3.5" strokeWidth={1.6} />
              {room.bed}
            </span>
          </Tooltip>
        </p>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm text-navy">
            <PriceCount value={room.price} className="font-semibold" />
            <span className="text-muted"> / night</span>
          </p>
          <CircleButton data-cursor={CURSOR_LABELS.view} href={`/rooms/${room.id}`} label={`View ${room.name}`} className="h-8 w-8">
            <motion.span
              className="inline-flex"
              initial={reduce ? false : { rotate: -45 }}
              whileHover={reduce ? undefined : { rotate: 0 }}
              transition={{ duration: duration.ui, ease: easeTide }}
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </motion.span>
          </CircleButton>
        </div>
      </div>
    </motion.li>
  );
}

function QuickView({ room, onClose }) {
  return (
    <Dialog.Root open={Boolean(room)} onOpenChange={(next) => { if (!next) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-navy/60" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-[80] grid max-h-[min(40rem,calc(100%-2rem))] w-[min(52rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-cream text-navy shadow-[0_18px_50px_rgba(7,27,43,0.2)] outline-none md:grid-cols-[1.1fr_0.9fr]">
          {room && (
            <>
              <BlurImage src={room.image} alt={room.name} className="h-56 w-full md:h-full" />
              <div className="p-6">
                <Dialog.Title className="font-display text-3xl">{room.name}</Dialog.Title>
                <Dialog.Description className="mt-2 text-sm leading-6 text-muted">{room.summary}</Dialog.Description>
                <ul className="mt-4 grid gap-2 text-sm text-navy">
                  <li>{room.guests}</li>
                  <li>{room.bed}</li>
                </ul>
                <p className="mt-4 text-sm">
                  <span className="font-semibold"><Price value={room.price} /></span>
                  <span className="text-muted"> / night</span>
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <PillButton href={`/rooms/${room.id}`}>View Details</PillButton>
                  <PillButton variant="navy" href={`/booking/${room.id}`}>Book</PillButton>
                </div>
              </div>
            </>
          )}
          <Dialog.Close
            aria-label="Close"
            className="absolute top-3 right-3 grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-white text-navy hover:bg-gold focus-visible:outline-2 focus-visible:outline-gold"
          >
            <X className="h-4 w-4" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function DigitRoll({ value }) {
  const reduce = useReducedMotion();

  return (
    <span className="inline-flex font-semibold">
      {value.split("").map((char, index) => (
        <span key={index} className="inline-grid h-[1.15em] overflow-hidden">
          <AnimatePresence initial={false}>
            <motion.span
              key={char}
              className="col-start-1 row-start-1"
              initial={reduce ? false : { y: "110%" }}
              animate={{ y: "0%" }}
              exit={reduce ? undefined : { y: "-110%" }}
              transition={{ duration: reduce ? duration.micro : duration.ui, ease: easeTide }}
            >
              {char}
            </motion.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  );
}
