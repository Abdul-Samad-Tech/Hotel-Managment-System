require("dotenv").config();
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { User } = require("../src/models");

const DEMO_PASSWORD = "AzureBay#2025";

async function main() {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/azure-bay";
  await mongoose.connect(uri);
  const staff = await User.find({
    role: { $in: ["admin", "manager", "receptionist", "housekeeping", "maintenance"] },
  })
    .select("email role status fullName")
    .lean();
  console.log("Staff accounts:");
  for (const row of staff) {
    console.log(`  ${row.email} | ${row.role} | ${row.status} | ${row.fullName}`);
  }

  let house = await User.findOne({ email: "house@azurebay.test" });
  if (!house) {
    console.log("\nhouse@azurebay.test missing — creating…");
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    house = await User.create({
      fullName: "Imran House",
      email: "house@azurebay.test",
      phone: "+960 700 0000",
      role: "housekeeping",
      status: "active",
      passwordHash,
    });
    console.log("Created house@azurebay.test");
  } else {
    const ok = await bcrypt.compare(DEMO_PASSWORD, house.passwordHash);
    console.log(`\nhouse@azurebay.test exists | status=${house.status} | passwordMatchesDemo=${ok}`);
    if (!ok || house.status !== "active") {
      house.passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
      house.status = "active";
      house.role = "housekeeping";
      await house.save();
      console.log("Reset password to AzureBay#2025 and set active.");
    }
  }

  // Also ensure maint exists for completeness
  let maint = await User.findOne({ email: "maint@azurebay.test" });
  if (!maint) {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    await User.create({
      fullName: "Nadia Maint",
      email: "maint@azurebay.test",
      phone: "+960 700 0000",
      role: "maintenance",
      status: "active",
      passwordHash,
    });
    console.log("Created maint@azurebay.test");
  }

  await mongoose.disconnect();
  console.log("\nLogin: house@azurebay.test / AzureBay#2025 → /staff → Housekeeping");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
