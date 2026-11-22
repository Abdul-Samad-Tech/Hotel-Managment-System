const crypto = require("crypto");
const {
  DiningMenuCategory,
  DiningMenuItem,
  DiningOrder,
  DiningTable,
  DiningTableBooking,
  Invoice,
  InvoiceItem,
  Reservation,
  Guest,
  Notification,
} = require("../models");
const { requireAuth, requireRole } = require("../middleware/auth");
const { resolveDiningEligibility, presentEligibility } = require("../lib/diningEligibility");
const { ensureDiningDefaults } = require("../lib/ensureDining");
const { publish } = require("../sockets");
const { parseDay } = require("../lib/dates");

const router = require("express").Router();
const desk = ["admin", "manager", "receptionist"];
const managers = ["admin", "manager"];

function money(cents) {
  return Math.round(cents || 0) / 100;
}

function toCents(value) {
  return Math.round(Number(value) * 100);
}

function presentCategory(category, items = []) {
  return {
    id: String(category._id),
    slug: category.slug,
    title: category.title,
    sortOrder: category.sortOrder,
    active: category.active,
    items: items.map(presentItem),
  };
}

function presentItem(item) {
  return {
    id: String(item._id),
    categoryId: String(item.categoryId),
    name: item.name,
    description: item.description || "",
    price: money(item.price),
    image: item.image || "",
    available: item.available !== false,
    sortOrder: item.sortOrder || 0,
    featured: Boolean(item.featured),
  };
}

function presentOrder(order, guest) {
  return {
    id: String(order._id),
    orderNumber: order.orderNumber,
    guestId: String(order.guestId),
    guestName: guest?.fullName || "",
    reservationId: String(order.reservationId),
    roomNumber: order.roomNumber || "",
    status: order.status,
    notes: order.notes || "",
    subtotal: money(order.subtotal),
    placedAt: order.placedAt,
    cancelledAt: order.cancelledAt || null,
    deliveredAt: order.deliveredAt || null,
    lines: (order.lines || []).map((line) => ({
      menuItemId: line.menuItemId ? String(line.menuItemId) : "",
      name: line.name,
      unitPrice: money(line.unitPrice),
      quantity: line.quantity,
      notes: line.notes || "",
      lineTotal: money(line.lineTotal),
    })),
  };
}

function presentTable(table) {
  return {
    id: String(table._id),
    label: table.label,
    capacity: table.capacity,
    zone: table.zone,
    status: table.status,
    active: table.active !== false,
    sortOrder: table.sortOrder || 0,
  };
}

function presentBooking(booking, guest, table) {
  return {
    id: String(booking._id),
    guestId: String(booking.guestId),
    guestName: guest?.fullName || "",
    reservationId: String(booking.reservationId),
    tableId: booking.tableId ? String(booking.tableId) : "",
    tableLabel: table?.label || "",
    partySize: booking.partySize,
    slot: booking.slot,
    date: booking.date,
    status: booking.status,
    notes: booking.notes || "",
    roomNumber: booking.roomNumber || "",
    createdAt: booking.createdAt,
  };
}

async function loadMenu({ includeInactive = false } = {}) {
  await ensureDiningDefaults();
  const catFilter = includeInactive ? {} : { active: true };
  const categories = await DiningMenuCategory.find(catFilter).sort({ sortOrder: 1, title: 1 });
  const itemFilter = includeInactive ? {} : { available: true };
  const items = await DiningMenuItem.find(itemFilter).sort({ sortOrder: 1, name: 1 });
  return categories.map((category) =>
    presentCategory(
      category,
      items.filter((item) => String(item.categoryId) === String(category._id)),
    ),
  );
}

