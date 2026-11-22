const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: String,
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "manager", "receptionist", "housekeeping", "maintenance", "guest"],
      default: "guest",
    },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    lastLoginAt: Date,
    refreshTokenHash: String,
    roleIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Role" }],
  },
  { timestamps: true },
);

const guestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    fullName: { type: String, required: true },
    email: { type: String, required: true, index: true },
    phone: String,
    nationality: String,
    preferences: [String],
    notes: String,
    idProof: String,
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true },
);

guestSchema.index({ phone: 1 });

const roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    permissions: [String],
  },
  { timestamps: true },
);

const roomTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: String,
    baseRate: { type: Number, required: true },
    maxAdults: Number,
    maxChildren: Number,
    bedType: String,
    amenities: [String],
    gallery: [String],
    image: String,
    featured: Boolean,
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const roomSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: true, unique: true },
    roomTypeId: { type: mongoose.Schema.Types.ObjectId, ref: "RoomType", required: true, index: true },
    floor: Number,
    status: {
      type: String,
      enum: ["available", "reserved", "occupied", "cleaning", "maintenance", "out_of_service"],
      default: "available",
      index: true,
    },
    features: [String],
    maintenanceNote: String,
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const reservationSchema = new mongoose.Schema(
  {
    confirmationCode: { type: String, required: true, unique: true },
    guestId: { type: mongoose.Schema.Types.ObjectId, ref: "Guest", required: true, index: true },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room" },
    roomTypeId: { type: mongoose.Schema.Types.ObjectId, ref: "RoomType", required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    adults: Number,
    children: Number,
    status: {
      type: String,
      enum: ["pending", "confirmed", "checked_in", "checked_out", "cancelled", "no_show"],
      default: "confirmed",
      index: true,
    },
    source: { type: String, default: "website" },
    nightlyRate: Number,
    taxes: Number,
    discount: { type: Number, default: 0 },
    totalAmount: Number,
    specialRequests: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

roomSchema.index({ roomTypeId: 1, status: 1 });
reservationSchema.index({ roomId: 1, checkIn: 1, checkOut: 1, status: 1 });
reservationSchema.index({ guestId: 1, createdAt: -1 });

const staySchema = new mongoose.Schema(
  {
    reservationId: { type: mongoose.Schema.Types.ObjectId, ref: "Reservation", required: true },
    checkedInAt: Date,
    checkedOutAt: Date,
    keyReference: String,
    notes: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

const invoiceSchema = new mongoose.Schema(
  {
    reservationId: { type: mongoose.Schema.Types.ObjectId, ref: "Reservation", required: true },
    guestId: { type: mongoose.Schema.Types.ObjectId, ref: "Guest", required: true },
    invoiceNumber: { type: String, required: true, unique: true },
    currency: { type: String, default: "USD" },
    subtotal: Number,
    taxTotal: Number,
    discountTotal: { type: Number, default: 0 },
    grandTotal: Number,
    amountPaid: { type: Number, default: 0 },
    balanceDue: Number,
    status: { type: String, enum: ["draft", "issued", "partially_paid", "paid", "void"], default: "draft" },
    issuedAt: Date,
  },
  { timestamps: true },
);

const invoiceItemSchema = new mongoose.Schema(
  {
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice", required: true, index: true },
    category: String,
    description: String,
    quantity: Number,
    unitPrice: Number,
    taxRate: Number,
    lineTotal: Number,
  },
  { timestamps: true },
);

const paymentSchema = new mongoose.Schema(
  {
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice", required: true },
    amount: Number,
    method: { type: String, enum: ["card", "cash", "transfer"], default: "card" },
    reference: String,
    status: { type: String, default: "captured" },
    paidAt: Date,
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

const housekeepingSchema = new mongoose.Schema(
  {
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true, index: true },
    reservationId: { type: mongoose.Schema.Types.ObjectId, ref: "Reservation", index: true },
    guestId: { type: mongoose.Schema.Types.ObjectId, ref: "Guest", index: true },
    type: { type: String, default: "checkout-clean" },
    source: {
      type: String,
      enum: ["checkout", "guest", "desk"],
      default: "desk",
      index: true,
    },
    priority: { type: String, enum: ["low", "normal", "high"], default: "normal" },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    scheduledFor: Date,
    startedAt: Date,
    completedAt: Date,
    status: { type: String, enum: ["assigned", "in_progress", "completed", "blocked"], default: "assigned" },
    notes: String,
  },
  { timestamps: true },
);

housekeepingSchema.index({ roomId: 1, scheduledFor: 1, status: 1 });
housekeepingSchema.index({ guestId: 1, status: 1, createdAt: -1 });

const maintenanceSchema = new mongoose.Schema(
  {
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room" },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    category: String,
    priority: { type: String, enum: ["low", "normal", "high"], default: "normal" },
    description: String,
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["open", "assigned", "in_progress", "resolved", "closed"], default: "open" },
    resolutionNote: String,
    openedAt: { type: Date, default: Date.now },
    resolvedAt: Date,
  },
  { timestamps: true },
);

maintenanceSchema.index({ status: 1, priority: 1, openedAt: -1 });

const serviceRequestSchema = new mongoose.Schema(
  {
    guestId: { type: mongoose.Schema.Types.ObjectId, ref: "Guest", required: true },
    reservationId: { type: mongoose.Schema.Types.ObjectId, ref: "Reservation" },
    type: { type: String, required: true },
    description: String,
    priority: { type: String, default: "normal" },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["open", "in_progress", "completed", "cancelled"], default: "open" },
    requestedAt: { type: Date, default: Date.now },
    completedAt: Date,
  },
  { timestamps: true },
);

const feedbackSchema = new mongoose.Schema(
  {
    guestId: { type: mongoose.Schema.Types.ObjectId, ref: "Guest", required: true },
    reservationId: { type: mongoose.Schema.Types.ObjectId, ref: "Reservation" },
    rating: { type: Number, min: 1, max: 5, required: true },
    title: String,
    comment: String,
    source: { type: String, default: "website" },
    published: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const notificationSchema = new mongoose.Schema(
  {
    recipientUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    type: String,
    title: String,
    message: String,
    link: String,
    readAt: Date,
  },
  { timestamps: true },
);

notificationSchema.index({ recipientUserId: 1, readAt: 1, createdAt: -1 });

const settingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: mongoose.Schema.Types.Mixed,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

const mediaAssetSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    category: {
      type: String,
      enum: ["rooms", "dining", "experiences", "gallery", "hero", "site"],
      default: "gallery",
      index: true,
    },
    url: { type: String, required: true },
    publicId: String,
    storage: { type: String, enum: ["cloudinary", "mongo", "url"], default: "url" },
    alt: String,
    label: String,
    group: String,
    tall: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    roomTypeSlug: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

const auditSchema = new mongoose.Schema(
  {
    actorUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    action: String,
    entityType: String,
    entityId: String,
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed,
    ip: String,
    userAgent: String,
  },
  { timestamps: true },
);

/** Private guest ↔ front-desk conversation (never shared across guests). */
const deskThreadSchema = new mongoose.Schema(
  {
    guestId: { type: mongoose.Schema.Types.ObjectId, ref: "Guest", required: true, index: true },
    guestUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    reservationId: { type: mongoose.Schema.Types.ObjectId, ref: "Reservation" },
    topic: {
      type: String,
      enum: ["date_change", "stay", "room", "dining", "spa", "arrival", "general"],
      default: "general",
      index: true,
    },
    subject: { type: String, required: true },
    status: {
      type: String,
      enum: ["open", "awaiting_desk", "awaiting_guest", "closed"],
      default: "awaiting_desk",
      index: true,
    },
    requestedCheckIn: Date,
    requestedCheckOut: Date,
    roomType: String,
    /** Snapshot of free nights shown to the guest when they asked (ISO dates). */
    openNightHints: [String],
    lastMessageAt: { type: Date, default: Date.now, index: true },
    guestLastReadAt: Date,
    deskLastReadAt: Date,
  },
  { timestamps: true },
);

deskThreadSchema.index({ guestId: 1, lastMessageAt: -1 });
deskThreadSchema.index({ status: 1, lastMessageAt: -1 });

const deskMessageSchema = new mongoose.Schema(
  {
    threadId: { type: mongoose.Schema.Types.ObjectId, ref: "DeskThread", required: true, index: true },
    senderUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    senderRole: { type: String, enum: ["guest", "desk"], required: true },
    body: { type: String, required: true },
    meta: {
      proposedCheckIn: String,
      proposedCheckOut: String,
      openNightHints: [String],
    },
  },
  { timestamps: true },
);

deskMessageSchema.index({ threadId: 1, createdAt: 1 });

const diningMenuCategorySchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const diningMenuItemSchema = new mongoose.Schema(
  {
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "DiningMenuCategory", required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    /** Unit price in cents */
    price: { type: Number, required: true },
    image: String,
    available: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const diningOrderLineSchema = new mongoose.Schema(
  {
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: "DiningMenuItem" },
    name: { type: String, required: true },
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    notes: { type: String, default: "" },
    lineTotal: { type: Number, required: true },
  },
  { _id: false },
);

const diningOrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    guestId: { type: mongoose.Schema.Types.ObjectId, ref: "Guest", required: true, index: true },
    reservationId: { type: mongoose.Schema.Types.ObjectId, ref: "Reservation", required: true, index: true },
    roomNumber: { type: String, default: "" },
    status: {
      type: String,
      enum: ["placed", "accepted", "preparing", "ready", "delivered", "cancelled"],
      default: "placed",
      index: true,
    },
    lines: [diningOrderLineSchema],
    /** Totals in cents */
    subtotal: { type: Number, default: 0 },
    notes: { type: String, default: "" },
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice" },
    invoiceItemIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "InvoiceItem" }],
    placedAt: { type: Date, default: Date.now },
    cancelledAt: Date,
    deliveredAt: Date,
  },
  { timestamps: true },
);

diningOrderSchema.index({ status: 1, placedAt: -1 });
diningOrderSchema.index({ guestId: 1, placedAt: -1 });

const diningTableSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, unique: true },
    capacity: { type: Number, default: 4, min: 1 },
    zone: { type: String, default: "terrace" },
    status: {
      type: String,
      enum: ["free", "seated", "reserved", "blocked"],
      default: "free",
      index: true,
    },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const diningTableBookingSchema = new mongoose.Schema(
  {
    guestId: { type: mongoose.Schema.Types.ObjectId, ref: "Guest", required: true, index: true },
    reservationId: { type: mongoose.Schema.Types.ObjectId, ref: "Reservation", required: true, index: true },
    tableId: { type: mongoose.Schema.Types.ObjectId, ref: "DiningTable" },
    partySize: { type: Number, required: true, min: 1, max: 20 },
    slot: { type: String, enum: ["Breakfast", "Lunch", "Dinner"], required: true },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ["requested", "seated", "completed", "cancelled", "no_show"],
      default: "requested",
      index: true,
    },
    notes: { type: String, default: "" },
    roomNumber: { type: String, default: "" },
  },
  { timestamps: true },
);

diningTableBookingSchema.index({ date: 1, slot: 1, status: 1 });

module.exports = {
  Role: mongoose.model("Role", roleSchema),
  User: mongoose.model("User", userSchema),
  Guest: mongoose.model("Guest", guestSchema),
  RoomType: mongoose.model("RoomType", roomTypeSchema),
  Room: mongoose.model("Room", roomSchema),
  Reservation: mongoose.model("Reservation", reservationSchema),
  Stay: mongoose.model("Stay", staySchema),
  Invoice: mongoose.model("Invoice", invoiceSchema),
  InvoiceItem: mongoose.model("InvoiceItem", invoiceItemSchema),
  Payment: mongoose.model("Payment", paymentSchema),
  HousekeepingTask: mongoose.model("HousekeepingTask", housekeepingSchema),
  MaintenanceTicket: mongoose.model("MaintenanceTicket", maintenanceSchema),
  ServiceRequest: mongoose.model("ServiceRequest", serviceRequestSchema),
  Feedback: mongoose.model("Feedback", feedbackSchema),
  Notification: mongoose.model("Notification", notificationSchema),
  Setting: mongoose.model("Setting", settingSchema),
  MediaAsset: mongoose.model("MediaAsset", mediaAssetSchema),
  AuditLog: mongoose.model("AuditLog", auditSchema),
  DeskThread: mongoose.model("DeskThread", deskThreadSchema),
  DeskMessage: mongoose.model("DeskMessage", deskMessageSchema),
  DiningMenuCategory: mongoose.model("DiningMenuCategory", diningMenuCategorySchema),
  DiningMenuItem: mongoose.model("DiningMenuItem", diningMenuItemSchema),
  DiningOrder: mongoose.model("DiningOrder", diningOrderSchema),
  DiningTable: mongoose.model("DiningTable", diningTableSchema),
  DiningTableBooking: mongoose.model("DiningTableBooking", diningTableBookingSchema),
};
