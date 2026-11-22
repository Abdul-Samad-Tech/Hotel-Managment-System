import { rooms } from "../data/rooms";
import {
  COMPARE_FALLBACK_SIZE,
  COMPARE_FALLBACK_VIEW,
  COMPARE_SIZE_BY_ID,
} from "../store/compare.constant";

const VIEW_PATTERN = /view|ocean window|sea doors|terrace/i;

export function isKnownRoomId(id) {
  return rooms.some((room) => room.id === id);
}

export function roomById(id) {
  return rooms.find((room) => room.id === id);
}

export function roomsFromCompareIds(ids) {
  const list = [];
  for (const id of ids) {
    const room = roomById(id);
    if (room) list.push(room);
  }
  return list;
}

export function roomViewLabel(room) {
  const fromAmenities = room.amenities.find((item) => VIEW_PATTERN.test(item));
  if (fromAmenities) return fromAmenities;
  const fromSpecs = room.specs.find((item) => VIEW_PATTERN.test(item));
  return fromSpecs ?? COMPARE_FALLBACK_VIEW;
}

export function roomSizeLabel(room) {
  return COMPARE_SIZE_BY_ID[room.id] ?? COMPARE_FALLBACK_SIZE;
}

export function unionAmenities(picked) {
  const set = new Set();
  for (const room of picked) {
    for (const amenity of room.amenities) set.add(amenity);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}