async function chargeOrderToInvoice(order) {
  const invoice = await Invoice.findOne({
    reservationId: order.reservationId,
    status: { $nin: ["void", "paid"] },
  });
  if (!invoice) {
    const error = new Error("No open invoice for this stay. Ask the front desk.");
    error.status = 400;
    throw error;
  }

  const detail = order.lines
    .map((line) => `${line.quantity}× ${line.name}`)
    .join(", ")
    .slice(0, 220);
  const description = `Dining ${order.orderNumber}: ${detail}`;
  const lineTotal = order.subtotal;
  const item = await InvoiceItem.create({
    invoiceId: invoice._id,
    category: "dining",
    description,
    quantity: 1,
    unitPrice: lineTotal,
    taxRate: 0,
    lineTotal,
  });
  invoice.subtotal = (invoice.subtotal || 0) + lineTotal;
  invoice.grandTotal = (invoice.grandTotal || 0) + lineTotal;
  invoice.balanceDue = (invoice.balanceDue || 0) + lineTotal;
  if (invoice.status === "draft") invoice.status = "issued";
  await invoice.save();
  await Reservation.updateOne({ _id: order.reservationId }, { $inc: { totalAmount: lineTotal } });
  order.invoiceId = invoice._id;
  order.invoiceItemIds = [item._id];
  await order.save();
  return invoice;
}

async function reverseOrderCharges(order) {
  if (!order.invoiceItemIds?.length) return;
  const invoice = order.invoiceId ? await Invoice.findById(order.invoiceId) : null;
  if (!invoice || invoice.status === "void" || invoice.status === "paid") return;

  let removed = 0;
  for (const itemId of order.invoiceItemIds) {
    const item = await InvoiceItem.findById(itemId);
    if (!item) continue;
    removed += item.lineTotal || 0;
    await item.deleteOne();
  }
  if (!removed) return;
  invoice.subtotal = Math.max(0, (invoice.subtotal || 0) - removed);
  invoice.grandTotal = Math.max(0, (invoice.grandTotal || 0) - removed);
  invoice.balanceDue = Math.max(0, (invoice.balanceDue || 0) - removed);
  await invoice.save();
  await Reservation.updateOne({ _id: order.reservationId }, { $inc: { totalAmount: -removed } });
  order.invoiceItemIds = [];
  await order.save();
}

function nextStatuses(from) {
  const map = {
    placed: ["accepted", "cancelled"],
    accepted: ["preparing", "cancelled"],
    preparing: ["ready", "cancelled"],
    ready: ["delivered", "cancelled"],
    delivered: [],
    cancelled: [],
  };
  return map[from] || [];
}

// ——— Menu (public + staff) ———

router.get("/menu", async (req, res, next) => {
  try {
    const includeInactive = req.query.all === "1" && req.user && desk.includes(req.user.role);
    // Public always active-only; staff with ?all=1 needs auth — handled below via optional peek
    res.json({ categories: await loadMenu({ includeInactive: false }) });
  } catch (error) {
    next(error);
  }
});

router.get("/menu/admin", requireAuth, requireRole(...managers), async (req, res, next) => {
  try {
    res.json({ categories: await loadMenu({ includeInactive: true }) });
  } catch (error) {
    next(error);
  }
});

