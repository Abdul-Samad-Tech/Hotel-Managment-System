import { useEffect, useMemo, useState } from "react";
import { galleryImages } from "../data/gallery";
import { experienceCards, experiencesIntro, beachAccess } from "../data/experiences";
import { api } from "../lib/api";

function fallbackByCategory(category) {
  if (category === "gallery") return galleryImages.map((img, index) => ({ ...img, key: `gallery-${index}`, category: "gallery" }));
  if (category === "experiences") {
    return [
      { key: "experiences-intro", category: "experiences", url: experiencesIntro.image, label: "Experiences", alt: "Experiences" },
      ...experienceCards.map((card) => ({
        key: `experience-${card.id}`,
        category: "experiences",
        url: card.image,
        label: card.title,
        alt: card.title,
        group: card.id,
      })),
      {
        key: "experience-beach",
        category: "experiences",
        url: beachAccess.image,
        label: beachAccess.title,
        alt: beachAccess.title,
        group: "beach",
      },
    ];
  }
  if (category === "dining") {
    const dining = experienceCards.find((card) => card.id === "dining");
    return dining
      ? [{ key: "dining-hero", category: "dining", url: dining.image, label: dining.title, alt: dining.title }]
      : [];
  }
  return [];
}

export function useSiteMedia(category) {
  const [media, setMedia] = useState(() => fallbackByCategory(category));
  const [source, setSource] = useState("static");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const query = category ? `?category=${encodeURIComponent(category)}` : "";
    api(`/content/media${query}`)
      .then((data) => {
        if (!active) return;
        const rows = (data.media || []).map((row) => ({
          src: row.url,
          url: row.url,
          alt: row.alt || row.label || "",
          label: row.label || row.alt || "Photo",
          group: row.group || "",
          tall: Boolean(row.tall),
          key: row.key,
          category: row.category,
          roomTypeSlug: row.roomTypeSlug || "",
        }));
        if (rows.length) {
          setMedia(rows);
          setSource("api");
        } else {
          setMedia(fallbackByCategory(category));
          setSource("static");
        }
        setReady(true);
      })
      .catch(() => {
        if (!active) return;
        setMedia(fallbackByCategory(category));
        setSource("static");
        setReady(true);
      });
    return () => {
      active = false;
    };
  }, [category]);

  const byKey = useMemo(() => Object.fromEntries(media.map((item) => [item.key, item])), [media]);

  return { media, byKey, source, ready };
}
