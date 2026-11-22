import { lazy, Suspense, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { galleryFilters } from "../data/gallery";
import { heroCopy } from "../data/site";
import { useSiteMedia } from "../hooks/use-site-media";
import { IMAGE_STATUS } from "../lib/blur-image.constant";
import { LIST_EMPTY } from "../lib/list-empty.constant";
import { duration, easeTide, tideDelay, viewportOnce } from "../lib/motion";
import { CURSOR_LABELS } from "../lib/cursor.constant";
import { PageBanner } from "../components/layout/PageBanner";
import { BlurImage } from "../components/ui/BlurImage";
import { EmptyState } from "../components/ui/EmptyState";
import { Tabs } from "../components/ui/Tabs";

const BayLightbox = lazy(() => import("../components/ui/BayLightbox.jsx").then((module) => ({ default: module.BayLightbox })));

function GalleryShot({ image, onOpen }) {
  const [status, setStatus] = useState(IMAGE_STATUS.loading);
  const canOpen = status !== IMAGE_STATUS.error;
  const frame = image.tall ? "aspect-[3/4]" : "aspect-[4/3]";

  return (
    <div className="group relative overflow-hidden rounded-2xl">
      <BlurImage
        src={image.src}
        alt={image.alt}
        className={`w-full ${frame}`}
        onStatusChange={setStatus}
      />
      {canOpen ? (
        <button
          type="button"
          data-cursor={CURSOR_LABELS.view}
          className="absolute inset-0 z-[1] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          aria-label={`Open ${image.label}`}
          onClick={onOpen}
        />
      ) : null}
      <p className="pointer-events-none absolute bottom-3 left-3 z-[2] rounded-full bg-navy/70 px-3 py-1 text-xs text-white">{image.label}</p>
    </div>
  );
}

export function GalleryPage() {
  const reduce = useReducedMotion();
  const { media: galleryImages } = useSiteMedia("gallery");
  const [filter, setFilter] = useState("all");
  const [openAt, setOpenAt] = useState(-1);
  const photos = useMemo(
    () => (filter === "all" ? galleryImages : galleryImages.filter((image) => image.group === filter)),
    [filter, galleryImages],
  );
  const slides = photos.map((image) => ({ src: image.src, alt: image.alt, thumbnail: image.src }));

  return (
    <main>
      <PageBanner
        eyebrow="The resort"
        title="A gallery of"
        accent="golden hours"
        text="Rooms, water and the long light that sits on the deck."
        image={heroCopy.image}
      />
      <section className="bg-cream py-14">
        <div className="page-wrap">
          <div className="overflow-x-auto">
            <Tabs
              value={filter}
              onValueChange={(value) => {
                setFilter(value);
                setOpenAt(-1);
              }}
              items={galleryFilters}
              layoutId="gallery-filter"
            />
          </div>
          {photos.length === 0 ? (
            <div className="mt-8">
              <EmptyState title={LIST_EMPTY.galleryTitle} text={LIST_EMPTY.galleryText}>
                <button
                  type="button"
                  onClick={() => {
                    setFilter("all");
                    setOpenAt(-1);
                  }}
                  className="inline-flex h-11 cursor-pointer items-center rounded-full bg-gold px-5 text-sm font-semibold text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                >
                  {LIST_EMPTY.galleryAll}
                </button>
              </EmptyState>
            </div>
          ) : (
            <ul className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3">
              {photos.map((image, index) => (
                <motion.li
                  key={image.src}
                  className="mb-4 break-inside-avoid"
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewportOnce}
                  transition={{
                    duration: reduce ? duration.micro : duration.ui,
                    delay: reduce ? 0 : tideDelay(index % 6),
                    ease: easeTide,
                  }}
                >
                  <GalleryShot image={image} onOpen={() => setOpenAt(index)} />
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </section>
      {openAt >= 0 && (
        <Suspense fallback={null}>
          <BayLightbox
            plugins={["counter", "thumbnails", "zoom"]}
            open
            close={() => setOpenAt(-1)}
            index={openAt}
            slides={slides}
            carousel={{ finite: false }}
            controller={{ closeOnBackdropClick: true }}
            animation={reduce ? { fade: 0, swipe: 0 } : undefined}
            zoom={{ maxZoomPixelRatio: 2, scrollToZoom: true }}
            thumbnails={{ border: 2, borderColor: "#F2C078", borderRadius: 8, gap: 8 }}
            styles={{ container: { backgroundColor: "rgba(11, 31, 51, 0.92)" } }}
          />
        </Suspense>
      )}
    </main>
  );
}