router.post("/categories", requireAuth, requireRole(...managers), async (req, res, next) => {
  try {
    const slug = String(req.body.slug || req.body.title || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    if (!slug || !req.body.title) {
      const error = new Error("Category title is required.");
      error.status = 400;
      throw error;
    }
    const category = await DiningMenuCategory.create({
      slug,
      title: String(req.body.title).trim(),
      sortOrder: Number(req.body.sortOrder || 0),
      active: req.body.active !== false,
    });
    publish("dining");
    res.status(201).json({ category: presentCategory(category, []) });
  } catch (error) {
    if (error.code === 11000) {
      error.message = "That category slug already exists.";
      error.status = 409;
    }
    next(error);
  }
});

router.patch("/categories/:id", requireAuth, requireRole(...managers), async (req, res, next) => {
  try {
    const category = await DiningMenuCategory.findById(req.params.id);
    if (!category) {
      const error = new Error("Category not found.");
      error.status = 404;
      throw error;
    }
    if (req.body.title !== undefined) category.title = String(req.body.title).trim();
    if (req.body.sortOrder !== undefined) category.sortOrder = Number(req.body.sortOrder);
    if (req.body.active !== undefined) category.active = Boolean(req.body.active);
    await category.save();
    publish("dining");
    const items = await DiningMenuItem.find({ categoryId: category._id }).sort({ sortOrder: 1 });
    res.json({ category: presentCategory(category, items) });
  } catch (error) {
    next(error);
  }
});

router.post("/items", requireAuth, requireRole(...managers), async (req, res, next) => {
  try {
    const category = await DiningMenuCategory.findById(req.body.categoryId);
    if (!category) {
      const error = new Error("Category not found.");
      error.status = 404;
      throw error;
    }
    if (!req.body.name || req.body.price === undefined) {
      const error = new Error("Name and price are required.");
      error.status = 400;
      throw error;
    }
    const item = await DiningMenuItem.create({
      categoryId: category._id,
      name: String(req.body.name).trim(),
      description: String(req.body.description || "").trim(),
      price: toCents(req.body.price),
      image: req.body.image || "",
      available: req.body.available !== false,
      featured: Boolean(req.body.featured),
      sortOrder: Number(req.body.sortOrder || 0),
    });
    publish("dining");
    res.status(201).json({ item: presentItem(item) });
  } catch (error) {
    next(error);
  }
});

router.patch("/items/:id", requireAuth, requireRole(...managers), async (req, res, next) => {
  try {
    const item = await DiningMenuItem.findById(req.params.id);
    if (!item) {
      const error = new Error("Menu item not found.");
      error.status = 404;
      throw error;
    }
    if (req.body.name !== undefined) item.name = String(req.body.name).trim();
    if (req.body.description !== undefined) item.description = String(req.body.description).trim();
    if (req.body.price !== undefined) item.price = toCents(req.body.price);
    if (req.body.image !== undefined) item.image = req.body.image || "";
    if (req.body.available !== undefined) item.available = Boolean(req.body.available);
    if (req.body.featured !== undefined) item.featured = Boolean(req.body.featured);
    if (req.body.sortOrder !== undefined) item.sortOrder = Number(req.body.sortOrder);
    if (req.body.categoryId) item.categoryId = req.body.categoryId;
    await item.save();
    publish("dining");
    res.json({ item: presentItem(item) });
  } catch (error) {
    next(error);
  }
});

// ——— Eligibility ———

router.get("/eligibility", requireAuth, async (req, res, next) => {
  try {
    const result = await resolveDiningEligibility(req.user);
    res.json(presentEligibility(result));
  } catch (error) {
    next(error);
  }
});

// ——— Orders ———

router.get("/orders", requireAuth, async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === "guest") {
      const guest = await Guest.findOne({ userId: req.user._id });
      if (!guest) return res.json({ orders: [] });
      filter.guestId = guest._id;
    } else if (!desk.includes(req.user.role)) {
      const error = new Error("Not allowed.");
      error.status = 403;
      throw error;
    } else if (req.query.status) {
      filter.status = req.query.status;
    }
    const orders = await DiningOrder.find(filter).sort({ placedAt: -1 }).limit(200);
    const guestIds = [...new Set(orders.map((order) => String(order.guestId)))];
    const guests = await Guest.find({ _id: { $in: guestIds } });
    const byId = Object.fromEntries(guests.map((guest) => [String(guest._id), guest]));
    res.json({ orders: orders.map((order) => presentOrder(order, byId[String(order.guestId)])) });
  } catch (error) {
    next(error);
  }
});

