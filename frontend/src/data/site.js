export const navLinks = [
  { label: "Home", href: "/" },
  { label: "Rooms", href: "/rooms" },
  { label: "Dining", href: "/dining" },
  { label: "Experiences", href: "/experiences" },
  { label: "Gallery", href: "/gallery" },
  { label: "Location", href: "/location" },
  { label: "Contact", href: "/contact" },
];

export const heroCopy = {
  eyebrow: "Luxury Stays by the Sea",
  titleLead: "Where",
  titleAccent: "Ocean Vibes",
  titleEnd: "Meet Unforgettable Stays",
  text: "Escape to Azure Bay Hotel & Resort — a seaside haven where comfort, luxury and nature come together for the perfect getaway.",
  image: "/assets/azure-bay/hero/hero-sunset-resort.jpg",
  poster: "/assets/azure-bay/hero/hero-poster.jpg",
};

export const weather = {
  temp: "28°C",
  condition: "Clear Sky",
  place: "Azure Bay, Maldives",
};

export const heroSlides = [
  { id: "01", position: "center center" },
  { id: "02", position: "68% center" },
  { id: "03", position: "38% center" },
];

export const features = [
  {
    icon: "waves",
    title: "Beachfront Location",
    text: "Step out to golden sands and endless blue.",
  },
  {
    icon: "bed",
    title: "Luxury Rooms & Suites",
    text: "Designed for your comfort and relaxation.",
  },
  {
    icon: "dining",
    title: "World-Class Dining",
    text: "Fresh flavors, ocean views, exceptional taste.",
  },
  {
    icon: "spa",
    title: "Spa & Wellness",
    text: "Rejuvenate your mind, body and soul.",
  },
  {
    icon: "pool",
    title: "Infinity Pool",
    text: "Swim with a view like no other.",
  },
  {
    icon: "concierge",
    title: "24/7 Concierge",
    text: "Your comfort, our priority.",
  },
];

function stayIsoFromToday(offsetDays) {
  const day = new Date();
  day.setHours(12, 0, 0, 0);
  day.setDate(day.getDate() + offsetDays);
  const y = day.getFullYear();
  const m = String(day.getMonth() + 1).padStart(2, "0");
  const d = String(day.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const defaultStay = {
  checkIn: stayIsoFromToday(1),
  checkOut: stayIsoFromToday(5),
  adults: 2,
  children: 0,
  roomType: "Deluxe Room",
};

export const roomTypes = [
  "Deluxe Room",
  "Premium Ocean Suite",
  "Presidential Suite",
  "Family Suite",
];

export const ctaCopy = {
  eyebrow: "Ready for Your Next Escape?",
  titleLead: "Book Your",
  titleAccent: "Stay Today",
  text: "Experience the perfect blend of luxury, comfort and ocean views.",
  image: "/assets/azure-bay/hero/cta-banner-bg.jpg",
};

export const faqs = [
  { label: "What we keep", href: "/privacy", text: "Name, contact details, stay dates and room notes." },
  { label: "How long records stay", href: "/privacy", text: "For the stay and the accounting period that follows." },
  { label: "Stay dates", href: "/terms", text: "Check-out is later than check-in." },
  { label: "Room rate", href: "/terms", text: "The rate is per night for the room type, before local tax." },
  { label: "The desk", href: "/support", text: "The concierge is open all day and night." },
  { label: "Before you arrive", href: "/support", text: "Write with your dates and room type." },
];

export const legalLinks = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Support", href: "/support" },
];
