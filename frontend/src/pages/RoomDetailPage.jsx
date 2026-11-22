import * as Popover from "@radix-ui/react-popover";
import { BedDouble, CalendarDays, Check, ChevronLeft, ChevronRight, Minus, Plus, Star, Users } from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { format as formatDate } from "date-fns";
import { Drawer } from "vaul";
import { PriceCalendar } from "../components/booking/PriceCalendar";
import useEmblaCarousel from "embla-carousel-react";
import { motion, useReducedMotion } from "framer-motion";
import { guestCount, stayPolicies as staticStayPolicies } from "../data/rooms";
import { useRoomCatalog } from "../hooks/use-room-catalog";
import { api } from "../lib/api";
import { IMAGE_STATUS } from "../lib/blur-image.constant";
import { AVAILABILITY_COPY } from "../lib/availability.constant";
import { requireSignedIn } from "../lib/auth-gate";
import { MEDIA_NARROW } from "../lib/media.constant";
import { duration, easeTide } from "../lib/motion";
import { PEEK_REGION, PEEK_SLIDE } from "../lib/carousel.constant";
import { peekCarouselOptions } from "../lib/carousel-gestures";
import { CURSOR_LABELS } from "../lib/cursor.constant";
import { isStayRangeValid, stayNights } from "../lib/stay-date";
import { GUEST_LIMITS, RANGE_ERROR } from "../store/search.constant";
import { useSearchStay, useSearchStore } from "../store/searchStore";
import { useMediaQuery } from "../hooks/use-media-query";
import { RoomNeighborButtons, useRoomSwipeNav } from "../components/rooms/room-nav";
import { BlurImage } from "../components/ui/BlurImage";
import { Price, PriceCount } from "../components/ui/Price";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../context/LocaleContext";
import { RevealText } from "../components/motion/RevealText";
import { PeekViewport } from "../components/motion/PeekViewport";
import { Accordion } from "../components/ui/Accordion";
import { Badge } from "../components/ui/Badge";
import { CircleButton, PillButton } from "../components/ui/Buttons";
import { CompareToggle } from "../components/compare/CompareToggle";
import { Dialog } from "../components/ui/Dialog";
import { EmptyState } from "../components/ui/EmptyState";
import { InlineError } from "../components/ui/InlineError";
import { Skeleton } from "../components/ui/Skeleton";
import { Tabs } from "../components/ui/Tabs";

const BayLightbox = lazy(() => import("../components/ui/BayLightbox.jsx").then((module) => ({ default: module.BayLightbox })));

const sections = [
  { value: "overview", label: "Overview" },
  { value: "amenities", label: "Amenities" },
  { value: "policies", label: "Policies" },
  { value: "reviews", label: "Reviews" },
];

