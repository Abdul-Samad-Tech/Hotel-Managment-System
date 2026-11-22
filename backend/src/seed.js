const bcrypt = require("bcryptjs");
const {
  User,
  Guest,
  RoomType,
  Room,
  Setting,
  Reservation,
  Invoice,
  InvoiceItem,
  Feedback,
  Role,
} = require("./models");
const { parseDay } = require("./lib/dates");
const { ensurePublicDefaults, DEFAULT_STAY_POLICIES } = require("./lib/ensureDefaults");

const DEMO_PASSWORD = "AzureBay#2025";

const roomTypes = [
  {
    name: "Deluxe Room",
    slug: "deluxe-sea-view",
    description: "King bed, sea-facing balcony, calm linen and warm wood.",
    baseRate: 12000,
    maxAdults: 2,
    maxChildren: 1,
    bedType: "King Bed",
    amenities: ["Sea view", "Beachfront", "Infinity pool", "24/7 concierge", "Ocean dining", "King bed", "Linen", "Balcony"],
    image: "/assets/azure-bay/rooms/deluxe-sea-view.jpg",
    featured: true,
  },
  {
    name: "Premium Ocean Suite",
    slug: "premium-ocean-suite",
    description: "King bed, sitting room and a wide ocean window.",
    baseRate: 22000,
    maxAdults: 4,
    maxChildren: 2,
    bedType: "King Bed",
    amenities: ["Sea view", "Beachfront", "Infinity pool", "24/7 concierge", "Ocean dining", "King bed", "Sitting room", "Ocean window"],
    image: "/assets/azure-bay/rooms/premium-ocean-suite.jpg",
  },
  {
    name: "Presidential Suite",
    slug: "presidential-suite",
    description: "A grand suite with a living room and sunset terrace.",
    baseRate: 38000,
    maxAdults: 4,
    maxChildren: 2,
    bedType: "King Bed",
    amenities: ["Beachfront", "Infinity pool", "24/7 concierge", "Ocean dining", "King bed", "Terrace", "Canopy bed", "Marble"],
    image: "/assets/azure-bay/rooms/presidential-suite.jpg",
  },
  {
    name: "Family Suite",
    slug: "family-suite",
    description: "Queen bed, sofa bed and a bright ocean window.",
    baseRate: 26000,
    maxAdults: 4,
    maxChildren: 3,
    bedType: "Queen Bed",
    amenities: ["Beachfront", "Infinity pool", "24/7 concierge", "Ocean dining", "Queen bed", "Sofa bed", "Palm view"],
    image: "/assets/azure-bay/rooms/family-suite.jpg",
  },
];

const roomsBySlug = {
  "deluxe-sea-view": ["101", "102", "103"],
  "premium-ocean-suite": ["201", "202"],
  "presidential-suite": ["301"],
  "family-suite": ["401", "402"],
};

const ROLE_MATRIX = {
  admin: ["*"],
  manager: ["rooms.write", "reservations.manage", "reports.read", "users.read", "housekeeping.assign", "maintenance.assign"],
  receptionist: ["reservations.manage", "billing.write", "guests.write", "services.write"],
  housekeeping: ["housekeeping.write", "rooms.status"],
  maintenance: ["maintenance.write", "rooms.status"],
  guest: ["reservations.own", "services.write", "feedback.write", "profile.write"],
};

async function ensureRoles() {
  for (const [name, permissions] of Object.entries(ROLE_MATRIX)) {
    const role = await Role.findOneAndUpdate({ name }, { name, permissions }, { upsert: true, returnDocument: "after" });
    await User.updateMany({ role: name }, { $addToSet: { roleIds: role._id } });
  }
}

async function seedDatabase() {
  const existing = await User.countDocuments();
  if (existing > 0) {
    await ensureRoles();
    await ensurePublicDefaults();
    const { ensureDemoStaffAccounts } = require("./lib/ensureDemoStaff");
    await ensureDemoStaffAccounts();
    return;
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const accounts = [
    ["Amina Noor", "admin@azurebay.test", "admin"],
    ["Hassan Qureshi", "manager@azurebay.test", "manager"],
    ["Sara Desk", "desk@azurebay.test", "receptionist"],
    ["Imran House", "house@azurebay.test", "housekeeping"],
    ["Nadia Maint", "maint@azurebay.test", "maintenance"],
    ["Ayesha Khan", "guest@azurebay.test", "guest"],
  ];

  const users = {};
  for (const [fullName, email, role] of accounts) {
    users[role] = await User.create({ fullName, email, passwordHash, role, phone: "+960 700 0000" });
  }

  const guest = await Guest.create({
    userId: users.guest._id,
    fullName: users.guest.fullName,
    email: users.guest.email,
    phone: "+92 300 0000000",
    nationality: "Pakistan",
    preferences: ["High floor", "Late checkout"],
  });

  const types = {};
  for (const type of roomTypes) {
    types[type.slug] = await RoomType.create(type);
  }

  const roomDocs = {};
  for (const [slug, numbers] of Object.entries(roomsBySlug)) {
    for (const roomNumber of numbers) {
      const room = await Room.create({
        roomNumber,
        roomTypeId: types[slug]._id,
        floor: Number(roomNumber[0]),
        status: roomNumber === "103" ? "cleaning" : "available",
      });
      roomDocs[roomNumber] = room;
    }
  }

  await Setting.create({ key: "taxRate", value: 0.1, updatedBy: users.admin._id });
  await Setting.create({ key: "hotelName", value: "Azure Bay Hotel & Resort", updatedBy: users.admin._id });
  await Setting.create({ key: "currency", value: "USD", updatedBy: users.admin._id });
  await Setting.create({ key: "stayPolicies", value: DEFAULT_STAY_POLICIES, updatedBy: users.admin._id });
  await ensurePublicDefaults();

  const checkIn = parseDay("2026-10-12");
  const checkOut = parseDay("2026-10-16");
  const nights = 4;
  const nightlyRate = 12000;
  const subtotal = nightlyRate * nights;
  const taxes = Math.round(subtotal * 0.1);
  const reservation = await Reservation.create({
    confirmationCode: "AB-DEMO1001",
    guestId: guest._id,
    roomId: roomDocs["101"]._id,
    roomTypeId: types["deluxe-sea-view"]._id,
    checkIn,
    checkOut,
    adults: 2,
    children: 0,
    status: "confirmed",
    source: "website",
    nightlyRate,
    taxes,
    discount: 0,
    totalAmount: subtotal + taxes,
    createdBy: users.guest._id,
  });
  await Room.updateOne({ _id: roomDocs["101"]._id }, { status: "reserved" });

  const invoice = await Invoice.create({
    reservationId: reservation._id,
    guestId: guest._id,
    invoiceNumber: "INV-DEMO1001",
    subtotal,
    taxTotal: taxes,
    grandTotal: subtotal + taxes,
    balanceDue: subtotal + taxes,
    status: "draft",
  });
  await InvoiceItem.create({
    invoiceId: invoice._id,
    category: "room",
    description: "Deluxe Room · 4 nights",
    quantity: nights,
    unitPrice: nightlyRate,
    taxRate: 0.1,
    lineTotal: subtotal,
  });

  await Feedback.create({
    guestId: guest._id,
    reservationId: reservation._id,
    rating: 5,
    title: "Quiet mornings",
    comment: "The sea view from our suite felt like a private postcard.",
    published: true,
  });

  await ensureRoles();
  console.log("Seeded Azure Bay demo data. Password for every demo account: AzureBay#2025");
}

module.exports = { seedDatabase, ensureRoles, DEMO_PASSWORD };
