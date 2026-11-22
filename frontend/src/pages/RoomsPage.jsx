import { ArrowRight, BedDouble, GripVertical, Heart, LayoutGrid, List, Minus, Plus, SlidersHorizontal, Users, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { amenityChoices, bedChoices, guestCount, roomsIntro } from "../data/rooms";
import { heroCopy } from "../data/site";
import { useRoomCatalog } from "../hooks/use-room-catalog";
import { catalogPriceBounds } from "../lib/roomCatalog";
import { IMAGE_STATUS } from "../lib/blur-image.constant";
import { LIST_EMPTY } from "../lib/list-empty.constant";
import { duration, easeTide, tideDelay, viewportOnce } from "../lib/motion";
import { CURSOR_LABELS } from "../lib/cursor.constant";
import { useDoubleTap } from "../hooks/use-double-tap";
import { useWishlistHas } from "../store/wishlistStore";
import { PageBanner } from "../components/layout/PageBanner";
import { PriceCount } from "../components/ui/Price";
import { CircleButton } from "../components/ui/Buttons";
import { Badge } from "../components/ui/Badge";
import { CompareToggle } from "../components/compare/CompareToggle";
import { useCompareDrag } from "../components/compare/use-compare-drag";
import { QuizEntry } from "../components/quiz/QuizEntry";
import { Drawer } from "../components/ui/Drawer";
import { BlurImage } from "../components/ui/BlurImage";
import { RoomsEmptyState } from "../components/ui/SmartEmpty";
import { Select } from "../components/ui/Select";
import { RoomCardSkeleton, SkeletonSet } from "../components/ui/Skeleton";
import { Slider } from "../components/ui/Slider";
import { toggleWishlistWithUndo } from "../components/wishlist/wishlist-actions";
import { useLocale } from "../context/LocaleContext";
import { COMPARE_COPY } from "../store/compare.constant";
import { useCompareIds, useCompareStore } from "../store/compare.store";
import { PARTY_MAX } from "../store/search.constant";
import { useSearchStay, useSearchStore } from "../store/searchStore";
import { parseStayDate, toStayIso } from "../lib/stay-date";

const sortOptions = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "guests", label: "Guests" },
];

