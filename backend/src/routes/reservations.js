const mongoose = require("mongoose");
const {
  Reservation,
  Guest,
  Room,
  RoomType,
  Invoice,
  InvoiceItem,
  Stay,
  Notification,
  AuditLog,
  User,
} = require("../models");
const { requireAuth, requireRole } = require("../middleware/auth");
const { quoteStay, overlaps } = require("../lib/availability");
const { parseDay, code, dayKey } = require("../lib/dates");
const { publish } = require("../sockets");

const router = require("express").Router();
const desk = ["admin", "manager", "receptionist"];

function present(reservation) {
  return {
    id: reservation._id,
    confirmationCode: reservation.confirmationCode,
    status: reservation.status,
    checkIn: dayKey(reservation.checkIn),
    checkOut: dayKey(reservation.checkOut),
    adults: reservation.adults,
    children: reservation.children,
    nightlyRate: (reservation.nightlyRate || 0) / 100,
    taxes: (reservation.taxes || 0) / 100,
    totalAmount: (reservation.totalAmount || 0) / 100,
    specialRequests: reservation.specialRequests || "",
    guest: reservation.guestId?.fullName,
    guestEmail: reservation.guestId?.email,
    roomNumber: reservation.roomId?.roomNumber,
    roomId: reservation.roomId?._id ? String(reservation.roomId._id) : reservation.roomId ? String(reservation.roomId) : "",
    roomType: reservation.roomTypeId?.name || reservation.roomType,
    source: reservation.source,
  };
}

