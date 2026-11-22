const { User, Notification } = require("../models");

/** Alert active housekeeping + managers that work is waiting. */
async function notifyHousekeepingStaff(title, message) {
  const staff = await User.find({ role: { $in: ["housekeeping", "manager"] }, status: "active" }).select("_id");
  if (!staff.length) return;
  await Notification.insertMany(
    staff.map((person) => ({
      recipientUserId: person._id,
      type: "housekeeping",
      title,
      message,
      link: "/portal?tab=housekeeping",
    })),
  );
}

module.exports = { notifyHousekeepingStaff };
