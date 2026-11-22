function parseDay(value) {
  if (value instanceof Date) return value;
  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) {
    const error = new Error("Use dates as YYYY-MM-DD.");
    error.status = 400;
    throw error;
  }
  return new Date(Date.UTC(year, month - 1, day));
}

function nightsBetween(checkIn, checkOut) {
  const ms = checkOut.getTime() - checkIn.getTime();
  return Math.round(ms / 86400000);
}

function dayKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function code(prefix) {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${stamp}${rand}`;
}

module.exports = { parseDay, nightsBetween, dayKey, code };
