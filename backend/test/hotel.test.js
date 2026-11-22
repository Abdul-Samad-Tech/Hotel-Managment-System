const test = require("node:test");
const assert = require("node:assert/strict");
const { parseDay, nightsBetween } = require("../src/lib/dates");
const { priceStay } = require("../src/lib/pricing");
const { toCsv } = require("../src/lib/csv");

test("a four-night stay is measured from check-in to check-out", () => {
  const nights = nightsBetween(parseDay("2026-10-12"), parseDay("2026-10-16"));
  assert.equal(nights, 4);
});

test("dates must use YYYY-MM-DD", () => {
  assert.throws(() => parseDay("12 Oct"), /YYYY-MM-DD/);
});

test("room price is stored in cents with rounded tax", () => {
  const priced = priceStay(12000, 4, 0.1);
  assert.deepEqual(priced, { subtotal: 48000, taxes: 4800, totalAmount: 52800 });
});

test("report rows become a csv download", () => {
  const csv = toCsv([{ room: "101", note: "sea, view" }]);
  assert.equal(csv, 'room,note\n101,"sea, view"\n');
});