router.post("/orders", requireAuth, async (req, res, next) => {
  try {
    const eligibility = await resolveDiningEligibility(req.user);
    if (!eligibility.ok) {
      const error = new Error(eligibility.reason || "Not eligible to order.");
      error.status = 403;
      throw error;
    }

    const rawLines = Array.isArray(req.body.lines) ? req.body.lines : [];
    if (!rawLines.length) {
      const error = new Error("Add at least one menu item.");
      error.status = 400;
      throw error;
    }

    const lines = [];
    let subtotal = 0;
    for (const row of rawLines) {
      const qty = Math.max(1, Math.min(20, Number(row.quantity || 1)));
      const menuItem = await DiningMenuItem.findById(row.menuItemId);
      if (!menuItem || !menuItem.available) {
        const error = new Error("One or more items are not available.");
        error.status = 400;
        throw error;
      }
      const category = await DiningMenuCategory.findById(menuItem.categoryId);
      if (!category || !category.active) {
        const error = new Error("One or more items are not available.");
        error.status = 400;
        throw error;
      }
      const lineTotal = menuItem.price * qty;
      subtotal += lineTotal;
      lines.push({
        menuItemId: menuItem._id,
        name: menuItem.name,
        unitPrice: menuItem.price,
        quantity: qty,
        notes: String(row.notes || "").slice(0, 200),
        lineTotal,
      });
    }

    const order = await DiningOrder.create({
      orderNumber: `DIN-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
      guestId: eligibility.guest._id,
      reservationId: eligibility.reservation._id,
      roomNumber: eligibility.roomNumber,
      status: "placed",
      lines,
      subtotal,
      notes: String(req.body.notes || "").slice(0, 500),
      placedAt: new Date(),
    });

    await chargeOrderToInvoice(order);

    const { User } = require("../models");
    const staff = await User.find({ role: { $in: desk }, status: "active" }).select("_id");
    if (staff.length) {
      await Notification.insertMany(
        staff.map((user) => ({
          recipientUserId: user._id,
          type: "dining_order",
          title: "New dining order",
          message: `${order.orderNumber} · Room ${order.roomNumber || "—"} · $${money(order.subtotal)}`,
          link: "/portal?tab=dining",
        })),
      );
    }

    publish("dining");
    res.status(201).json({ order: presentOrder(order, eligibility.guest) });
  } catch (error) {
    next(error);
  }
});

router.post("/orders/:id/cancel", requireAuth, async (req, res, next) => {
  try {
    const order = await DiningOrder.findById(req.params.id);
    if (!order) {
      const error = new Error("Order not found.");
      error.status = 404;
      throw error;
    }

    const isDesk = desk.includes(req.user.role);
    if (!isDesk) {
      const eligibility = await resolveDiningEligibility(req.user);
      if (!eligibility.ok || String(order.guestId) !== String(eligibility.guest._id)) {
        const error = new Error("Not allowed to cancel this order.");
        error.status = 403;
        throw error;
      }
      if (order.status !== "placed") {
        const error = new Error("Only newly placed orders can be cancelled by the guest.");
        error.status = 400;
        throw error;
      }
    } else if (!nextStatuses(order.status).includes("cancelled") && order.status !== "placed") {
      if (["delivered", "cancelled"].includes(order.status)) {
        const error = new Error("This order cannot be cancelled.");
        error.status = 400;
        throw error;
      }
    }

    if (order.status === "cancelled") {
      return res.json({ order: presentOrder(order) });
    }

    if (order.status !== "delivered") {
      await reverseOrderCharges(order);
    }
    order.status = "cancelled";
    order.cancelledAt = new Date();
    await order.save();
    publish("dining");
    const guest = await Guest.findById(order.guestId);
    res.json({ order: presentOrder(order, guest) });
  } catch (error) {
    next(error);
  }
});

router.patch("/orders/:id", requireAuth, requireRole(...desk), async (req, res, next) => {
  try {
    const order = await DiningOrder.findById(req.params.id);
    if (!order) {
      const error = new Error("Order not found.");
      error.status = 404;
      throw error;
    }
    const nextStatus = req.body.status;
    if (!nextStatus) {
      const error = new Error("Status is required.");
      error.status = 400;
      throw error;
    }
    if (nextStatus === "cancelled") {
      if (["delivered", "cancelled"].includes(order.status)) {
        const error = new Error("This order cannot be cancelled.");
        error.status = 400;
        throw error;
      }
      if (order.status !== "delivered") await reverseOrderCharges(order);
      order.status = "cancelled";
      order.cancelledAt = new Date();
      await order.save();
      publish("dining");
      const guest = await Guest.findById(order.guestId);
      return res.json({ order: presentOrder(order, guest) });
    }
    const allowed = nextStatuses(order.status);
    if (!allowed.includes(nextStatus)) {
      const error = new Error(`Cannot move from ${order.status} to ${nextStatus}.`);
      error.status = 400;
      throw error;
    }
    order.status = nextStatus;
    if (nextStatus === "delivered") order.deliveredAt = new Date();
    await order.save();
    publish("dining");
    const guest = await Guest.findById(order.guestId);
    res.json({ order: presentOrder(order, guest) });
  } catch (error) {
    next(error);
  }
});

// ——— Tables ———

router.get("/tables", requireAuth, requireRole(...desk), async (req, res, next) => {
  try {
    await ensureDiningDefaults();
    const tables = await DiningTable.find().sort({ sortOrder: 1, label: 1 });
    res.json({ tables: tables.map(presentTable) });
  } catch (error) {
    next(error);
  }
});

router.post("/tables", requireAuth, requireRole(...managers), async (req, res, next) => {
  try {
    if (!req.body.label) {
      const error = new Error("Table label is required.");
      error.status = 400;
      throw error;
    }
    const table = await DiningTable.create({
      label: String(req.body.label).trim(),
      capacity: Number(req.body.capacity || 4),
      zone: String(req.body.zone || "terrace").trim(),
      status: req.body.status || "free",
      active: req.body.active !== false,
      sortOrder: Number(req.body.sortOrder || 0),
    });
    publish("dining");
    res.status(201).json({ table: presentTable(table) });
  } catch (error) {
    if (error.code === 11000) {
      error.message = "That table label already exists.";
      error.status = 409;
    }
    next(error);
  }
});

router.patch("/tables/:id", requireAuth, requireRole(...desk), async (req, res, next) => {
  try {
    const table = await DiningTable.findById(req.params.id);
    if (!table) {
      const error = new Error("Table not found.");
      error.status = 404;
      throw error;
    }
    if (req.body.label !== undefined && managers.includes(req.user.role)) table.label = String(req.body.label).trim();
    if (req.body.capacity !== undefined && managers.includes(req.user.role)) table.capacity = Number(req.body.capacity);
    if (req.body.zone !== undefined && managers.includes(req.user.role)) table.zone = String(req.body.zone).trim();
    if (req.body.active !== undefined && managers.includes(req.user.role)) table.active = Boolean(req.body.active);
    if (req.body.status !== undefined) {
      if (!["free", "seated", "reserved", "blocked"].includes(req.body.status)) {
        const error = new Error("Unknown table status.");
        error.status = 400;
        throw error;
      }
      table.status = req.body.status;
    }
    await table.save();
    publish("dining");
    res.json({ table: presentTable(table) });
  } catch (error) {
    next(error);
  }
});

router.get("/table-bookings", requireAuth, async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === "guest") {
      const guest = await Guest.findOne({ userId: req.user._id });
      if (!guest) return res.json({ bookings: [] });
      filter.guestId = guest._id;
    } else if (!desk.includes(req.user.role)) {
      const error = new Error("Not allowed.");
      error.status = 403;
      throw error;
    } else if (req.query.status) {
      filter.status = req.query.status;
    }
    const bookings = await DiningTableBooking.find(filter).sort({ date: 1, createdAt: -1 }).limit(200);
    const guestIds = [...new Set(bookings.map((row) => String(row.guestId)))];
    const tableIds = bookings.map((row) => row.tableId).filter(Boolean);
    const guests = await Guest.find({ _id: { $in: guestIds } });
    const tables = await DiningTable.find({ _id: { $in: tableIds } });
    const guestById = Object.fromEntries(guests.map((guest) => [String(guest._id), guest]));
    const tableById = Object.fromEntries(tables.map((table) => [String(table._id), table]));
    res.json({
      bookings: bookings.map((row) =>
        presentBooking(row, guestById[String(row.guestId)], tableById[String(row.tableId || "")]),
      ),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/table-bookings", requireAuth, async (req, res, next) => {
  try {
    const eligibility = await resolveDiningEligibility(req.user);
    if (!eligibility.ok) {
      const error = new Error(eligibility.reason || "Not eligible to reserve a table.");
      error.status = 403;
      throw error;
    }
    const slot = req.body.slot;
    if (!["Breakfast", "Lunch", "Dinner"].includes(slot)) {
      const error = new Error("Choose Breakfast, Lunch, or Dinner.");
      error.status = 400;
      throw error;
    }
    const date = parseDay(req.body.date) || (req.body.date ? new Date(req.body.date) : null);
    if (!date || Number.isNaN(date.getTime())) {
      const error = new Error("Choose a valid date.");
      error.status = 400;
      throw error;
    }
    const partySize = Math.max(1, Math.min(20, Number(req.body.partySize || 2)));
    const booking = await DiningTableBooking.create({
      guestId: eligibility.guest._id,
      reservationId: eligibility.reservation._id,
      partySize,
      slot,
      date,
      status: "requested",
      notes: String(req.body.notes || "").slice(0, 300),
      roomNumber: eligibility.roomNumber,
    });
    publish("dining");
    res.status(201).json({ booking: presentBooking(booking, eligibility.guest, null) });
  } catch (error) {
    next(error);
  }
});

router.patch("/table-bookings/:id", requireAuth, requireRole(...desk), async (req, res, next) => {
  try {
    const booking = await DiningTableBooking.findById(req.params.id);
    if (!booking) {
      const error = new Error("Table booking not found.");
      error.status = 404;
      throw error;
    }
    if (req.body.status !== undefined) {
      if (!["requested", "seated", "completed", "cancelled", "no_show"].includes(req.body.status)) {
        const error = new Error("Unknown booking status.");
        error.status = 400;
        throw error;
      }
      booking.status = req.body.status;
    }
    if (req.body.tableId !== undefined) {
      booking.tableId = req.body.tableId || undefined;
      if (req.body.tableId) {
        await DiningTable.updateOne({ _id: req.body.tableId }, { status: booking.status === "seated" ? "seated" : "reserved" });
      }
    }
    if (booking.status === "seated" && booking.tableId) {
      await DiningTable.updateOne({ _id: booking.tableId }, { status: "seated" });
    }
    if (["completed", "cancelled", "no_show"].includes(booking.status) && booking.tableId) {
      await DiningTable.updateOne({ _id: booking.tableId }, { status: "free" });
    }
    await booking.save();
    publish("dining");
    const guest = await Guest.findById(booking.guestId);
    const table = booking.tableId ? await DiningTable.findById(booking.tableId) : null;
    res.json({ booking: presentBooking(booking, guest, table) });
  } catch (error) {
    next(error);
  }
});

// ——— Reports ———

router.get("/reports/summary", requireAuth, requireRole(...managers), async (req, res, next) => {
  try {
    const from = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = req.query.to ? new Date(req.query.to) : new Date();
    const filter = { placedAt: { $gte: from, $lte: to }, status: { $ne: "cancelled" } };
    const orders = await DiningOrder.find(filter);
    const revenueCents = orders.reduce((sum, order) => sum + (order.subtotal || 0), 0);
    const byStatus = {};
    const itemCounts = {};
    for (const order of orders) {
      byStatus[order.status] = (byStatus[order.status] || 0) + 1;
      for (const line of order.lines || []) {
        const key = line.name;
        itemCounts[key] = itemCounts[key] || { name: key, quantity: 0, revenue: 0 };
        itemCounts[key].quantity += line.quantity;
        itemCounts[key].revenue += line.lineTotal || 0;
      }
    }
    const popular = Object.values(itemCounts)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)
      .map((row) => ({ name: row.name, quantity: row.quantity, revenue: money(row.revenue) }));

    const tableBookings = await DiningTableBooking.countDocuments({
      createdAt: { $gte: from, $lte: to },
      status: { $nin: ["cancelled"] },
    });

    res.json({
      from,
      to,
      orderCount: orders.length,
      revenue: money(revenueCents),
      byStatus,
      popular,
      tableBookings,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
