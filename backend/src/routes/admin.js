const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { User, Guest, Reservation, Invoice, Feedback, Room, Setting, AuditLog, Role } = require("../models");
const { requireAuth, requireRole } = require("../middleware/auth");
const { toCsv } = require("../lib/csv");
const { getBookingWindow } = require("../lib/bookingWindow");

const router = require("express").Router();
const managers = ["admin", "manager"];

/** One-time plaintext password for admin to share with staff — never stored. */
function generateStaffPassword() {
  const chunk = crypto.randomBytes(4).toString("hex");
  return `Bay#${chunk}`;
}

router.get("/users", requireAuth, requireRole(...managers), async (req, res, next) => {
  try {
    const users = await User.find().select("-passwordHash -refreshTokenHash").sort({ role: 1, fullName: 1 });
    res.json({ users });
  } catch (error) {
    next(error);
  }
});

router.get("/users/:id", requireAuth, requireRole(...managers), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-passwordHash -refreshTokenHash");
    if (!user) {
      const error = new Error("User not found.");
      error.status = 404;
      throw error;
    }
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

router.post("/users", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const allowed = ["manager", "receptionist", "housekeeping", "maintenance"];
    if (!allowed.includes(req.body.role)) {
      const error = new Error("Choose a valid staff role.");
      error.status = 400;
      throw error;
    }
    if (!req.body.fullName || !req.body.email) {
      const error = new Error("Name and email are required.");
      error.status = 400;
      throw error;
    }
    // Always issue a generated password so admin can copy and share it (optional override still allowed).
    const temporaryPassword =
      typeof req.body.password === "string" && req.body.password.trim().length >= 8
        ? req.body.password.trim()
        : generateStaffPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);
    const roleDoc = await Role.findOne({ name: req.body.role });
    const user = await User.create({
      fullName: String(req.body.fullName).trim(),
      email: String(req.body.email).toLowerCase().trim(),
      phone: req.body.phone,
      role: req.body.role,
      roleIds: roleDoc ? [roleDoc._id] : [],
      passwordHash,
      status: "active",
    });
    await AuditLog.create({
      actorUserId: req.user._id,
      action: "user.create",
      entityType: "user",
      entityId: String(user._id),
      after: { role: user.role, email: user.email },
    });
    res.status(201).json({
      user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role, status: user.status },
      temporaryPassword,
    });
  } catch (error) {
    if (error.code === 11000) {
      error.message = "That email is already in use.";
      error.status = 409;
    }
    next(error);
  }
});

