import { testimonials } from "./testimonials";

export const roomsIntro = {
  eyebrow: "Our Rooms",
  titleLead: "Comfort Redefined with",
  titleAccent: "Ocean Views",
  text: "From cozy sea-view rooms to lavish suites, experience elegance, comfort and breathtaking views from every corner.",
};

const stayShots = {
  view: { src: "/assets/azure-bay/hero/hero-sunset-resort.jpg", alt: "Resort pool and sea at sunset", label: "The view" },
  beach: { src: "/assets/azure-bay/experiences/beach-access.jpg", alt: "Beach chairs at sunset", label: "The beach" },
  pool: { src: "/assets/azure-bay/experiences/infinity-pool.jpg", alt: "Infinity pool", label: "The pool" },
  dining: { src: "/assets/azure-bay/experiences/ocean-view-dining.jpg", alt: "Ocean dining terrace", label: "Dining" },
};

export const rooms = [
  {
    id: "deluxe-sea-view",
    name: "Deluxe Sea View Room",
    price: 120,
    guests: "2 Guests",
    bed: "King Bed",
    badge: "Most Popular",
    remaining: 2,
    summary: "A king room with linen, warm wood and doors that open onto the sea.",
    image: "/assets/azure-bay/rooms/deluxe-sea-view.jpg",
    selectLabel: "Deluxe Room",
    specs: ["Sea doors", "Linen", "Warm wood"],
    amenities: ["Sea view", "Beachfront", "Infinity pool", "24/7 concierge", "Ocean dining", "King bed", "Linen", "Sea doors"],
    gallery: [
      { src: "/assets/azure-bay/rooms/deluxe-sea-view.jpg", alt: "Deluxe sea view room", label: "The room" },
      stayShots.view,
      stayShots.beach,
      stayShots.pool,
      stayShots.dining,
    ],
  },
  {
    id: "premium-ocean-suite",
    name: "Premium Ocean Suite",
    price: 220,
    guests: "4 Guests",
    bed: "King Bed",
    summary: "A wider suite with a sitting room, beams and a long ocean window.",
    image: "/assets/azure-bay/rooms/premium-ocean-suite.jpg",
    selectLabel: "Premium Ocean Suite",
    specs: ["Sitting room", "Beams", "Ocean window"],
    amenities: ["Sea view", "Beachfront", "Infinity pool", "24/7 concierge", "Ocean dining", "King bed", "Sitting room", "Ocean window"],
    gallery: [
      { src: "/assets/azure-bay/rooms/premium-ocean-suite.jpg", alt: "Premium ocean suite", label: "The room" },
      stayShots.view,
      stayShots.dining,
      stayShots.pool,
      stayShots.beach,
    ],
  },
  {
    id: "presidential-suite",
    name: "Presidential Suite",
    price: 380,
    guests: "6 Guests",
    bed: "King Bed",
    summary: "The grand suite: marble, a canopy bed and a terrace toward the pool.",
    image: "/assets/azure-bay/rooms/presidential-suite.jpg",
    selectLabel: "Presidential Suite",
    specs: ["Marble", "Canopy bed", "Terrace"],
    amenities: ["Beachfront", "Infinity pool", "24/7 concierge", "Ocean dining", "King bed", "Terrace", "Canopy bed", "Marble"],
    gallery: [
      { src: "/assets/azure-bay/rooms/presidential-suite.jpg", alt: "Presidential suite", label: "The room" },
      stayShots.pool,
      stayShots.view,
      stayShots.dining,
      stayShots.beach,
    ],
  },
  {
    id: "family-suite",
    name: "Family Suite",
    price: 260,
    guests: "6 Guests",
    bed: "Queen Bed",
    summary: "A bright family room with a queen bed, sofa bed and a palm-framed view.",
    image: "/assets/azure-bay/rooms/family-suite.jpg",
    selectLabel: "Family Suite",
    specs: ["Queen bed", "Sofa bed", "Palm view"],
    amenities: ["Beachfront", "Infinity pool", "24/7 concierge", "Ocean dining", "Queen bed", "Sofa bed", "Palm view"],
    gallery: [
      { src: "/assets/azure-bay/rooms/family-suite.jpg", alt: "Family suite", label: "The room" },
      stayShots.beach,
      stayShots.pool,
      stayShots.view,
      stayShots.dining,
    ],
  },
];

export const priceBounds = {
  min: Math.min(...rooms.map((room) => room.price)),
  max: Math.max(...rooms.map((room) => room.price)),
};

export const amenityChoices = [...new Set(rooms.flatMap((room) => room.amenities))].sort((a, b) => a.localeCompare(b));

export const bedChoices = ["King Bed", "Queen Bed"];

export function guestCount(room) {
  return Number.parseInt(room.guests, 10) || 1;
}

export const stayPolicies = [
  { value: "dates", title: "Dates", body: "The stay begins on the check-in date and ends on the check-out date. Check-out is later than check-in." },
  { value: "rate", title: "Room rate", body: "The rate is per night for the room type, before local tax." },
  { value: "party", title: "Party size", body: "The party size must fit the room." },
  { value: "changes", title: "Changes", body: "Date or room changes depend on what is still open for those nights." },
];

export const stayReviews = testimonials.map((story) => ({
  id: story.id,
  name: story.name,
  city: story.city,
  quote: story.quote,
  stars: 5,
}));
