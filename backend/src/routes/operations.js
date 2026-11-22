const {
  HousekeepingTask,
  MaintenanceTicket,
  ServiceRequest,
  Feedback,
  Guest,
  Room,
  User,
  Notification,
  Reservation,
} = require("../models");
const { requireAuth, requireRole } = require("../middleware/auth");
const { publish } = require("../sockets");
const { resolveInHouseStay } = require("../lib/inHouseStay");
const { notifyHousekeepingStaff } = require("../lib/housekeepingNotify");

const router = require("express").Router();

const typeLabel = {
  "checkout-clean": "Check-out clean",
  guest_makeup: "Guest make-up",
  dnd: "Do not disturb",
  stayover: "Stayover",
};

function guestStatusLabel(task) {
  if (task.type === "dnd" && task.status !== "completed") return "Do not disturb active";
  if (task.status === "assigned") return "Requested";
  if (task.status === "in_progress") return "In progress";
  if (task.status === "blocked") return "Blocked";
  if (task.status === "completed") return "Done";
  return task.status;
}

function presentHouseTask(task) {
  return {
    id: task._id,
    roomNumber: task.roomId?.roomNumber || "",
    roomId: task.roomId?._id || task.roomId,
    reservationId: task.reservationId ? String(task.reservationId) : "",
    guestId: task.guestId ? String(task.guestId) : "",
    type: task.type,
    typeLabel: typeLabel[task.type] || task.type,
    source: task.source || "desk",
    priority: task.priority,
    status: task.status,
    guestStatus: guestStatusLabel(task),
    notes: task.notes || "",
    assignedTo: task.assignedTo?.fullName || "",
    assignedToId: task.assignedTo?._id || "",
    createdAt: task.createdAt,
  };
}

function shouldFreeRoomOnComplete(task) {
  return task.type === "checkout-clean" || task.source === "checkout";
}

router.get("/housekeeping/tasks", requireAuth, requireRole("admin", "manager", "housekeeping", "receptionist"), async (req, res, next) => {
  try {
    // Housekeepers: only unassigned pool + their own assignments.
    // Admin / manager / receptionist: full floor board.
    const filter =
      req.user.role === "housekeeping"
        ? { $or: [{ assignedTo: { $exists: false } }, { assignedTo: null }, { assignedTo: req.user._id }] }
        : {};
    const tasks = await HousekeepingTask.find(filter).populate("roomId").populate("assignedTo", "fullName").sort({ createdAt: -1 });
    res.json({ tasks: tasks.map(presentHouseTask) });
  } catch (error) {
    next(error);
  }
});

