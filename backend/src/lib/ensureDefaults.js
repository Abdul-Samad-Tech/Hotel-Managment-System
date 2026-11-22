const { Setting, MediaAsset } = require("../models");
const { dayKey } = require("./dates");

function startOfUtcToday() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

const DEFAULT_MEDIA = [
  { key: "hero-sunset", category: "hero", url: "/assets/azure-bay/hero/hero-sunset-resort.jpg", alt: "Infinity pool and resort at sunset", label: "Sunset pool", group: "water", tall: true, sortOrder: 1 },
  { key: "cta-banner", category: "hero", url: "/assets/azure-bay/hero/cta-banner-bg.jpg", alt: "Sunset over the ocean", label: "Horizon", group: "water", sortOrder: 2 },
  { key: "dining-hero", category: "dining", url: "/assets/azure-bay/experiences/ocean-view-dining.jpg", alt: "Beachfront dining terrace", label: "Ocean dining", group: "dining", sortOrder: 1 },
  { key: "experiences-intro", category: "experiences", url: "/assets/azure-bay/experiences/experiences-bg.jpg", alt: "Experiences by the sea", label: "Experiences", sortOrder: 0 },
  { key: "experience-dining", category: "experiences", url: "/assets/azure-bay/experiences/ocean-view-dining.jpg", alt: "Ocean view dining", label: "Ocean View Dining", group: "dining", sortOrder: 1 },
  { key: "experience-pool", category: "experiences", url: "/assets/azure-bay/experiences/infinity-pool.jpg", alt: "Infinity pool", label: "Infinity Pool", group: "pool", sortOrder: 2 },
  { key: "experience-spa", category: "experiences", url: "/assets/azure-bay/experiences/spa-wellness.jpg", alt: "Spa wellness", label: "Spa & Wellness", group: "spa", sortOrder: 3 },
  { key: "experience-beach", category: "experiences", url: "/assets/azure-bay/experiences/beach-access.jpg", alt: "Private beach", label: "Beach Access", group: "beach", sortOrder: 4 },
  { key: "gallery-pool", category: "gallery", url: "/assets/azure-bay/hero/hero-sunset-resort.jpg", alt: "Infinity pool and resort at sunset", label: "Sunset pool", group: "water", tall: true, sortOrder: 1 },
  { key: "gallery-dining", category: "gallery", url: "/assets/azure-bay/experiences/ocean-view-dining.jpg", alt: "Beachfront dining terrace at sunset", label: "Ocean dining", group: "dining", sortOrder: 2 },
  { key: "gallery-infinity", category: "gallery", url: "/assets/azure-bay/experiences/infinity-pool.jpg", alt: "Turquoise infinity pool", label: "Infinity pool", group: "water", sortOrder: 3 },
  { key: "gallery-spa", category: "gallery", url: "/assets/azure-bay/experiences/spa-wellness.jpg", alt: "Spa flower, candles and folded towels", label: "Spa", group: "spa", tall: true, sortOrder: 4 },
  { key: "gallery-beach", category: "gallery", url: "/assets/azure-bay/experiences/beach-access.jpg", alt: "Private beach chairs at sunset", label: "Private beach", group: "water", sortOrder: 5 },
  { key: "gallery-deluxe", category: "gallery", url: "/assets/azure-bay/rooms/deluxe-sea-view.jpg", alt: "Deluxe sea view room", label: "Deluxe room", group: "rooms", sortOrder: 6 },
  { key: "gallery-premium", category: "gallery", url: "/assets/azure-bay/rooms/premium-ocean-suite.jpg", alt: "Premium ocean suite", label: "Ocean suite", group: "rooms", tall: true, sortOrder: 7 },
  { key: "gallery-presidential", category: "gallery", url: "/assets/azure-bay/rooms/presidential-suite.jpg", alt: "Presidential suite at sunset", label: "Presidential suite", group: "rooms", sortOrder: 8 },
  { key: "gallery-family", category: "gallery", url: "/assets/azure-bay/rooms/family-suite.jpg", alt: "Family suite interior", label: "Family suite", group: "rooms", sortOrder: 9 },
  { key: "gallery-horizon", category: "gallery", url: "/assets/azure-bay/hero/cta-banner-bg.jpg", alt: "Sunset over the ocean", label: "Horizon", group: "water", sortOrder: 10 },
  { key: "room-deluxe-sea-view", category: "rooms", url: "/assets/azure-bay/rooms/deluxe-sea-view.jpg", alt: "Deluxe sea view room", label: "Deluxe Room", roomTypeSlug: "deluxe-sea-view", sortOrder: 1 },
  { key: "room-premium-ocean-suite", category: "rooms", url: "/assets/azure-bay/rooms/premium-ocean-suite.jpg", alt: "Premium ocean suite", label: "Premium Ocean Suite", roomTypeSlug: "premium-ocean-suite", sortOrder: 2 },
  { key: "room-presidential-suite", category: "rooms", url: "/assets/azure-bay/rooms/presidential-suite.jpg", alt: "Presidential suite", label: "Presidential Suite", roomTypeSlug: "presidential-suite", sortOrder: 3 },
  { key: "room-family-suite", category: "rooms", url: "/assets/azure-bay/rooms/family-suite.jpg", alt: "Family suite", label: "Family Suite", roomTypeSlug: "family-suite", sortOrder: 4 },
];

const DEFAULT_STAY_POLICIES = [
  { id: "dates", title: "Dates", body: "The stay begins on the check-in date and ends on the check-out date. Check-out is later than check-in." },
  { id: "rate", title: "Room rate", body: "The rate is per night for the room type, before local tax." },
  { id: "party", title: "Party size", body: "The party size must fit the room." },
  { id: "changes", title: "Changes", body: "Date or room changes depend on what is still open for those nights." },
];

async function ensureBookingSettings() {
  const today = startOfUtcToday();
  const openTo = new Date(today);
  openTo.setUTCFullYear(openTo.getUTCFullYear() + 1);
  const defaults = [
    ["bookingOpenFrom", dayKey(today)],
    ["bookingOpenTo", dayKey(openTo)],
    ["taxRate", 0.1],
    ["hotelName", "Azure Bay Hotel & Resort"],
    ["currency", "USD"],
    ["stayPolicies", DEFAULT_STAY_POLICIES],
  ];
  for (const [key, value] of defaults) {
    await Setting.updateOne({ key }, { $setOnInsert: { key, value } }, { upsert: true });
  }
}

async function ensureMediaAssets() {
  for (const row of DEFAULT_MEDIA) {
    await MediaAsset.updateOne(
      { key: row.key },
      {
        $setOnInsert: {
          ...row,
          storage: "url",
          active: true,
        },
      },
      { upsert: true },
    );
  }
}

async function ensurePublicDefaults() {
  await ensureBookingSettings();
  await ensureMediaAssets();
  const { ensureDiningDefaults } = require("./ensureDining");
  await ensureDiningDefaults();
}

module.exports = { ensurePublicDefaults, ensureBookingSettings, ensureMediaAssets, DEFAULT_MEDIA, DEFAULT_STAY_POLICIES };
