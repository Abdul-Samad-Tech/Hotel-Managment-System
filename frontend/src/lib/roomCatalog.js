import { rooms as staticRooms } from "../data/rooms";
import { api } from "./api";

function fallbackGallery(image, name) {
  return [{ src: image, alt: name, label: "The room" }];
}

function normalizeGallery(list, image, name, fallback) {
  if (Array.isArray(list) && list.length) {
    return list.map((item, index) => {
      if (typeof item === "string") {
        return { src: item, alt: name || "Room", label: index === 0 ? "The room" : `Photo ${index + 1}` };
      }
      return {
        src: item.src || item.url || image,
        alt: item.alt || name || "Room",
        label: item.label || (index === 0 ? "The room" : `Photo ${index + 1}`),
      };
    });
  }
  if (fallback?.gallery?.length) return fallback.gallery;
  return fallbackGallery(image, name || "Room");
}

export function mapApiTypeToRoom(type, fallback = {}) {
  const image = type.image || fallback.image || "/assets/azure-bay/rooms/deluxe-sea-view.jpg";
  const maxGuests = Number(type.maxAdults || 0) + Number(type.maxChildren || 0) || guestHint(fallback.guests) || 2;
  return {
    id: type.slug || fallback.id || String(type.id),
    name: type.name || fallback.name,
    price: Number(type.baseRate ?? fallback.price ?? 0),
    guests: `${maxGuests} Guests`,
    bed: type.bedType || fallback.bed || "King Bed",
    badge: fallback.badge,
    remaining: fallback.remaining,
    summary: type.description || fallback.summary || "",
    image,
    selectLabel: type.name || fallback.selectLabel,
    amenities: Array.isArray(type.amenities) ? type.amenities : [],
    specs: fallback.specs || (Array.isArray(type.amenities) ? type.amenities.slice(0, 3) : []),
    gallery: normalizeGallery(type.gallery, image, type.name || fallback.name, fallback),
  };
}

function guestHint(label) {
  return Number.parseInt(String(label || ""), 10) || 0;
}

export async function loadRoomCatalog() {
  try {
    const data = await api("/room-types");
    const bySlug = Object.fromEntries(staticRooms.map((room) => [room.id, room]));
    const mapped = (data.roomTypes || []).map((type) => mapApiTypeToRoom(type, bySlug[type.slug]));
    if (!mapped.length) return { rooms: staticRooms, source: "static" };
    return { rooms: mapped, source: "api" };
  } catch {
    return { rooms: staticRooms, source: "static" };
  }
}

export function catalogPriceBounds(list) {
  if (!list?.length) return { min: 0, max: 0 };
  return {
    min: Math.min(...list.map((room) => room.price)),
    max: Math.max(...list.map((room) => room.price)),
  };
}