router.post("/users/:id/reset-password", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      const error = new Error("User not found.");
      error.status = 404;
      throw error;
    }
    if (user.role === "admin") {
      const error = new Error("Cannot reset an admin password from this panel.");
      error.status = 403;
      throw error;
    }
    const temporaryPassword = generateStaffPassword();
    user.passwordHash = await bcrypt.hash(temporaryPassword, 10);
    user.status = "active";
    await user.save();
    await AuditLog.create({
      actorUserId: req.user._id,
      action: "user.reset_password",
      entityType: "user",
      entityId: String(user._id),
      after: { email: user.email },
    });
    res.json({
      user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role, status: user.status },
      temporaryPassword,
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/users/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const patch = {};
    if (req.body.role) patch.role = req.body.role;
    if (req.body.status) patch.status = req.body.status;
    if (req.body.fullName) patch.fullName = req.body.fullName;
    const user = await User.findByIdAndUpdate(req.params.id, patch, { new: true }).select("-passwordHash -refreshTokenHash");
    if (!user) {
      const error = new Error("User not found.");
      error.status = 404;
      throw error;
    }
    await AuditLog.create({ actorUserId: req.user._id, action: "user.update", entityType: "user", entityId: String(user._id), after: patch });
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

router.get("/guests/me", requireAuth, async (req, res, next) => {
  try {
    const guest = await Guest.findOne({ userId: req.user._id });
    if (!guest) {
      const error = new Error("Guest profile not found.");
      error.status = 404;
      throw error;
    }
    res.json({ guest });
  } catch (error) {
    next(error);
  }
});

router.patch("/guests/me", requireAuth, async (req, res, next) => {
  try {
    const patch = {};
    ["phone", "nationality", "notes", "idProof"].forEach((key) => {
      if (req.body[key] !== undefined) patch[key] = req.body[key];
    });
    if (Array.isArray(req.body.preferences)) patch.preferences = req.body.preferences;
    const guest = await Guest.findOneAndUpdate({ userId: req.user._id }, patch, { new: true });
    if (!guest) {
      const error = new Error("Guest profile not found.");
      error.status = 404;
      throw error;
    }
    res.json({ guest });
  } catch (error) {
    next(error);
  }
});

router.get("/guests", requireAuth, requireRole("admin", "manager", "receptionist"), async (req, res, next) => {
  try {
    const query = {};
    if (req.query.q) {
      const safe = String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [{ fullName: new RegExp(safe, "i") }, { email: new RegExp(safe, "i") }];
    }
    if (req.query.all !== "1") query.status = { $ne: "inactive" };
    const guests = await Guest.find(query).sort({ fullName: 1 }).limit(50);
    res.json({ guests });
  } catch (error) {
    next(error);
  }
});

router.get("/guests/:id", requireAuth, requireRole("admin", "manager", "receptionist"), async (req, res, next) => {
  try {
    const guest = await Guest.findById(req.params.id);
    if (!guest) {
      const error = new Error("Guest not found.");
      error.status = 404;
      throw error;
    }
    res.json({ guest });
  } catch (error) {
    next(error);
  }
});

router.post("/guests", requireAuth, requireRole("admin", "manager", "receptionist"), async (req, res, next) => {
  try {
    const guest = await Guest.create({
      fullName: req.body.fullName,
      email: String(req.body.email).toLowerCase(),
      phone: req.body.phone,
      nationality: req.body.nationality,
      preferences: req.body.preferences || [],
      notes: req.body.notes,
      idProof: req.body.idProof,
      status: "active",
    });
    res.status(201).json({ guest });
  } catch (error) {
    next(error);
  }
});

router.patch("/guests/:id", requireAuth, requireRole("admin", "manager", "receptionist"), async (req, res, next) => {
  try {
    const guest = await Guest.findById(req.params.id);
    if (!guest) {
      const error = new Error("Guest not found.");
      error.status = 404;
      throw error;
    }
    if (req.body.fullName !== undefined) guest.fullName = String(req.body.fullName).trim();
    if (req.body.phone !== undefined) guest.phone = req.body.phone;
    if (req.body.nationality !== undefined) guest.nationality = req.body.nationality;
    if (req.body.notes !== undefined) guest.notes = req.body.notes;
    if (req.body.idProof !== undefined) guest.idProof = req.body.idProof;
    if (Array.isArray(req.body.preferences)) guest.preferences = req.body.preferences;
    if (req.body.status === "active" || req.body.status === "inactive") guest.status = req.body.status;
    // Email locked when linked to a user account to avoid auth mismatch.
    if (req.body.email !== undefined && !guest.userId) {
      guest.email = String(req.body.email).toLowerCase();
    }
    await guest.save();
    // Keep login account in sync so deactivated guests can sign up again with the same email.
    if (guest.userId && (req.body.status === "active" || req.body.status === "inactive")) {
      await User.updateOne({ _id: guest.userId, role: "guest" }, { status: guest.status });
    }
    res.json({ guest });
  } catch (error) {
    next(error);
  }
});

router.get("/roles", requireAuth, requireRole(...managers), async (req, res, next) => {
  try {
    const roles = await Role.find().sort({ name: 1 });
    res.json({ roles });
  } catch (error) {
    next(error);
  }
});

function sendReport(res, filename, rows, json) {
  if (res.req.query.format === "csv") {
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(toCsv(rows));
    return;
  }
  res.json(json);
}

router.get("/reports/occupancy", requireAuth, requireRole(...managers), async (req, res, next) => {
  try {
    const rooms = await Room.find({ active: true });
    const occupied = rooms.filter((room) => room.status === "occupied").length;
    const reserved = rooms.filter((room) => room.status === "reserved").length;
    const report = {
      rooms: rooms.length,
      occupied,
      reserved,
      available: rooms.filter((room) => room.status === "available").length,
      cleaning: rooms.filter((room) => room.status === "cleaning").length,
      maintenance: rooms.filter((room) => room.status === "maintenance").length,
      occupancyRate: rooms.length ? Math.round(((occupied + reserved) / rooms.length) * 100) : 0,
    };
    sendReport(res, "occupancy.csv", rooms.map((room) => ({ roomNumber: room.roomNumber, status: room.status, floor: room.floor || "" })), report);
  } catch (error) {
    next(error);
  }
});

router.get("/reports/revenue", requireAuth, requireRole(...managers), async (req, res, next) => {
  try {
    const invoices = await Invoice.find({ status: { $in: ["issued", "partially_paid", "paid"] } });
    const billed = invoices.reduce((sum, invoice) => sum + invoice.grandTotal, 0);
    const collected = invoices.reduce((sum, invoice) => sum + invoice.amountPaid, 0);
    const report = {
      invoices: invoices.length,
      billed: billed / 100,
      collected: collected / 100,
      outstanding: (billed - collected) / 100,
    };
    sendReport(
      res,
      "revenue.csv",
      invoices.map((invoice) => ({
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        grandTotal: invoice.grandTotal / 100,
        amountPaid: invoice.amountPaid / 100,
        balanceDue: invoice.balanceDue / 100,
      })),
      report,
    );
  } catch (error) {
    next(error);
  }
});

router.get("/reports/guest-feedback", requireAuth, requireRole(...managers), async (req, res, next) => {
  try {
    const rows = await Feedback.find();
    const average = rows.length ? rows.reduce((sum, row) => sum + row.rating, 0) / rows.length : 0;
    sendReport(
      res,
      "feedback.csv",
      rows.map((row) => ({ rating: row.rating, title: row.title || "", comment: row.comment || "" })),
      { count: rows.length, average: Number(average.toFixed(1)) },
    );
  } catch (error) {
    next(error);
  }
});

router.get("/reports/performance", requireAuth, requireRole(...managers), async (req, res, next) => {
  try {
    const { parseDay, dayKey, nightsBetween } = require("../lib/dates");
    const now = new Date();
    const defaultTo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const defaultFrom = new Date(defaultTo);
    defaultFrom.setUTCDate(defaultFrom.getUTCDate() - 29);
    const from = req.query.from ? parseDay(req.query.from) : defaultFrom;
    const to = req.query.to ? parseDay(req.query.to) : defaultTo;
    if (!(to > from)) {
      const error = new Error("Choose an end date after the start date.");
      error.status = 400;
      throw error;
    }

    const rooms = await Room.find({ active: { $ne: false } });
    const roomCount = rooms.length || 1;
    const spanNights = Math.max(nightsBetween(from, to), 1);
    const availableRoomNights = roomCount * spanNights;

    const stays = await Reservation.find({
      status: { $in: ["confirmed", "checked_in", "checked_out"] },
      checkIn: { $lt: to },
      checkOut: { $gt: from },
    });

    let soldRoomNights = 0;
    let roomRevenueCents = 0;
    for (const stay of stays) {
      const overlapStart = stay.checkIn > from ? stay.checkIn : from;
      const overlapEnd = stay.checkOut < to ? stay.checkOut : to;
      const nights = Math.max(nightsBetween(overlapStart, overlapEnd), 0);
      soldRoomNights += nights;
      if (stay.nightlyRate) roomRevenueCents += stay.nightlyRate * nights;
      else if (stay.totalAmount && stay.checkIn && stay.checkOut) {
        const stayNights = Math.max(nightsBetween(stay.checkIn, stay.checkOut), 1);
        roomRevenueCents += Math.round((stay.totalAmount / stayNights) * nights);
      }
    }

    const adr = soldRoomNights ? roomRevenueCents / soldRoomNights / 100 : 0;
    const revpar = availableRoomNights ? roomRevenueCents / availableRoomNights / 100 : 0;
    const occupancyRate = availableRoomNights ? Math.round((soldRoomNights / availableRoomNights) * 100) : 0;

    const demandFrom = new Date(defaultTo);
    const demandTo = new Date(defaultTo);
    demandTo.setUTCDate(demandTo.getUTCDate() + 14);
    const upcoming = await Reservation.find({
      status: { $in: ["confirmed", "checked_in"] },
      checkIn: { $lt: demandTo },
      checkOut: { $gt: demandFrom },
    });
    let upcomingNights = 0;
    for (const stay of upcoming) {
      const overlapStart = stay.checkIn > demandFrom ? stay.checkIn : demandFrom;
      const overlapEnd = stay.checkOut < demandTo ? stay.checkOut : demandTo;
      upcomingNights += Math.max(nightsBetween(overlapStart, overlapEnd), 0);
    }
    const demandCapacity = roomCount * 14;
    const demandRatio = demandCapacity ? upcomingNights / demandCapacity : 0;
    let demandLabel = "soft";
    if (demandRatio >= 0.7) demandLabel = "strong";
    else if (demandRatio >= 0.4) demandLabel = "moderate";

    const report = {
      from: dayKey(from),
      to: dayKey(to),
      rooms: roomCount,
      soldRoomNights,
      availableRoomNights,
      occupancyRate,
      adr: Number(adr.toFixed(2)),
      revpar: Number(revpar.toFixed(2)),
      roomRevenue: Number((roomRevenueCents / 100).toFixed(2)),
      demand: {
        windowDays: 14,
        bookedRoomNights: upcomingNights,
        capacityRoomNights: demandCapacity,
        ratio: Number(demandRatio.toFixed(2)),
        label: demandLabel,
      },
    };
    sendReport(
      res,
      "performance.csv",
      [
        {
          from: report.from,
          to: report.to,
          occupancyRate: report.occupancyRate,
          adr: report.adr,
          revpar: report.revpar,
          demand: report.demand.label,
        },
      ],
      report,
    );
  } catch (error) {
    next(error);
  }
});

/** Public booking date window for calendars (no auth). */
router.get("/booking-window", async (req, res, next) => {
  try {
    const window = await getBookingWindow();
    res.json({ from: window.fromKey, to: window.toKey || null });
  } catch (error) {
    next(error);
  }
});

router.get("/settings", requireAuth, requireRole(...managers), async (req, res, next) => {
  try {
    const settings = await Setting.find();
    res.json({ settings });
  } catch (error) {
    next(error);
  }
});

router.patch("/settings", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const setting = await Setting.findOneAndUpdate(
      { key: req.body.key },
      { value: req.body.value, updatedBy: req.user._id },
      { new: true, upsert: true },
    );
    await AuditLog.create({
      actorUserId: req.user._id,
      action: "settings.update",
      entityType: "setting",
      entityId: setting.key,
      after: { value: setting.value },
    });
    res.json({ setting });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