router.get("/housekeeping/my-requests", requireAuth, async (req, res, next) => {
  try {
    if (req.user.role !== "guest") {
      const error = new Error("Guests only.");
      error.status = 403;
      throw error;
    }
    const stay = await resolveInHouseStay(req.user);
    const guest = stay.guest || (await Guest.findOne({ userId: req.user._id }));
    if (!guest) return res.json({ canRequest: false, reason: stay.reason || "Guest profile required.", requests: [] });

    const filter = {
      guestId: guest._id,
      type: { $in: ["guest_makeup", "dnd"] },
    };
    if (stay.ok) filter.reservationId = stay.reservation._id;

    const tasks = await HousekeepingTask.find(filter).populate("roomId").sort({ createdAt: -1 }).limit(20);
    res.json({
      canRequest: Boolean(stay.ok),
      reason: stay.reason || "",
      roomNumber: stay.roomNumber || "",
      reservationId: stay.reservationId || null,
      requests: tasks.map(presentHouseTask),
      dndActive: tasks.some((task) => task.type === "dnd" && task.status !== "completed"),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/housekeeping/guest-request", requireAuth, async (req, res, next) => {
  try {
    if (req.user.role !== "guest") {
      const error = new Error("Guests only.");
      error.status = 403;
      throw error;
    }
    const stay = await resolveInHouseStay(req.user);
    if (!stay.ok) {
      const error = new Error(stay.reason || "Not eligible.");
      error.status = 403;
      throw error;
    }

    const action = req.body.action;
    const notes = String(req.body.notes || "").slice(0, 300);

    if (action === "makeup") {
      const dnd = await HousekeepingTask.findOne({
        reservationId: stay.reservation._id,
        type: "dnd",
        status: { $ne: "completed" },
      });
      if (dnd) {
        const error = new Error("Turn off Do not disturb before requesting room cleaning.");
        error.status = 409;
        throw error;
      }
      const openMakeup = await HousekeepingTask.findOne({
        reservationId: stay.reservation._id,
        type: "guest_makeup",
        status: { $in: ["assigned", "in_progress", "blocked"] },
      });
      if (openMakeup) {
        const error = new Error("You already have an open cleaning request.");
        error.status = 409;
        throw error;
      }
      const task = await HousekeepingTask.create({
        roomId: stay.reservation.roomId,
        reservationId: stay.reservation._id,
        guestId: stay.guest._id,
        type: "guest_makeup",
        source: "guest",
        priority: "normal",
        status: "assigned",
        scheduledFor: new Date(),
        notes: notes || "Guest requested room cleaning.",
      });
      await notifyHousekeepingStaff(
        "Guest make-up request",
        `Room ${stay.roomNumber} · cleaning requested`,
      );
      publish("housekeeping");
      const populated = await HousekeepingTask.findById(task._id).populate("roomId");
      return res.status(201).json({ request: presentHouseTask(populated) });
    }

    if (action === "dnd") {
      const existing = await HousekeepingTask.findOne({
        reservationId: stay.reservation._id,
        type: "dnd",
        status: { $ne: "completed" },
      });
      if (existing) {
        return res.json({ request: presentHouseTask(await HousekeepingTask.findById(existing._id).populate("roomId")) });
      }
      await HousekeepingTask.updateMany(
        {
          reservationId: stay.reservation._id,
          type: "guest_makeup",
          status: { $in: ["assigned", "in_progress", "blocked"] },
        },
        {
          status: "completed",
          completedAt: new Date(),
          notes: "Superseded by Do not disturb.",
        },
      );
      const task = await HousekeepingTask.create({
        roomId: stay.reservation.roomId,
        reservationId: stay.reservation._id,
        guestId: stay.guest._id,
        type: "dnd",
        source: "guest",
        priority: "high",
        status: "blocked",
        scheduledFor: new Date(),
        notes: notes || "Do not disturb — do not enter.",
      });
      await notifyHousekeepingStaff("Do not disturb", `Room ${stay.roomNumber} · DND set by guest`);
      publish("housekeeping");
      const populated = await HousekeepingTask.findById(task._id).populate("roomId");
      return res.status(201).json({ request: presentHouseTask(populated) });
    }

    if (action === "clear_dnd") {
      const dnd = await HousekeepingTask.findOne({
        reservationId: stay.reservation._id,
        type: "dnd",
        status: { $ne: "completed" },
      });
      if (!dnd) {
        const error = new Error("No active Do not disturb.");
        error.status = 404;
        throw error;
      }
      dnd.status = "completed";
      dnd.completedAt = new Date();
      dnd.notes = (dnd.notes || "") + " · Cleared by guest.";
      await dnd.save();
      publish("housekeeping");
      const populated = await HousekeepingTask.findById(dnd._id).populate("roomId");
      return res.json({ request: presentHouseTask(populated) });
    }

    const error = new Error("Unknown action. Use makeup, dnd, or clear_dnd.");
    error.status = 400;
    throw error;
  } catch (error) {
    next(error);
  }
});

router.post("/housekeeping/tasks", requireAuth, requireRole("admin", "manager", "receptionist", "housekeeping"), async (req, res, next) => {
  try {
    const task = await HousekeepingTask.create({
      roomId: req.body.roomId,
      type: req.body.type || "stayover",
      source: req.body.source || "desk",
      priority: req.body.priority || "normal",
      notes: req.body.notes || "",
      scheduledFor: new Date(),
      assignedTo: req.user.role === "housekeeping" ? req.user._id : undefined,
      reservationId: req.body.reservationId || undefined,
      guestId: req.body.guestId || undefined,
    });
    publish("housekeeping");
    const populated = await HousekeepingTask.findById(task._id).populate("roomId").populate("assignedTo", "fullName");
    res.status(201).json({ task: presentHouseTask(populated) });
  } catch (error) {
    next(error);
  }
});

router.patch("/housekeeping/tasks/:id", requireAuth, requireRole("admin", "manager", "housekeeping"), async (req, res, next) => {
  try {
    const task = await HousekeepingTask.findById(req.params.id);
    if (!task) {
      const error = new Error("Task not found.");
      error.status = 404;
      throw error;
    }
    if (req.user.role === "housekeeping") {
      const mine = task.assignedTo && String(task.assignedTo) === String(req.user._id);
      const openPool = !task.assignedTo;
      if (!mine && !openPool) {
        const error = new Error("This task is assigned to someone else.");
        error.status = 403;
        throw error;
      }
      // Housekeepers may claim an unassigned task or keep working their own — not reassign to others.
      if (req.body.assignedTo && String(req.body.assignedTo) !== String(req.user._id)) {
        const error = new Error("Only a manager can reassign this task.");
        error.status = 403;
        throw error;
      }
      if (openPool && (req.body.status || req.body.assignedTo)) {
        task.assignedTo = req.user._id;
      }
    }
    if (req.body.assignedTo && ["admin", "manager"].includes(req.user.role)) {
      task.assignedTo = req.body.assignedTo;
    }
    task.status = req.body.status || task.status;
    if (task.status === "in_progress") task.startedAt = new Date();
    if (task.status === "completed") {
      task.completedAt = new Date();
      // Only free the room after check-out cleans — never for in-house guest makeup/DND.
      if (shouldFreeRoomOnComplete(task)) {
        await Room.updateOne({ _id: task.roomId }, { status: "available" });
      }
    }
    if (task.status === "blocked" && req.body.notes) task.notes = req.body.notes;
    await task.save();
    publish("housekeeping");
    const populated = await HousekeepingTask.findById(task._id).populate("roomId").populate("assignedTo", "fullName");
    res.json({ task: presentHouseTask(populated) });
  } catch (error) {
    next(error);
  }
});

router.get("/maintenance/tickets", requireAuth, requireRole("admin", "manager", "maintenance", "receptionist"), async (req, res, next) => {
  try {
    const tickets = await MaintenanceTicket.find().populate("roomId").populate("assignedTo", "fullName").sort({ openedAt: -1 });
    res.json({
      tickets: tickets.map((ticket) => ({
        id: ticket._id,
        roomNumber: ticket.roomId?.roomNumber,
        roomId: ticket.roomId?._id,
        category: ticket.category,
        priority: ticket.priority,
        description: ticket.description,
        status: ticket.status,
        resolutionNote: ticket.resolutionNote || "",
        assignedTo: ticket.assignedTo?.fullName || "",
        assignedToId: ticket.assignedTo?._id || "",
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/maintenance/tickets", requireAuth, async (req, res, next) => {
  try {
    const ticket = await MaintenanceTicket.create({
      roomId: req.body.roomId || undefined,
      reportedBy: req.user._id,
      category: req.body.category || "general",
      priority: req.body.priority || "normal",
      description: req.body.description,
      status: "open",
    });
    if (req.body.roomId) await Room.updateOne({ _id: req.body.roomId }, { status: "maintenance" });
    const staff = await User.find({ role: { $in: ["maintenance", "manager"] }, status: "active" });
    await Notification.insertMany(
      staff.map((person) => ({
        recipientUserId: person._id,
        type: "maintenance",
        title: "Maintenance request",
        message: ticket.description,
        link: "/portal",
      })),
    );
    publish("maintenance");
    res.status(201).json({ ticket });
  } catch (error) {
    next(error);
  }
});

router.patch("/maintenance/tickets/:id", requireAuth, requireRole("admin", "manager", "maintenance"), async (req, res, next) => {
  try {
    const ticket = await MaintenanceTicket.findById(req.params.id);
    if (!ticket) {
      const error = new Error("Ticket not found.");
      error.status = 404;
      throw error;
    }
    if (req.body.assignedTo) {
      ticket.assignedTo = req.body.assignedTo;
      if (!req.body.status && ticket.status === "open") ticket.status = "assigned";
    }
    ticket.status = req.body.status || ticket.status;
    if (req.body.resolutionNote) ticket.resolutionNote = req.body.resolutionNote;
    if (["resolved", "closed"].includes(ticket.status)) {
      ticket.resolvedAt = new Date();
      if (ticket.roomId) await Room.updateOne({ _id: ticket.roomId, status: "maintenance" }, { status: "available" });
    }
    await ticket.save();
    publish("maintenance");
    res.json({ ticket });
  } catch (error) {
    next(error);
  }
});

router.get("/service-requests", requireAuth, async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === "guest") {
      const guest = await Guest.findOne({ userId: req.user._id });
      filter.guestId = guest?._id;
    }
    const requests = await ServiceRequest.find(filter).sort({ requestedAt: -1 });
    res.json({ requests });
  } catch (error) {
    next(error);
  }
});

router.post("/service-requests", requireAuth, async (req, res, next) => {
  try {
    let guestId = req.body.guestId;
    let reservationId = req.body.reservationId;
    if (req.user.role === "guest") {
      const guest = await Guest.findOne({ userId: req.user._id });
      guestId = guest?._id;
      const stay = await Reservation.findOne({ guestId, status: { $in: ["confirmed", "checked_in"] } });
      reservationId = stay?._id;
    }
    if (!guestId) {
      const error = new Error("A guest profile is required.");
      error.status = 400;
      throw error;
    }
    const request = await ServiceRequest.create({
      guestId,
      reservationId,
      type: req.body.type,
      description: req.body.description,
      priority: req.body.priority || "normal",
    });
    const desk = await User.find({ role: { $in: ["receptionist", "manager"] }, status: "active" });
    await Notification.insertMany(
      desk.map((person) => ({
        recipientUserId: person._id,
        type: "service",
        title: req.body.type,
        message: req.body.description || "A guest asked for a service.",
        link: "/portal",
      })),
    );
    res.status(201).json({ request });
  } catch (error) {
    next(error);
  }
});

router.patch("/service-requests/:id", requireAuth, requireRole("admin", "manager", "receptionist"), async (req, res, next) => {
  try {
    const request = await ServiceRequest.findById(req.params.id);
    if (!request) {
      const error = new Error("Request not found.");
      error.status = 404;
      throw error;
    }
    request.status = req.body.status || request.status;
    if (request.status === "completed") request.completedAt = new Date();
    await request.save();
    res.json({ request });
  } catch (error) {
    next(error);
  }
});

router.get("/public/stay-policies", async (req, res, next) => {
  try {
    const { Setting } = require("../models");
    const { DEFAULT_STAY_POLICIES } = require("../lib/ensureDefaults");
    const row = await Setting.findOne({ key: "stayPolicies" });
    const policies = Array.isArray(row?.value) && row.value.length ? row.value : DEFAULT_STAY_POLICIES;
    res.json({
      policies: policies.map((item, index) => ({
        id: String(item.id || item.value || `policy-${index + 1}`),
        title: String(item.title || "Policy"),
        body: String(item.body || ""),
      })),
    });
  } catch (error) {
    next(error);
  }
});

function mapFeedbackRow(row) {
  return {
    id: row._id,
    rating: row.rating,
    title: row.title,
    comment: row.comment,
    guest: row.guestId?.fullName || "Guest",
    published: Boolean(row.published),
    createdAt: row.createdAt,
  };
}

router.get("/feedback", async (req, res, next) => {
  try {
    const rows = await Feedback.find({ published: true }).populate("guestId").sort({ createdAt: -1 }).limit(50);
    res.json({ feedback: rows.map(mapFeedbackRow) });
  } catch (error) {
    next(error);
  }
});

router.get("/feedback/manage", requireAuth, requireRole("admin", "manager"), async (req, res, next) => {
  try {
    const rows = await Feedback.find().populate("guestId").sort({ createdAt: -1 }).limit(100);
    res.json({ feedback: rows.map(mapFeedbackRow) });
  } catch (error) {
    next(error);
  }
});

router.post("/feedback", requireAuth, async (req, res, next) => {
  try {
    const guest = await Guest.findOne({ userId: req.user._id });
    if (!guest && req.user.role === "guest") {
      const error = new Error("Guest profile not found.");
      error.status = 400;
      throw error;
    }
    const guestId = guest?._id || req.body.guestId;
    const row = await Feedback.create({
      guestId,
      rating: Number(req.body.rating),
      title: req.body.title,
      comment: req.body.comment,
      published: false,
    });
    res.status(201).json({ feedback: row });
  } catch (error) {
    next(error);
  }
});

router.patch("/feedback/:id", requireAuth, requireRole("admin", "manager"), async (req, res, next) => {
  try {
    const row = await Feedback.findById(req.params.id);
    if (!row) {
      const error = new Error("Feedback not found.");
      error.status = 404;
      throw error;
    }
    if (typeof req.body.published === "boolean") row.published = req.body.published;
    await row.save();
    res.json({
      feedback: {
        id: row._id,
        rating: row.rating,
        title: row.title,
        comment: row.comment,
        published: Boolean(row.published),
        createdAt: row.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
