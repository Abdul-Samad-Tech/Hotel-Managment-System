const { Setting } = require("../models");
const { parseDay, dayKey } = require("./dates");

function startOfUtcToday() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

async function getBookingWindow() {
  const rows = await Setting.find({ key: { $in: ["bookingOpenFrom", "bookingOpenTo"] } });
  const map = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  const today = startOfUtcToday();
  let from = map.bookingOpenFrom ? parseDay(String(map.bookingOpenFrom)) : today;
  let to = map.bookingOpenTo ? parseDay(String(map.bookingOpenTo)) : null;
  if (from < today) from = today;
  return { from, to, fromKey: dayKey(from), toKey: to ? dayKey(to) : "" };
}

async function assertBookableRange(checkIn, checkOut) {
  const today = startOfUtcToday();
  if (checkIn < today) {
    const error = new Error("Past dates cannot be booked. Choose a check-in from today onward.");
    error.status = 400;
    throw error;
  }
  const window = await getBookingWindow();
  if (checkIn < window.from) {
    const error = new Error(`Bookings open from ${window.fromKey}.`);
    error.status = 400;
    throw error;
  }
  if (window.to && checkOut > window.to) {
    const error = new Error(`Bookings are only open through ${window.toKey}.`);
    error.status = 400;
    throw error;
  }
  if (window.to && checkIn >= window.to) {
    const error = new Error(`Bookings are only open through ${window.toKey}.`);
    error.status = 400;
    throw error;
  }
  return window;
}

module.exports = { getBookingWindow, assertBookableRange, startOfUtcToday };
