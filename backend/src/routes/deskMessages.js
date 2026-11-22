const {
  DeskThread,
  DeskMessage,
  Guest,
  User,
  Reservation,
  Notification,
} = require("../models");
const { requireAuth } = require("../middleware/auth");
const { calendarNights } = require("../lib/availability");
const { parseDay, dayKey } = require("../lib/dates");
const { publish } = require("../sockets");

const router = require("express").Router();
const deskRoles = ["admin", "manager", "receptionist"];

function addUtcDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function addUtcMonths(date, months) {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}

function isDesk(user) {
  return deskRoles.includes(user.role);
}

function presentThread(thread, { includeGuest = false } = {}) {
  const row = {
    id: String(thread._id),
    topic: thread.topic,
    subject: thread.subject,
    status: thread.status,
    reservationId: thread.reservationId ? String(thread.reservationId) : "",
    roomType: thread.roomType || "",
    requestedCheckIn: thread.requestedCheckIn ? dayKey(thread.requestedCheckIn) : "",
    requestedCheckOut: thread.requestedCheckOut ? dayKey(thread.requestedCheckOut) : "",
    openNightHints: thread.openNightHints || [],
    lastMessageAt: thread.lastMessageAt,
    createdAt: thread.createdAt,
    guestLastReadAt: thread.guestLastReadAt,
    deskLastReadAt: thread.deskLastReadAt,
  };
  if (includeGuest) {
    row.guestId = thread.guestId?._id ? String(thread.guestId._id) : String(thread.guestId || "");
    row.guestName = thread.guestId?.fullName || "";
    row.guestEmail = thread.guestId?.email || "";
    row.guestPhone = thread.guestId?.phone || "";
  }
  return row;
}

function presentMessage(message) {
  return {
    id: String(message._id),
    threadId: String(message.threadId),
    senderRole: message.senderRole,
    body: message.body,
    meta: message.meta || {},
    createdAt: message.createdAt,
  };
}

async function guestForUser(user) {
  return Guest.findOne({ userId: user._id });
}

async function assertThreadAccess(thread, user) {
  if (!thread) {
    const error = new Error("Conversation not found.");
    error.status = 404;
    throw error;
  }
  if (isDesk(user)) return { role: "desk" };
  if (user.role !== "guest") {
    const error = new Error("Not allowed.");
    error.status = 403;
    throw error;
  }
  const guest = await guestForUser(user);
  if (!guest || String(thread.guestId) !== String(guest._id)) {
    const error = new Error("You do not have access to this conversation.");
    error.status = 403;
    throw error;
  }
  return { role: "guest", guest };
}

async function notifyDesk(title, message, link = "/portal") {
  const staff = await User.find({ role: { $in: deskRoles }, status: "active" }).select("_id");
  if (!staff.length) return;
  await Notification.insertMany(
    staff.map((person) => ({
      recipientUserId: person._id,
      type: "desk_message",
      title,
      message,
      link,
    })),
  );
}

async function notifyGuest(guestUserId, title, message) {
  if (!guestUserId) return;
  await Notification.create({
    recipientUserId: guestUserId,
    type: "desk_message",
    title,
    message,
    link: "/messages",
  });
}

async function loadOpenNights({ roomType, reservationId, roomId }) {
  if (!roomType) return { availableSet: new Set(), hints: [] };
  const from = dayKey(new Date());
  const to = dayKey(addUtcMonths(new Date(), 3));
  try {
    const calendar = await calendarNights({
      roomType,
      from,
      to,
      ignoreReservationId: reservationId || undefined,
      roomId: roomId || undefined,
    });
    const open = Object.entries(calendar.nights || {})
      .filter(([, night]) => night && night.available)
      .map(([iso]) => iso);
    return { availableSet: new Set(open), hints: open.slice(0, 21) };
  } catch {
    return { availableSet: new Set(), hints: [] };
  }
}

/** Free nights for a guest date-change request (private — only for their room type / room). */
router.get("/open-nights", requireAuth, async (req, res, next) => {
  try {
    const roomType = String(req.query.roomType || "").trim();
    if (!roomType) {
      const error = new Error("Choose a room type.");
      error.status = 400;
      throw error;
    }
    let ignoreReservationId = req.query.reservationId || undefined;
    let roomId = req.query.roomId || undefined;
    if (req.user.role === "guest" && ignoreReservationId) {
      const guest = await guestForUser(req.user);
      const stay = await Reservation.findById(ignoreReservationId);
      if (!guest || !stay || String(stay.guestId) !== String(guest._id)) {
        const error = new Error("You do not have access to that stay.");
        error.status = 403;
        throw error;
      }
      roomId = stay.roomId ? String(stay.roomId) : roomId;
    }
    const from = req.query.from || dayKey(new Date());
    const to = req.query.to || dayKey(addUtcMonths(new Date(), 3));
    const calendar = await calendarNights({
      roomType,
      from,
      to,
      ignoreReservationId,
      roomId,
    });
    const openNights = Object.entries(calendar.nights || {})
      .filter(([, night]) => night && night.available)
      .map(([iso, night]) => ({ date: iso, price: night.price }));
    res.json({ roomType: calendar.roomType, nights: calendar.nights, openNights });
  } catch (error) {
    next(error);
  }
});