async function loadReservation(id) {
  return Reservation.findById(id).populate("guestId").populate("roomId").populate("roomTypeId");
}

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === "guest") {
      const guest = await Guest.findOne({ userId: req.user._id });
      filter.guestId = guest?._id;
    } else {
      if (req.query.status) filter.status = req.query.status;
      const q = String(req.query.q || "").trim();
      if (q) {
        const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const guests = await Guest.find({
          $or: [{ fullName: new RegExp(safe, "i") }, { email: new RegExp(safe, "i") }],
        }).select("_id");
        filter.$or = [{ confirmationCode: new RegExp(safe, "i") }, { guestId: { $in: guests.map((guest) => guest._id) } }];
      }
    }
    const rows = await Reservation.find(filter).populate("guestId").populate("roomId").populate("roomTypeId").sort({ checkIn: 1 });
    res.json({ reservations: rows.map(present) });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const reservation = await loadReservation(req.params.id);
    if (!reservation) {
      const error = new Error("Reservation not found.");
      error.status = 404;
      throw error;
    }
    if (req.user.role === "guest") {
      const guest = await Guest.findOne({ userId: req.user._id });
      if (!guest || String(reservation.guestId?._id) !== String(guest._id)) {
        const error = new Error("You do not have access to this stay.");
        error.status = 403;
        throw error;
      }
    }
    res.json({ reservation: present(reservation) });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const checkIn = parseDay(req.body.checkIn);
    const checkOut = parseDay(req.body.checkOut);
    const adults = Number(req.body.adults || 1);
    const children = Number(req.body.children || 0);
    const quote = await quoteStay({
      roomType: req.body.roomType,
      checkIn,
      checkOut,
      adults,
      children,
    });
    if (!quote.openRooms.length) {
      const error = new Error(`No ${req.body.roomType} is free for those dates.`);
      error.status = 409;
      throw error;
    }

    let guest;
    if (req.user.role === "guest") {
      guest = await Guest.findOne({ userId: req.user._id });
    } else if (desk.includes(req.user.role)) {
      const email = String(req.body.guestEmail || "").toLowerCase();
      guest = await Guest.findOne({ email });
      if (!guest) {
        if (!req.body.guestName) {
          const error = new Error("Guest name and email are required.");
          error.status = 400;
          throw error;
        }
        guest = await Guest.create({ fullName: req.body.guestName, email, phone: req.body.guestPhone });
      }
    }
    if (!guest) {
      const error = new Error("Only guests and the front desk can create a reservation.");
      error.status = 403;
      throw error;
    }

    const room = quote.openRooms[0];
    const session = await mongoose.startSession();
    let reservation;
    let invoice;
    try {
      await session.withTransaction(async () => {
        const conflict = await Reservation.findOne({ roomId: room._id, ...overlaps(checkIn, checkOut) }).session(session);
        if (conflict) {
          const error = new Error("That room was just taken. Check availability again.");
          error.status = 409;
          throw error;
        }
        const [created] = await Reservation.create(
          [
            {
              confirmationCode: code("AB"),
              guestId: guest._id,
              roomId: room._id,
              roomTypeId: quote.roomType._id,
              checkIn,
              checkOut,
              adults,
              children,
              status: "confirmed",
              source: req.user.role === "guest" ? "website" : "front-desk",
              nightlyRate: quote.nightlyRate,
              taxes: quote.taxes,
              totalAmount: quote.totalAmount,
              specialRequests: req.body.specialRequests || "",
              createdBy: req.user._id,
            },
          ],
          { session },
        );
        reservation = created;
        await Room.updateOne({ _id: room._id }, { status: "reserved" }, { session });
        const [bill] = await Invoice.create(
          [
            {
              reservationId: reservation._id,
              guestId: guest._id,
              invoiceNumber: code("INV"),
              subtotal: quote.subtotal,
              taxTotal: quote.taxes,
              grandTotal: quote.totalAmount,
              balanceDue: quote.totalAmount,
              status: "draft",
            },
          ],
          { session },
        );
        invoice = bill;
        await InvoiceItem.create(
          [
            {
              invoiceId: invoice._id,
              category: "room",
              description: `${quote.roomType.name} · ${quote.nights} nights`,
              quantity: quote.nights,
              unitPrice: quote.nightlyRate,
              taxRate: quote.taxRate,
              lineTotal: quote.subtotal,
            },
          ],
          { session },
        );
      });
    } finally {
      await session.endSession();
    }

    const guestUser = guest.userId ? await User.findById(guest.userId) : null;
    const notify = guestUser || req.user;
    await Notification.create({
      recipientUserId: notify._id,
      type: "reservation",
      title: "Stay confirmed",
      message: `${reservation.confirmationCode} is confirmed for room ${room.roomNumber}.`,
      link: "/portal",
    });
    await AuditLog.create({
      actorUserId: req.user._id,
      action: "reservation.create",
      entityType: "reservation",
      entityId: String(reservation._id),
      after: { confirmationCode: reservation.confirmationCode },
      ip: req.ip,
    });

    publish("reservation");
    const saved = await loadReservation(reservation._id);
    res.status(201).json({ reservation: present(saved), invoiceId: invoice._id });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      const error = new Error("Reservation not found.");
      error.status = 404;
      throw error;
    }
    const isGuest = req.user.role === "guest";
    if (isGuest) {
      const guest = await Guest.findOne({ userId: req.user._id });
      if (!guest || String(reservation.guestId) !== String(guest._id)) {
        const error = new Error("You do not have access to this stay.");
        error.status = 403;
        throw error;
      }
      if (req.body.status && req.body.status !== "cancelled") {
        const error = new Error("Guests can only cancel their own stay.");
        error.status = 403;
        throw error;
      }
      if (req.body.checkIn || req.body.checkOut) {
        const error = new Error("The front desk changes stay dates.");
        error.status = 403;
        throw error;
      }
    }
    if (req.body.specialRequests !== undefined) {
      if (!["pending", "confirmed"].includes(reservation.status)) {
        const error = new Error("This stay can no longer be changed.");
        error.status = 400;
        throw error;
      }
      reservation.specialRequests = String(req.body.specialRequests).slice(0, 500);
      await reservation.save();
    }
    if ((req.body.checkIn || req.body.checkOut) && desk.includes(req.user.role)) {
      if (!["pending", "confirmed"].includes(reservation.status)) {
        const error = new Error("Only a confirmed stay can move dates.");
        error.status = 400;
        throw error;
      }
      const checkIn = req.body.checkIn ? parseDay(req.body.checkIn) : reservation.checkIn;
      const checkOut = req.body.checkOut ? parseDay(req.body.checkOut) : reservation.checkOut;
      const type = await RoomType.findById(reservation.roomTypeId);
      const quote = await quoteStay({
        roomType: type.name,
        checkIn,
        checkOut,
        adults: reservation.adults,
        children: reservation.children,
        ignoreReservationId: reservation._id,
      });
      const stillOpen = quote.openRooms.some((room) => String(room._id) === String(reservation.roomId));
      if (!stillOpen) {
        const error = new Error("That room is not free for the new dates.");
        error.status = 409;
        throw error;
      }
      reservation.checkIn = checkIn;
      reservation.checkOut = checkOut;
      reservation.nightlyRate = quote.nightlyRate;
      reservation.taxes = quote.taxes;
      reservation.totalAmount = quote.totalAmount;
      await reservation.save();
      const invoice = await Invoice.findOne({ reservationId: reservation._id });
      if (invoice && invoice.status === "draft") {
        await InvoiceItem.updateOne(
          { invoiceId: invoice._id, category: "room" },
          {
            description: `${type.name} · ${quote.nights} nights`,
            quantity: quote.nights,
            unitPrice: quote.nightlyRate,
            lineTotal: quote.subtotal,
          },
        );
        invoice.subtotal = quote.subtotal;
        invoice.taxTotal = quote.taxes;
        invoice.grandTotal = quote.totalAmount;
        invoice.balanceDue = Math.max(quote.totalAmount - invoice.amountPaid, 0);
        await invoice.save();
      }
    }
    if (req.body.status === "cancelled") {
      if (!["pending", "confirmed"].includes(reservation.status)) {
        const error = new Error("This stay can no longer be cancelled.");
        error.status = 400;
        throw error;
      }
      reservation.status = "cancelled";
      await reservation.save();
      if (reservation.roomId) await Room.updateOne({ _id: reservation.roomId }, { status: "available" });
      await Invoice.updateOne({ reservationId: reservation._id, status: "draft" }, { status: "void", balanceDue: 0 });
    }
    if (req.body.status === "no_show") {
      if (!desk.includes(req.user.role)) {
        const error = new Error("Only the front desk can mark a no-show.");
        error.status = 403;
        throw error;
      }
      if (reservation.status !== "confirmed") {
        const error = new Error("Only a confirmed reservation can be marked as a no-show.");
        error.status = 400;
        throw error;
      }
      reservation.status = "no_show";
      await reservation.save();
      if (reservation.roomId) await Room.updateOne({ _id: reservation.roomId }, { status: "available" });
      await AuditLog.create({ actorUserId: req.user._id, action: "reservation.no_show", entityType: "reservation", entityId: String(reservation._id) });
    }
    publish("reservation");
    const saved = await loadReservation(reservation._id);
    res.json({ reservation: present(saved) });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/check-in", requireAuth, requireRole(...desk), async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation || reservation.status !== "confirmed") {
      const error = new Error("Only a confirmed reservation can be checked in.");
      error.status = 400;
      throw error;
    }
    reservation.status = "checked_in";
    await reservation.save();
    await Room.updateOne({ _id: reservation.roomId }, { status: "occupied" });
    const stay = await Stay.create({
      reservationId: reservation._id,
      checkedInAt: new Date(),
      keyReference: req.body.keyReference || `KEY-${reservation.confirmationCode.slice(-4)}`,
      createdBy: req.user._id,
    });
    await AuditLog.create({
      actorUserId: req.user._id,
      action: "reservation.check_in",
      entityType: "reservation",
      entityId: String(reservation._id),
      ip: req.ip,
    });
    publish("reservation");
    const saved = await loadReservation(reservation._id);
    res.json({ reservation: present(saved), stay });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/check-out", requireAuth, requireRole(...desk), async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation || reservation.status !== "checked_in") {
      const error = new Error("Only an in-house stay can be checked out.");
      error.status = 400;
      throw error;
    }
    reservation.status = "checked_out";
    await reservation.save();
    await Stay.updateOne({ reservationId: reservation._id }, { checkedOutAt: new Date() });
    await Room.updateOne({ _id: reservation.roomId }, { status: "cleaning" });
    const invoice = await Invoice.findOneAndUpdate(
      { reservationId: reservation._id },
      { status: "issued", issuedAt: new Date() },
      { new: true },
    );
    const { HousekeepingTask, DiningOrder, InvoiceItem } = require("../models");
    const openDining = await DiningOrder.find({
      reservationId: reservation._id,
      status: "placed",
    });
    for (const order of openDining) {
      if (order.invoiceItemIds?.length && invoice) {
        let removed = 0;
        for (const itemId of order.invoiceItemIds) {
          const item = await InvoiceItem.findById(itemId);
          if (!item) continue;
          removed += item.lineTotal || 0;
          await item.deleteOne();
        }
        if (removed) {
          invoice.subtotal = Math.max(0, (invoice.subtotal || 0) - removed);
          invoice.grandTotal = Math.max(0, (invoice.grandTotal || 0) - removed);
          invoice.balanceDue = Math.max(0, (invoice.balanceDue || 0) - removed);
          await Reservation.updateOne({ _id: reservation._id }, { $inc: { totalAmount: -removed } });
        }
        order.invoiceItemIds = [];
      }
      order.status = "cancelled";
      order.cancelledAt = new Date();
      await order.save();
    }
    if (openDining.length && invoice) await invoice.save();
    const roomDoc = reservation.roomId ? await Room.findById(reservation.roomId).select("roomNumber") : null;
    await HousekeepingTask.create({
      roomId: reservation.roomId,
      reservationId: reservation._id,
      guestId: reservation.guestId,
      type: "checkout-clean",
      source: "checkout",
      priority: "high",
      scheduledFor: new Date(),
      status: "assigned",
      notes: `Turn room after ${reservation.confirmationCode}`,
    });
    const { notifyHousekeepingStaff } = require("../lib/housekeepingNotify");
    await notifyHousekeepingStaff(
      "Check-out clean",
      `Room ${roomDoc?.roomNumber || "—"} · turn after ${reservation.confirmationCode}`,
    );
    publish("housekeeping");
    await AuditLog.create({
      actorUserId: req.user._id,
      action: "reservation.check_out",
      entityType: "reservation",
      entityId: String(reservation._id),
      ip: req.ip,
    });
    publish("reservation");
    const saved = await loadReservation(reservation._id);
    res.json({ reservation: present(saved), invoiceId: invoice?._id });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
