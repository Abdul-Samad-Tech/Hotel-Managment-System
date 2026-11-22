const { Guest, Reservation, Room } = require("../models");

/**
 * Guests may place dining orders / table bookings only while checked in.
 */
async function resolveDiningEligibility(user) {
  if (!user || user.role !== "guest") {
    return { ok: false, canOrder: false, reason: "Sign in as a guest to order dining." };
  }

  const guest = await Guest.findOne({ userId: user._id });
  if (!guest) {
    return { ok: false, canOrder: false, reason: "Guest profile required." };
  }

  let reservation = await Reservation.findOne({ guestId: guest._id, status: "checked_in" }).sort({ updatedAt: -1 });
  if (!reservation) {
    const recent = await Reservation.findOne({ guestId: guest._id }).sort({ checkIn: -1 });
    let reason = "You must be checked in at the front desk to order dining.";
    if (!recent) reason = "No stay found. Book a room and check in first.";
    else if (recent.status === "confirmed" || recent.status === "pending") {
      reason = "Dining opens after front desk check-in.";
    } else if (recent.status === "checked_out") {
      reason = "Dining orders close after check-out.";
    } else if (recent.status === "cancelled" || recent.status === "no_show") {
      reason = "No active in-house stay for dining.";
    }
    return { ok: false, canOrder: false, reason, guest };
  }

  const room = reservation.roomId ? await Room.findById(reservation.roomId).select("roomNumber") : null;
  return {
    ok: true,
    canOrder: true,
    reason: "",
    guest,
    reservation,
    roomNumber: room?.roomNumber || "",
    reservationId: String(reservation._id),
  };
}

function presentEligibility(result) {
  return {
    canOrder: Boolean(result.canOrder),
    reason: result.reason || "",
    reservationId: result.reservationId || (result.reservation ? String(result.reservation._id) : null),
    roomNumber: result.roomNumber || "",
  };
}

module.exports = { resolveDiningEligibility, presentEligibility };
