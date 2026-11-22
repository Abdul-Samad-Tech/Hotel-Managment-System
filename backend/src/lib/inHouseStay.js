const { Guest, Reservation, Room } = require("../models");

/**
 * Resolve the guest's current checked-in stay + room.
 * Shared by guest housekeeping (and safe for other in-house features).
 */
async function resolveInHouseStay(user) {
  if (!user || user.role !== "guest") {
    return { ok: false, reason: "Sign in as a guest." };
  }

  const guest = await Guest.findOne({ userId: user._id });
  if (!guest) {
    return { ok: false, reason: "Guest profile required." };
  }

  const reservation = await Reservation.findOne({ guestId: guest._id, status: "checked_in" }).sort({ updatedAt: -1 });
  if (!reservation) {
    const recent = await Reservation.findOne({ guestId: guest._id }).sort({ checkIn: -1 });
    let reason = "Available after front desk check-in.";
    if (!recent) reason = "No stay found. Book a room and check in first.";
    else if (recent.status === "checked_out") reason = "Room care closes after check-out.";
    else if (recent.status === "cancelled" || recent.status === "no_show") {
      reason = "No active in-house stay.";
    }
    return { ok: false, reason, guest };
  }

  if (!reservation.roomId) {
    return { ok: false, reason: "No room assigned yet. Ask the front desk.", guest, reservation };
  }

  const room = await Room.findById(reservation.roomId).select("roomNumber status");
  return {
    ok: true,
    reason: "",
    guest,
    reservation,
    room,
    roomNumber: room?.roomNumber || "",
    reservationId: String(reservation._id),
  };
}

module.exports = { resolveInHouseStay };
