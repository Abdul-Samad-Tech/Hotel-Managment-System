const bcrypt = require("bcryptjs");
const { User } = require("../models");

const DEMO_PASSWORD = "AzureBay#2025";

/** Seed demo logins that must stay usable for eproject demos. */
const DEMO_STAFF = [
  ["Amina Noor", "admin@azurebay.test", "admin"],
  ["Hassan Qureshi", "manager@azurebay.test", "manager"],
  ["Sara Desk", "desk@azurebay.test", "receptionist"],
  ["Imran House", "house@azurebay.test", "housekeeping"],
  ["Nadia Maint", "maint@azurebay.test", "maintenance"],
  ["Ayesha Khan", "guest@azurebay.test", "guest"],
];

/**
 * Ensure demo accounts exist, are active, and accept AzureBay#2025.
 * Safe to run on every boot when DB already has data (house was often left inactive).
 */
async function ensureDemoStaffAccounts() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  for (const [fullName, email, role] of DEMO_STAFF) {
    const existing = await User.findOne({ email });
    if (!existing) {
      await User.create({
        fullName,
        email,
        role,
        phone: "+960 700 0000",
        status: "active",
        passwordHash,
      });
      continue;
    }
    const patch = {};
    if (existing.status !== "active") patch.status = "active";
    if (existing.role !== role) patch.role = role;
    if (!existing.fullName) patch.fullName = fullName;
    const matches = await bcrypt.compare(DEMO_PASSWORD, existing.passwordHash);
    if (!matches) patch.passwordHash = passwordHash;
    if (Object.keys(patch).length) {
      await User.updateOne({ _id: existing._id }, { $set: patch });
    }
  }
}

module.exports = { ensureDemoStaffAccounts, DEMO_PASSWORD, DEMO_STAFF };