export function RoomDetailPage() {
  const reduce = useReducedMotion();
  const { slug } = useParams();
  const { rooms, ready: catalogReady } = useRoomCatalog();
  const room = rooms.find((item) => item.id === slug || item.selectLabel === slug);
  const [openAt, setOpenAt] = useState(-1);
  const [section, setSection] = useState("overview");
  const [amenitiesOpen, setAmenitiesOpen] = useState(false);
  const [policies, setPolicies] = useState([]);
  const [policiesReady, setPoliciesReady] = useState(false);
  const { prev, next, goPrev, goNext, bind } = useRoomSwipeNav(slug, Boolean(room));

  useEffect(() => {
    let alive = true;
    api("/public/stay-policies")
      .then((data) => {
        if (!alive) return;
        const list = (data.policies || []).map((item) => ({
          value: String(item.id),
          title: item.title,
          body: item.body,
        }));
        setPolicies(list.length ? list : staticStayPolicies);
      })
      .catch(() => {
        if (alive) setPolicies(staticStayPolicies);
      })
      .finally(() => {
        if (alive) setPoliciesReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const nodes = sections
      .map((item) => document.getElementById(item.value))
      .filter(Boolean);
    if (!nodes.length) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setSection(visible.target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0.2, 0.5] },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [room]);

  if (!catalogReady && !room) {
    return (
      <main className="bg-cream px-6 pt-36 pb-20">
        <div className="page-wrap" aria-busy="true">
          <p className="text-sm text-muted">Loading room…</p>
        </div>
      </main>
    );
  }

  if (!room) {
    return (
      <main className="bg-cream px-6 pt-36 pb-20">
        <div className="page-wrap">
          <EmptyState title="Room not found" text="That room is not on the list.">
            <Link to="/rooms" className="text-sm font-semibold text-navy underline">
              Back to rooms
            </Link>
          </EmptyState>
        </div>
      </main>
    );
  }

  const gallery = Array.isArray(room.gallery) ? room.gallery : [];
  const slides = gallery.map((photo) => ({ src: photo.src, alt: photo.alt, thumbnail: photo.src }));
  const shown = (room.amenities || []).slice(0, 6);
  const reserveHref = `/booking/${room.id}`;

  function jump(value) {
    setSection(value);
    document.getElementById(value)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  return (
    <main className="bg-cream pt-24 pb-28 lg:pb-16" {...bind()}>
      <div className="page-wrap">
        <Gallery room={room} onOpen={setOpenAt} />
        <RoomNeighborButtons
          prev={prev}
          next={next}
          onPrev={goPrev}
          onNext={goNext}
          className="mt-4"
        />
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div>
            <div className="sticky top-[68px] z-30 -mx-1 bg-cream/95 py-3 backdrop-blur-sm">
              <div className="overflow-x-auto">
                <Tabs value={section} onValueChange={jump} items={sections} layoutId="room-anchor" />
              </div>
            </div>

            <section id="overview" className="scroll-mt-36 pt-4">
              {room.badge ? <Badge>{room.badge}</Badge> : null}
              <RevealText as="h1" inView className="mt-3 font-display text-4xl text-navy sm:text-5xl" lines={[room.name]} />
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">{room.summary}</p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {[room.guests, room.bed, ...room.specs].map((chip) => (
                  <li key={chip}>
                    <Badge tone="outline" className="normal-case tracking-normal">
                      {chip}
                    </Badge>
                  </li>
                ))}
              </ul>
            </section>

            <section id="amenities" className="scroll-mt-36 pt-12">
              <h2 className="font-display text-2xl text-navy">Amenities</h2>
              {shown.length === 0 ? (
                <div className="mt-4">
                  <EmptyState title="No amenities listed" text="This room type has no amenities yet." />
                </div>
              ) : (
                <>
                  <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                    {shown.map((item) => (
                      <li key={item} className="flex min-h-11 items-center gap-2 rounded-2xl bg-white px-4 text-sm text-navy">
                        <Check className="h-4 w-4 text-gold" aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  {(room.amenities || []).length > shown.length && (
                    <button
                      type="button"
                      onClick={() => setAmenitiesOpen(true)}
                      className="mt-4 inline-flex h-11 cursor-pointer items-center text-sm font-semibold text-navy underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                    >
                      Show all
                    </button>
                  )}
                </>
              )}
            </section>

            <section id="policies" className="scroll-mt-36 pt-12">
              <h2 className="mb-4 font-display text-2xl text-navy">Policies</h2>
              {!policiesReady ? (
                <Skeleton className="h-24 w-full" />
              ) : policies.length === 0 ? (
                <EmptyState title="No policies yet" text="The hotel has not published stay policies." />
              ) : (
                <Accordion items={policies} />
              )}
            </section>

            <section id="reviews" className="scroll-mt-36 pt-12">
              <h2 className="font-display text-2xl text-navy">Reviews</h2>
              <Reviews />
            </section>
          </div>

          <aside className="lg:sticky lg:top-24">
            <BookingCard room={room} reserveHref={reserveHref} />
          </aside>
        </div>

        <SimilarRooms currentId={room.id} reduce={reduce} rooms={rooms} />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-navy/10 bg-cream px-4 py-3 lg:hidden">
        <p className="text-sm text-navy">
          <span className="font-semibold"><Price value={room.price} /></span>
          <span className="text-muted"> / night</span>
        </p>
        <ReserveButton href={reserveHref} />
      </div>

      <Dialog open={amenitiesOpen} onOpenChange={setAmenitiesOpen} title="Amenities" description={room.name}>
        <ul className="grid max-h-[50vh] gap-2 overflow-y-auto sm:grid-cols-2">
          {(room.amenities || []).map((item) => (
            <li key={item} className="flex min-h-11 items-center gap-2 text-sm text-navy">
              <Check className="h-4 w-4 text-gold" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </Dialog>

      {openAt >= 0 && (
        <Suspense fallback={null}>
          <BayLightbox
            plugins={["counter", "thumbnails", "zoom"]}
            open
            close={() => setOpenAt(-1)}
            index={openAt}
            slides={slides}
            carousel={{ finite: false }}
            animation={reduce ? { fade: 0, swipe: 0 } : undefined}
            thumbnails={{ border: 2, borderColor: "#F2C078", borderRadius: 8, gap: 8 }}
            styles={{ container: { backgroundColor: "rgba(11, 31, 51, 0.92)" } }}
          />
        </Suspense>
      )}
    </main>
  );
}

function Gallery({ room, onOpen }) {
  const reduce = useReducedMotion();
  const mobile = useMediaQuery(MEDIA_NARROW);
  const [emblaRef, embla] = useEmblaCarousel(peekCarouselOptions(reduce));
  const photos = Array.isArray(room.gallery) && room.gallery.length
    ? room.gallery
    : [{ src: room.image, alt: room.name, label: "The room" }];
  const [lead, ...rest] = photos;

  if (mobile) {
    return (
      <div>
        <PeekViewport emblaRef={emblaRef} embla={embla} reduce={reduce} label={PEEK_REGION.gallery}>
          <ul className={`flex touch-pan-y gap-3 ${reduce ? "" : "cursor-grab active:cursor-grabbing"}`}>
            {photos.map((photo, index) => (
              <li key={photo.label || photo.src} className={PEEK_SLIDE.gallery}>
                <GalleryCell
                  photo={photo}
                  className="aspect-[4/3]"
                  onClick={() => onOpen(index)}
                />
              </li>
            ))}
          </ul>
        </PeekViewport>
        <div className="mt-3 flex gap-2">
          <CircleButton className="h-11 w-11" label="Previous photo" variant="light" onClick={() => embla?.scrollPrev()}>
            <ChevronLeft className="h-4 w-4" />
          </CircleButton>
          <CircleButton className="h-11 w-11" label="Next photo" variant="light" onClick={() => embla?.scrollNext()}>
            <ChevronRight className="h-4 w-4" />
          </CircleButton>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 lg:h-[32rem] lg:grid-cols-4 lg:grid-rows-2">
      <GalleryCell photo={lead} className="col-span-2 row-span-1 aspect-[4/3] lg:row-span-2 lg:aspect-auto lg:h-full" onClick={() => onOpen(0)} />
      {rest.map((photo, index) => (
        <GalleryCell key={photo.label || photo.src} photo={photo} className="aspect-square lg:aspect-auto lg:h-full" onClick={() => onOpen(index + 1)} />
      ))}
    </div>
  );
}

function GalleryCell({ photo, className, onClick }) {
  const reduce = useReducedMotion();
  const [status, setStatus] = useState(IMAGE_STATUS.loading);
  const canOpen = status !== IMAGE_STATUS.error;

  return (
    <div className={`group relative overflow-hidden rounded-2xl ${className}`}>
      <motion.div
        className="absolute inset-0"
        whileHover={reduce ? undefined : { scale: 1.05 }}
        transition={{ duration: duration.reveal, ease: easeTide }}
      >
        <BlurImage src={photo.src} alt={photo.alt} className="h-full w-full" onStatusChange={setStatus} />
      </motion.div>
      {canOpen ? (
        <button
          type="button"
          data-cursor={CURSOR_LABELS.view}
          onClick={onClick}
          aria-label={photo.label}
          className="absolute inset-0 z-[1] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        />
      ) : null}
      <span className="pointer-events-none absolute bottom-2 left-2 z-[2] rounded-full bg-navy/70 px-2.5 py-1 text-[11px] text-white">
        {photo.label}
      </span>
    </div>
  );
}

function ReserveButton({ href, className = "" }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <PillButton
      className={className}
      onClick={() => {
        if (!requireSignedIn(user, navigate, {
          returnTo: href,
          message: "Sign in to reserve this room.",
        })) {
          return;
        }
        navigate(href);
      }}
    >
      Reserve
    </PillButton>
  );
}

function BookingCard({ room, reserveHref }) {
  const { format } = useLocale();
  const mobile = useMediaQuery(MEDIA_NARROW);
  const { checkIn, checkOut, adults, children } = useSearchStay();
  const setRange = useSearchStore((state) => state.setRange);
  const setAdults = useSearchStore((state) => state.setAdults);
  const setChildren = useSearchStore((state) => state.setChildren);
  const setRoomType = useSearchStore((state) => state.setRoomType);
  const [open, setOpen] = useState(false);
  const nights = stayNights(checkIn, checkOut);
  const party = adults + children;
  const capacity = guestCount(room);
  const dateError = isStayRangeValid(checkIn, checkOut) ? "" : RANGE_ERROR;
  const partyError = party > capacity ? `This room sleeps ${capacity}.` : "";
  const total = nights > 0 ? nights * room.price : 0;

  useEffect(() => {
    setRoomType(room.selectLabel);
  }, [room.selectLabel, setRoomType]);

  function chooseRange(next) {
    if (!next?.from) return;
    setRange(next.from, next.to);
    if (next.to) setOpen(false);
  }

  const calendar = (
    <PriceCalendar
      selected={{ from: checkIn, to: checkOut }}
      onSelect={chooseRange}
      numberOfMonths={1}
      defaultMonth={checkIn}
      roomType={room.selectLabel}
      checkIn={checkIn}
      checkOut={checkOut}
    />
  );

  return (
    <div className="rounded-[24px] bg-white p-5 shadow-[0_16px_40px_rgba(7,27,43,0.1)]">
      <p className="font-display text-3xl text-navy">
        <PriceCount value={room.price} /> <span className="font-sans text-base text-muted">/ night</span>
      </p>
      {mobile ? (
        <>
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="mt-4 flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-xl border border-navy/15 px-3 text-left text-sm text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            <CalendarDays className="h-4 w-4 text-gold" aria-hidden="true" />
            <span>
              {formatDate(checkIn, "d MMM")} – {formatDate(checkOut, "d MMM yyyy")}
            </span>
          </button>
          <Drawer.Root open={open} onOpenChange={setOpen} shouldScaleBackground={false}>
            <Drawer.Portal>
              <Drawer.Overlay className="fixed inset-0 z-[80] bg-navy/50" />
              <Drawer.Content className="fixed inset-x-0 bottom-0 z-[90] flex max-h-[92vh] flex-col rounded-t-2xl bg-white outline-none">
                <Drawer.Handle className="mx-auto mt-3 mb-2 h-1.5 w-12 rounded-full bg-navy/15" />
                <Drawer.Title className="px-4 font-display text-2xl text-navy">{AVAILABILITY_COPY.datesTitle}</Drawer.Title>
                <div className="mt-3 overflow-y-auto px-4 pb-6">{calendar}</div>
              </Drawer.Content>
            </Drawer.Portal>
          </Drawer.Root>
        </>
      ) : (
        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Trigger asChild>
            <button
              type="button"
              className="mt-4 flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-xl border border-navy/15 px-3 text-left text-sm text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              <CalendarDays className="h-4 w-4 text-gold" aria-hidden="true" />
              <span>
                {formatDate(checkIn, "d MMM")} – {formatDate(checkOut, "d MMM yyyy")}
              </span>
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content sideOffset={8} className="z-[80] max-h-[min(88vh,36rem)] overflow-y-auto rounded-2xl bg-white p-3 shadow-[0_16px_40px_rgba(7,27,43,0.12)]">
              {calendar}
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      )}
      <InlineError id="stay-dates">{dateError}</InlineError>

      <div className="mt-4 grid gap-2">
        <Stepper
          label="Adults"
          value={adults}
          min={GUEST_LIMITS.adults.min}
          max={GUEST_LIMITS.adults.max}
          onChange={setAdults}
        />
        <Stepper
          label="Children"
          value={children}
          min={GUEST_LIMITS.children.min}
          max={GUEST_LIMITS.children.max}
          onChange={setChildren}
        />
      </div>
      <InlineError id="stay-party">{partyError}</InlineError>

      {nights > 0 && (
        <dl className="mt-4 grid gap-2 border-t border-navy/10 pt-4 text-sm text-navy">
          <div className="flex justify-between gap-3">
            <dt className="text-muted">
              {format(room.price)} × {nights} night{nights === 1 ? "" : "s"}
            </dt>
            <dd>{format(total)}</dd>
          </div>
          <div className="flex justify-between gap-3 font-semibold">
            <dt>Total</dt>
            <dd>{format(total)}</dd>
          </div>
          <p className="text-xs text-muted">Before local tax.</p>
        </dl>
      )}

      <div className="mt-5">
        {dateError || partyError ? (
          <button
            type="button"
            disabled
            className="inline-flex h-11 w-full cursor-not-allowed items-center justify-center rounded-full bg-gold/50 text-sm font-semibold text-navy"
          >
            Reserve
          </button>
        ) : (
          <ReserveButton href={reserveHref} className="w-full" />
        )}
      </div>
      <CompareToggle roomId={room.id} className="mt-3 inline-flex min-h-11 scroll-mb-32 cursor-pointer items-center gap-2 text-sm text-navy" />
    </div>
  );
}

function Stepper({ label, value, min, max, onChange }) {
  return (
    <div className="flex min-h-11 items-center justify-between text-sm text-navy">
      <span className="inline-flex items-center gap-2">
        {label === "Adults" ? <Users className="h-4 w-4 text-gold" aria-hidden="true" /> : <BedDouble className="h-4 w-4 text-gold" aria-hidden="true" />}
        {label}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`Fewer ${label.toLowerCase()}`}
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
          className="grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-navy/15 focus-visible:outline-2 focus-visible:outline-gold disabled:opacity-40"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-4 text-center" aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          aria-label={`More ${label.toLowerCase()}`}
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
          className="grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-navy/15 focus-visible:outline-2 focus-visible:outline-gold disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    api("/feedback")
      .then((data) => {
        if (!alive) return;
        setReviews(
          (data.feedback || []).map((row) => ({
            id: String(row.id),
            name: row.guest || "Guest",
            quote: row.comment || row.title || "",
            stars: Number(row.rating) || 5,
          })),
        );
      })
      .catch(() => {
        if (alive) setReviews([]);
      })
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!ready) {
    return (
      <div className="mt-4" aria-busy="true">
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!reviews.length) {
    return (
      <div className="mt-4">
        <EmptyState title="No published reviews yet" text="Guest stories appear here after the desk publishes them." />
      </div>
    );
  }

  const counts = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((review) => review.stars === stars).length,
  }));
  const average = reviews.reduce((sum, review) => sum + review.stars, 0) / reviews.length;

  return (
    <div className="mt-4 grid gap-6 lg:grid-cols-[14rem_1fr]">
      <div>
        <p className="font-display text-5xl text-navy">{average.toFixed(1)}</p>
        <p className="mt-1 text-sm text-muted">{reviews.length} guest stories</p>
        <ul className="mt-4 grid gap-2">
          {counts.map((row) => (
            <li key={row.stars} className="flex items-center gap-2 text-xs text-navy">
              <span className="w-3">{row.stars}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-navy/10">
                <span
                  className="block h-full rounded-full bg-gold"
                  style={{ width: `${reviews.length ? (row.count / reviews.length) * 100 : 0}%` }}
                />
              </span>
              <span className="w-3 text-muted">{row.count}</span>
            </li>
          ))}
        </ul>
      </div>
      <ul className="grid gap-3">
        {reviews.map((review) => (
          <li key={review.id} className="rounded-2xl bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-navy">{review.name}</p>
              <p className="inline-flex items-center gap-0.5 text-gold" aria-label={`${review.stars} stars`}>
                {Array.from({ length: review.stars }, (_, index) => (
                  <Star key={index} className="h-3.5 w-3.5 fill-gold" aria-hidden="true" />
                ))}
              </p>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted">{review.quote}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SimilarRooms({ currentId, reduce, rooms = [] }) {
  const others = useMemo(() => rooms.filter((room) => room.id !== currentId), [currentId, rooms]);
  const [emblaRef, embla] = useEmblaCarousel(peekCarouselOptions(reduce));

  return (
    <section className="pt-14">
      <h2 className="font-display text-2xl text-navy">Similar rooms</h2>
      {others.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="No similar rooms." text="Browse all rooms for another stay.">
            <Link to="/rooms" className="text-sm font-semibold text-navy underline">
              All rooms
            </Link>
          </EmptyState>
        </div>
      ) : (
        <PeekViewport className="mt-4" emblaRef={emblaRef} embla={embla} reduce={reduce} label={PEEK_REGION.similar}>
          <ul className={`flex gap-4 ${reduce ? "" : "cursor-grab active:cursor-grabbing"}`}>
            {others.map((room) => (
              <li key={room.id} className={PEEK_SLIDE.similar}>
                <article className="overflow-hidden rounded-2xl bg-white shadow-[0_16px_40px_rgba(7,27,43,0.08)]">
                  <BlurImage src={room.image} alt={room.name} className="aspect-[4/3] w-full" />
                  <Link
                    to={`/rooms/${room.id}`}
                    data-cursor={CURSOR_LABELS.view}
                    className="block p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                  >
                    <p className="font-display text-lg text-navy">{room.name}</p>
                    <p className="mt-1 text-sm text-muted">
                      <Price value={room.price} /> / night · {room.guests}
                    </p>
                  </Link>
                </article>
              </li>
            ))}
          </ul>
        </PeekViewport>
      )}
    </section>
  );
}
