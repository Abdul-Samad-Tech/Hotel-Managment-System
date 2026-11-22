const {
  Room,
  RoomType,
  Reservation,
  Setting,
} = require("../models");
const { nightsBetween, dayKey, parseDay } = require("./dates");
const { priceStay } = require("./pricing");
const { assertBookableRange } = require("./bookingWindow");

const BLOCKING = ["pending", "confirmed", "checked_in"];

async function taxRate() {
  const setting = await Setting.findOne({ key: "taxRate" });
  return Number(setting?.value ?? 0.1);
}

function overlaps(checkIn, checkOut) {
  return {
    status: { $in: BLOCKING },
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  };
}

async function findRoomType(roomType) {
  const label = String(roomType || "").trim();
  if (!label) return null;
  return RoomType.findOne({
    active: { $ne: false },
    $or: [{ name: label }, { slug: label }],
  });
}

async function quoteStay({ roomType, checkIn, checkOut, adults, children, ignoreReservationId }) {
  if (!(checkOut > checkIn)) {
    const error = new Error("Check-out must be after check-in.");
    error.status = 400;
    throw error;
  }
  await assertBookableRange(checkIn, checkOut);
  const type = await findRoomType(roomType);
  if (!type) {
    const error = new Error("Choose a known room type.");
    error.status = 400;
    throw error;
  }
  if (adults > type.maxAdults || children > type.maxChildren) {
    const error = new Error(`${type.name} allows ${type.maxAdults} adults and ${type.maxChildren} children.`);
    error.status = 400;
    throw error;
  }

  const rooms = await Room.find({ roomTypeId: type._id, active: { $ne: false }, status: { $nin: ["out_of_service"] } });
  const takenFilter = {
    roomId: { $in: rooms.map((room) => room._id) },
    ...overlaps(checkIn, checkOut),
  };
  if (ignoreReservationId) takenFilter._id = { $ne: ignoreReservationId };
  const taken = await Reservation.find(takenFilter).distinct("roomId");
  const takenIds = new Set(taken.map(String));
  const openRooms = rooms.filter((room) => !takenIds.has(String(room._id)) && room.status !== "maintenance");
  const nights = nightsBetween(checkIn, checkOut);
  const rate = await taxRate();
  const priced = priceStay(type.baseRate, nights, rate);
  return {
    roomType: type,
    openRooms,
    nights,
    nightlyRate: type.baseRate,
    taxRate: rate,
    ...priced,
  };
}

/**
 * Nightly map for calendars.
 * - Default: sold-out when no physical room of that type is free that night.
 * - With roomId: sold-out when that room is held by another blocking stay.
 * - ignoreReservationId: skip that stay (desk “move dates” for the same booking).
 */
async function calendarNights({ roomType, from, to, ignoreReservationId, roomId }) {
  const start = parseDay(from);
  const end = parseDay(to);
  if (end < start) {
    const error = new Error("End date must be on or after the start date.");
    error.status = 400;
    throw error;
  }
  const type = await findRoomType(roomType);
  if (!type) {
    const error = new Error("Choose a known room type.");
    error.status = 400;
    throw error;
  }

  let rooms;
  if (roomId) {
    const one = await Room.findOne({
      _id: roomId,
      roomTypeId: type._id,
      active: { $ne: false },
      status: { $nin: ["out_of_service"] },
    });
    rooms = one ? [one] : [];
  } else {
    rooms = await Room.find({
      roomTypeId: type._id,
      active: { $ne: false },
      status: { $nin: ["out_of_service"] },
    });
  }
  const rangeEnd = new Date(end);
  rangeEnd.setUTCDate(rangeEnd.getUTCDate() + 1);

  const takenFilter = {
    roomId: { $in: rooms.map((room) => room._id) },
    status: { $in: BLOCKING },
    checkIn: { $lt: rangeEnd },
    checkOut: { $gt: start },
  };
  if (ignoreReservationId) takenFilter._id = { $ne: ignoreReservationId };

  const reservations = rooms.length
    ? await Reservation.find(takenFilter).select("roomId checkIn checkOut")
    : [];

  const price = type.baseRate / 100;
  const nights = {};
  const cursor = new Date(start);
  while (cursor <= end) {
    const iso = dayKey(cursor);
    const nightStart = new Date(cursor);
    const nightEnd = new Date(cursor);
    nightEnd.setUTCDate(nightEnd.getUTCDate() + 1);
    const taken = new Set();
    for (const stay of reservations) {
      if (stay.checkIn < nightEnd && stay.checkOut > nightStart) {
        taken.add(String(stay.roomId));
      }
    }
    const open = rooms.filter((room) => room.status !== "maintenance" && !taken.has(String(room._id))).length;
    nights[iso] = { price, available: open > 0 };
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return { roomType: type.name, nights };
}

module.exports = { quoteStay, calendarNights, overlaps, taxRate, BLOCKING, findRoomType };