export function RoomsPage() {
  const reduce = useReducedMotion();
  const { format } = useLocale();
  const [params, setParams] = useSearchParams();
  const query = (params.get("q") || "").trim();
  const { rooms, ready: catalogReady } = useRoomCatalog();
  const priceBounds = catalogPriceBounds(rooms);
  const [ready, setReady] = useState(false);
  const [price, setPrice] = useState([0, 9999]);
  const [amenities, setAmenities] = useState([]);
  const [bed, setBed] = useState("any");
  const adults = useSearchStore((state) => state.adults);
  const children = useSearchStore((state) => state.children);
  const setPartyTotal = useSearchStore((state) => state.setPartyTotal);
  const setRange = useSearchStore((state) => state.setRange);
  const { checkIn, checkOut } = useSearchStay();
  const guests = adults + children;
  const [sort, setSort] = useState("featured");
  const [layout, setLayout] = useState("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const compare = useCompareIds();
  const setPanelOpen = useCompareStore((state) => state.setPanelOpen);

  useEffect(() => {
    if (!catalogReady || !rooms.length) return;
    setPrice([priceBounds.min, priceBounds.max]);
  }, [catalogReady, rooms, priceBounds.min, priceBounds.max]);

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

  const list = useMemo(() => {
    const needle = query.toLowerCase();
    const next = rooms.filter((room) => {
      const text = `${room.name} ${room.bed} ${room.selectLabel}`.toLowerCase();
      if (needle && !text.includes(needle)) return false;
      if (room.price < price[0] || room.price > price[1]) return false;
      if (guestCount(room) < guests) return false;
      if (bed !== "any" && room.bed !== bed) return false;
      if (amenities.some((item) => !room.amenities.includes(item))) return false;
      return true;
    });
    const ranked = [...next];
    if (sort === "price-asc") ranked.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") ranked.sort((a, b) => b.price - a.price);
    if (sort === "guests") ranked.sort((a, b) => guestCount(b) - guestCount(a));
    return ranked;
  }, [amenities, bed, guests, price, query, rooms, sort]);

  const chips = [];
  if (query) chips.push({ id: "q", label: `“${query}”`, clear: () => setParams({}) });
  if (price[0] !== priceBounds.min || price[1] !== priceBounds.max) {
    chips.push({ id: "price", label: `${format(price[0])}–${format(price[1])}`, clear: () => setPrice([priceBounds.min, priceBounds.max]) });
  }
  if (bed !== "any") chips.push({ id: "bed", label: bed, clear: () => setBed("any") });
  if (guests > 1) chips.push({ id: "guests", label: `${guests}+ guests`, clear: () => setPartyTotal(1) });
  amenities.forEach((item) => {
    chips.push({ id: item, label: item, clear: () => setAmenities((current) => current.filter((name) => name !== item)) });
  });

  function clearAll() {
    setPrice([priceBounds.min, priceBounds.max]);
    setAmenities([]);
    setBed("any");
    setPartyTotal(1);
    setSort("featured");
    if (query) setParams({});
  }

  function toggleAmenity(name) {
    setAmenities((current) => (current.includes(name) ? current.filter((item) => item !== name) : [...current, name]));
  }

  return (
    <main>
      <PageBanner
        eyebrow={roomsIntro.eyebrow}
        title={roomsIntro.titleLead}
        accent={roomsIntro.titleAccent}
        text={roomsIntro.text}
        image={heroCopy.image}
      />
      <section className="bg-cream py-14">
        <div className="page-wrap lg:grid lg:grid-cols-[16rem_1fr] lg:items-start lg:gap-8">
          <aside className="sticky top-24 hidden lg:block">
            <FilterFields
              fieldName="bed-desk"
              price={price}
              setPrice={setPrice}
              priceBounds={priceBounds}
              amenities={amenities}
              toggleAmenity={toggleAmenity}
              bed={bed}
              setBed={setBed}
              guests={guests}
              setGuests={setPartyTotal}
            />
          </aside>
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-navy/15 bg-white px-4 text-sm font-semibold text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold lg:hidden"
                onClick={() => setFiltersOpen(true)}
              >
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                Filters
              </button>
              <p className="text-sm text-muted" role="status">
                {list.length} room{list.length === 1 ? "" : "s"}
                {query ? ` for “${query}”` : ""}
              </p>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <div className="w-44">
                  <Select id="room-sort" value={sort} onValueChange={setSort} options={sortOptions} />
                </div>
                <div className="flex rounded-full bg-white p-1 shadow-[0_8px_24px_rgba(7,27,43,0.06)]">
                  <LayoutButton pressed={layout === "grid"} label="Grid" onClick={() => setLayout("grid")}>
                    <LayoutGrid className="h-4 w-4" />
                  </LayoutButton>
                  <LayoutButton pressed={layout === "list"} label="List" onClick={() => setLayout("list")}>
                    <List className="h-4 w-4" />
                  </LayoutButton>
                </div>
                <QuizEntry tone="toolbar" />
                <button
                  type="button"
                  disabled={compare.length < 2}
                  onClick={() => setPanelOpen(true)}
                  className="inline-flex h-11 cursor-pointer items-center rounded-full bg-navy px-4 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {COMPARE_COPY.action}
                  {compare.length ? ` (${compare.length})` : ""}
                </button>
              </div>
            </div>

            {chips.length > 0 && (
              <div className="mb-5 flex flex-wrap items-center gap-2">
                {chips.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={chip.clear}
                    className="inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-full bg-white px-3 text-sm text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                  >
                    {chip.label}
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="sr-only">Remove {chip.label}</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={clearAll}
                  className="inline-flex h-11 cursor-pointer items-center px-2 text-sm font-semibold text-navy underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                >
                  {LIST_EMPTY.roomsClear}
                </button>
              </div>
            )}

            {!ready ? (
              <SkeletonSet label={LIST_EMPTY.roomsLoading}>
                <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {rooms.map((room) => (
                    <li key={room.id}>
                      <RoomCardSkeleton />
                    </li>
                  ))}
                </ul>
              </SkeletonSet>
            ) : list.length === 0 ? (
              <RoomsEmptyState
                query={query}
                checkInIso={toStayIso(checkIn)}
                checkOutIso={toStayIso(checkOut)}
                onClearFilters={clearAll}
                onSwitchDates={(alt) => {
                  if (alt) {
                    const from = parseStayDate(alt.checkInIso);
                    const to = parseStayDate(alt.checkOutIso);
                    if (from && to) setRange(from, to);
                  }
                  document.getElementById("page-banner")?.scrollIntoView({ block: "start" });
                }}
              />
            ) : (
              <LayoutGroup>
                <ul className={layout === "grid" ? "grid gap-5 sm:grid-cols-2 xl:grid-cols-3" : "grid gap-4"}>
                  {list.map((room, index) => (
                    <RoomResultCard key={room.id} room={room} layout={layout} reduce={reduce} index={index} />
                  ))}
                </ul>
              </LayoutGroup>
            )}
          </div>
        </div>
      </section>

      <Drawer open={filtersOpen} onOpenChange={setFiltersOpen} title="Filters">
        <div className="max-h-[65vh] overflow-y-auto pr-1">
          <FilterFields
            fieldName="bed-drawer"
            price={price}
            setPrice={setPrice}
            priceBounds={priceBounds}
            amenities={amenities}
            toggleAmenity={toggleAmenity}
            bed={bed}
            setBed={setBed}
            guests={guests}
            setGuests={setPartyTotal}
          />
        </div>
      </Drawer>
    </main>
  );
}

function RoomResultCard({ room, layout, reduce, index }) {
  const { bind, fine, cursorLabel } = useCompareDrag(room.id);

  return (
    <motion.li
      {...bind}
      layout={reduce ? false : true}
      data-cursor={cursorLabel}
      className={`relative overflow-hidden rounded-2xl bg-white shadow-[0_16px_40px_rgba(7,27,43,0.1)] ${fine ? "touch-none" : ""} ${layout === "list" ? "sm:grid sm:grid-cols-[17rem_1fr]" : ""}`}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportOnce}
      transition={{
        layout: { duration: duration.ui, ease: easeTide },
        duration: reduce ? duration.micro : index % 2 === 0 ? duration.ui : duration.reveal,
        delay: reduce ? 0 : tideDelay(index),
        ease: easeTide,
      }}
    >
      <RoomPhoto room={room} reduce={reduce} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-display text-lg text-navy">{room.name}</h2>
          {fine ? (
            <span
              aria-hidden="true"
              title={COMPARE_COPY.dragHandle}
              className="mt-0.5 hidden h-11 w-11 shrink-0 place-items-center rounded-full text-navy/45 lg:grid"
            >
              <GripVertical className="h-4 w-4" />
            </span>
          ) : null}
        </div>
        <p className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" aria-hidden="true" /> {room.guests}
          </span>
          <span className="inline-flex items-center gap-1">
            <BedDouble className="h-3.5 w-3.5" aria-hidden="true" /> {room.bed}
          </span>
        </p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm text-navy">
            <PriceCount value={room.price} className="font-semibold" />
            <span className="text-muted"> / night</span>
          </p>
          <CircleButton href={`/rooms/${room.id}`} label={`View ${room.name}`} className="h-8 w-8">
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
        <CompareToggle roomId={room.id} />
      </div>
    </motion.li>
  );
}

function LayoutButton({ pressed, label, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={label}
      onClick={onClick}
      className={`grid h-11 w-11 cursor-pointer place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${pressed ? "bg-gold text-navy" : "text-navy/50"}`}
    >
      {children}
    </button>
  );
}

function FilterFields({ fieldName, price, setPrice, priceBounds, amenities, toggleAmenity, bed, setBed, guests, setGuests }) {
  const { format } = useLocale();
  const min = Number.isFinite(priceBounds?.min) ? priceBounds.min : 0;
  const max = Number.isFinite(priceBounds?.max) ? priceBounds.max : 9999;
  return (
    <div className="grid gap-6 rounded-2xl bg-white p-4 shadow-[0_16px_40px_rgba(7,27,43,0.06)]">
      <div>
        <div className="mb-2 flex items-center justify-between text-sm font-semibold text-navy">
          <span>Price / night</span>
          <span className="font-normal text-muted">
            {format(price[0])}–{format(price[1])}
          </span>
        </div>
        <Slider min={min} max={max} step={10} value={price} onValueChange={setPrice} label="Nightly price" />
      </div>
      <fieldset>
        <legend className="mb-1 text-sm font-semibold text-navy">Amenities</legend>
        <div className="grid">
          {amenityChoices.map((name) => (
            <label key={name} className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-navy">
              <input
                type="checkbox"
                className="h-4 w-4 accent-gold"
                checked={amenities.includes(name)}
                onChange={() => toggleAmenity(name)}
              />
              {name}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-1 text-sm font-semibold text-navy">Bed type</legend>
        {["any", ...bedChoices].map((value) => (
          <label key={value} className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-navy">
            <input
              type="radio"
              name={fieldName}
              className="h-4 w-4 accent-gold"
              checked={bed === value}
              onChange={() => setBed(value)}
            />
            {value === "any" ? "Any bed" : value}
          </label>
        ))}
      </fieldset>
      <div className="flex min-h-11 items-center justify-between">
        <span className="text-sm font-semibold text-navy">Guests</span>
        <div className="flex items-center gap-2">
          <StepButton label="Fewer guests" disabled={guests <= 1} onClick={() => setGuests(Math.max(1, guests - 1))}>
            <Minus className="h-4 w-4" />
          </StepButton>
          <span className="w-6 text-center text-sm text-navy" aria-live="polite">
            {guests}
          </span>
          <StepButton
            label="More guests"
            disabled={guests >= PARTY_MAX}
            onClick={() => setGuests(Math.min(PARTY_MAX, guests + 1))}
          >
            <Plus className="h-4 w-4" />
          </StepButton>
        </div>
      </div>
    </div>
  );
}

function StepButton({ label, disabled, onClick, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-navy/15 text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function RoomPhoto({ room, reduce }) {
  const [shot, setShot] = useState(0);
  const [status, setStatus] = useState(IMAGE_STATUS.loading);
  const photos = room.gallery;
  const current = photos[shot] || { src: room.image, alt: room.name };
  const canOpen = status !== IMAGE_STATUS.error;
  const saved = useWishlistHas(room.id);
  const skipNav = useRef(false);
  const onDoubleTap = useDoubleTap(() => {
    skipNav.current = true;
    toggleWishlistWithUndo(room.id);
  });

  return (
    <div className="group relative aspect-[4/3] overflow-hidden">
      <motion.div
        className="h-full w-full"
        initial="rest"
        whileHover="hover"
        variants={{ rest: { scale: 1 }, hover: { scale: reduce ? 1 : 1.05 } }}
        transition={{ duration: duration.reveal, ease: easeTide }}
      >
        <BlurImage
          key={current.src}
          src={current.src}
          alt={current.alt}
          className="h-full w-full"
          onStatusChange={setStatus}
        />
      </motion.div>
      {canOpen ? (
        <Link
          to={`/rooms/${room.id}`}
          data-cursor={CURSOR_LABELS.view}
          className="absolute inset-0 z-[1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          onPointerUp={onDoubleTap}
          onClick={(event) => {
            if (!skipNav.current) return;
            event.preventDefault();
            skipNav.current = false;
          }}
        >
          <span className="sr-only">{room.name}</span>
        </Link>
      ) : null}
      <button
        type="button"
        aria-pressed={saved}
        aria-label={saved ? `Remove ${room.name} from wishlist` : `Save ${room.name}`}
        onClick={() => toggleWishlistWithUndo(room.id)}
        className="absolute top-3 right-3 z-[3] grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-navy/55 text-white hover:bg-navy focus-visible:outline-2 focus-visible:outline-gold"
      >
        <Heart className={`h-4 w-4 ${saved ? "fill-gold text-gold" : ""}`} />
      </button>
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1] bg-navy opacity-0 transition-opacity duration-300 group-hover:opacity-[0.16]" />
      <div className="pointer-events-none absolute top-3 left-3 z-[2] flex flex-wrap gap-1.5">
        {room.badge ? <Badge>{room.badge}</Badge> : null}
        {room.remaining != null && room.remaining <= 2 ? <Badge tone="navy">Only {room.remaining} left</Badge> : null}
      </div>
      {photos.length > 1 && (
        <div className="absolute inset-x-0 bottom-2 z-[2] flex justify-center gap-1 opacity-100 transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100">
          {photos.map((photo, index) => (
            <button
              key={photo.label}
              type="button"
              aria-label={`${room.name}, ${photo.label}`}
              aria-pressed={shot === index}
              onClick={() => {
                setStatus(IMAGE_STATUS.loading);
                setShot(index);
              }}
              className="grid h-11 w-6 cursor-pointer place-items-center focus-visible:outline-2 focus-visible:outline-gold"
            >
              <span className={`h-1.5 w-1.5 rounded-full ${shot === index ? "bg-gold" : "bg-white/80"}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