router.get("/threads", requireAuth, async (req, res, next) => {
  try {
    const filter = {};
    let includeGuest = false;
    if (isDesk(req.user)) {
      includeGuest = true;
      if (req.query.status) filter.status = req.query.status;
    } else if (req.user.role === "guest") {
      const guest = await guestForUser(req.user);
      if (!guest) return res.json({ threads: [] });
      filter.guestId = guest._id;
    } else {
      const error = new Error("Not allowed.");
      error.status = 403;
      throw error;
    }
    let query = DeskThread.find(filter).sort({ lastMessageAt: -1 }).limit(100);
    if (includeGuest) query = query.populate("guestId");
    const threads = await query;
    res.json({
      threads: threads.map((thread) => presentThread(thread, { includeGuest })),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/threads", requireAuth, async (req, res, next) => {
  try {
    const topic = String(req.body.topic || "general");
    const body = String(req.body.message || req.body.body || "").trim();
    const subject = String(req.body.subject || "").trim() || topicLabel(topic);
    if (body.length < 2) {
      const error = new Error("Write a short message for the desk.");
      error.status = 400;
      throw error;
    }

    let guest;
    let guestUserId = null;
    if (req.user.role === "guest") {
      guest = await guestForUser(req.user);
      guestUserId = req.user._id;
    } else if (isDesk(req.user) && req.body.guestId) {
      guest = await Guest.findById(req.body.guestId);
      guestUserId = guest?.userId || null;
    }
    if (!guest) {
      const error = new Error("Sign in as a guest to message the desk.");
      error.status = 403;
      throw error;
    }

    let reservation = null;
    if (req.body.reservationId) {
      reservation = await Reservation.findById(req.body.reservationId).populate("roomTypeId");
      if (!reservation || String(reservation.guestId) !== String(guest._id)) {
        const error = new Error("That stay was not found for your account.");
        error.status = 404;
        throw error;
      }
    }

    const roomType =
      String(req.body.roomType || "").trim() ||
      reservation?.roomTypeId?.name ||
      "";
    const requestedCheckIn = req.body.requestedCheckIn ? parseDay(req.body.requestedCheckIn) : undefined;
    const requestedCheckOut = req.body.requestedCheckOut ? parseDay(req.body.requestedCheckOut) : undefined;

    if (topic === "date_change" && requestedCheckIn && requestedCheckOut) {
      if (!(requestedCheckOut > requestedCheckIn)) {
        const error = new Error("Check-out must be after check-in.");
        error.status = 400;
        throw error;
      }
    }

    const { availableSet, hints } = await loadOpenNights({
      roomType,
      reservationId: reservation?._id,
      roomId: reservation?.roomId,
    });

    if (topic === "date_change" && requestedCheckIn && requestedCheckOut) {
      const nightsNeeded = [];
      let cursor = new Date(requestedCheckIn);
      while (cursor < requestedCheckOut) {
        nightsNeeded.push(dayKey(cursor));
        cursor = addUtcDays(cursor, 1);
      }
      const blocked = nightsNeeded.filter((iso) => !availableSet.has(iso));
      if (blocked.length) {
        const error = new Error(
          `Those dates include nights that are not free (${blocked.slice(0, 3).join(", ")}${blocked.length > 3 ? "…" : ""}). Pick from the open nights list.`,
        );
        error.status = 409;
        throw error;
      }
    }

    const thread = await DeskThread.create({
      guestId: guest._id,
      guestUserId,
      reservationId: reservation?._id,
      topic,
      subject,
      status: "awaiting_desk",
      requestedCheckIn,
      requestedCheckOut,
      roomType,
      openNightHints: hints,
      lastMessageAt: new Date(),
      guestLastReadAt: new Date(),
    });

    let messageBody = body;
    if (topic === "date_change" && requestedCheckIn && requestedCheckOut) {
      messageBody = `${body}\n\nRequested stay: ${dayKey(requestedCheckIn)} → ${dayKey(requestedCheckOut)}${
        roomType ? ` · ${roomType}` : ""
      }`;
    }
    if (hints.length) {
      messageBody += `\n\nOpen nights (sample): ${hints.slice(0, 10).join(", ")}${hints.length > 10 ? "…" : ""}`;
    }

    const message = await DeskMessage.create({
      threadId: thread._id,
      senderUserId: req.user._id,
      senderRole: req.user.role === "guest" ? "guest" : "desk",
      body: messageBody,
      meta: {
        proposedCheckIn: requestedCheckIn ? dayKey(requestedCheckIn) : undefined,
        proposedCheckOut: requestedCheckOut ? dayKey(requestedCheckOut) : undefined,
        openNightHints: hints,
      },
    });

    await notifyDesk(
      topic === "date_change" ? "Date change request" : "Guest message",
      `${guest.fullName || "Guest"}: ${subject}`,
      "/portal",
    );
    publish("desk_message");

    const populated = await DeskThread.findById(thread._id).populate("guestId");
    res.status(201).json({
      thread: presentThread(populated, { includeGuest: isDesk(req.user) }),
      message: presentMessage(message),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/threads/:id", requireAuth, async (req, res, next) => {
  try {
    const thread = await DeskThread.findById(req.params.id).populate("guestId");
    const access = await assertThreadAccess(thread, req.user);
    const messages = await DeskMessage.find({ threadId: thread._id }).sort({ createdAt: 1 });
    const now = new Date();
    if (access.role === "guest") {
      thread.guestLastReadAt = now;
      await thread.save();
    } else {
      thread.deskLastReadAt = now;
      await thread.save();
    }
    res.json({
      thread: presentThread(thread, { includeGuest: access.role === "desk" }),
      messages: messages.map(presentMessage),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/threads/:id/messages", requireAuth, async (req, res, next) => {
  try {
    const thread = await DeskThread.findById(req.params.id);
    const access = await assertThreadAccess(thread, req.user);
    const body = String(req.body.message || req.body.body || "").trim();
    if (body.length < 1) {
      const error = new Error("Write a reply.");
      error.status = 400;
      throw error;
    }
    if (thread.status === "closed") {
      const error = new Error("This conversation is closed.");
      error.status = 400;
      throw error;
    }

    const senderRole = access.role === "desk" ? "desk" : "guest";
    const message = await DeskMessage.create({
      threadId: thread._id,
      senderUserId: req.user._id,
      senderRole,
      body,
      meta: {
        proposedCheckIn: req.body.proposedCheckIn || undefined,
        proposedCheckOut: req.body.proposedCheckOut || undefined,
      },
    });
    thread.lastMessageAt = new Date();
    thread.status = senderRole === "desk" ? "awaiting_guest" : "awaiting_desk";
    if (senderRole === "guest") thread.guestLastReadAt = thread.lastMessageAt;
    else thread.deskLastReadAt = thread.lastMessageAt;
    await thread.save();

    if (senderRole === "guest") {
      await notifyDesk("Guest reply", body.slice(0, 120), "/portal");
    } else {
      await notifyGuest(thread.guestUserId, "Desk reply", body.slice(0, 120));
    }
    publish("desk_message");

    res.status(201).json({ message: presentMessage(message), thread: presentThread(thread, { includeGuest: senderRole === "desk" }) });
  } catch (error) {
    next(error);
  }
});

router.patch("/threads/:id", requireAuth, async (req, res, next) => {
  try {
    const thread = await DeskThread.findById(req.params.id).populate("guestId");
    const access = await assertThreadAccess(thread, req.user);
    if (access.role !== "desk" && req.body.status && req.body.status !== "closed") {
      const error = new Error("Only the desk can change that status.");
      error.status = 403;
      throw error;
    }
    if (req.body.status) {
      if (!["open", "awaiting_desk", "awaiting_guest", "closed"].includes(req.body.status)) {
        const error = new Error("Unknown status.");
        error.status = 400;
        throw error;
      }
      thread.status = req.body.status;
    }
    await thread.save();
    publish("desk_message");
    res.json({ thread: presentThread(thread, { includeGuest: access.role === "desk" }) });
  } catch (error) {
    next(error);
  }
});

function topicLabel(topic) {
  return (
    {
      date_change: "Date change request",
      stay: "Stay question",
      room: "Room question",
      dining: "Dining",
      spa: "Spa",
      arrival: "Arrival",
      general: "Message to the desk",
    }[topic] || "Message to the desk"
  );
}

module.exports = router;
