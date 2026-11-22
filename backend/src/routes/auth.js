const bcrypt = require("bcryptjs");
const { z } = require("zod");
const { User, Guest, AuditLog, Notification } = require("../models");
const { setSession, clearSession, hashToken, requireAuth } = require("../middleware/auth");
const { rateLimit } = require("../middleware/rateLimit");

const router = require("express").Router();

const registerSchema = z.object({
  fullName: z.string().trim().min(2),
  email: z.string().trim().email(),
  password: z.string().min(8),
  phone: z.string().trim().optional(),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
});

function publicUser(user) {
  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    phone: user.phone || "",
    status: user.status,
  };
}

router.post("/register", rateLimit(8, 60_000), async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const email = body.email.toLowerCase();
    const existing = await User.findOne({ email });
    const guestByEmail = await Guest.findOne({ email });
    const guestByUser = existing ? await Guest.findOne({ userId: existing._id }) : null;
    const guestProfile = guestByUser || guestByEmail;

    // Block only an active staff/guest login that still has a live guest profile.
    // Allow reclaim when: user inactive, guest removed from desk, or guest deactivated.
    const canReclaim =
      existing &&
      existing.role === "guest" &&
      (existing.status !== "active" || !guestProfile || guestProfile.status === "inactive");

    if (existing && !canReclaim) {
      const error = new Error("An account with this email already exists. Sign in instead.");
      error.status = 409;
      throw error;
    }

    const passwordHash = await bcrypt.hash(body.password, 10);
    let user;

    if (existing && canReclaim) {
      existing.fullName = body.fullName;
      existing.phone = body.phone || existing.phone;
      existing.passwordHash = passwordHash;
      existing.status = "active";
      existing.role = "guest";
      await existing.save();
      user = existing;
    } else {
      user = await User.create({
        fullName: body.fullName,
        email,
        phone: body.phone,
        passwordHash,
        role: "guest",
        status: "active",
      });
    }

    if (guestProfile) {
      guestProfile.userId = user._id;
      guestProfile.fullName = user.fullName;
      guestProfile.email = email;
      guestProfile.phone = body.phone || guestProfile.phone;
      guestProfile.status = "active";
      await guestProfile.save();
    } else {
      await Guest.create({
        userId: user._id,
        fullName: user.fullName,
        email,
        phone: body.phone,
        status: "active",
      });
    }

    const tokens = await setSession(res, user);
    res.status(201).json({ user: publicUser(user), ...tokens });
  } catch (error) {
    if (error.name === "ZodError") error.status = 400;
    if (error.code === 11000) {
      error.status = 409;
      error.message = "An account with this email already exists. Sign in instead.";
    }
    next(error);
  }
});

router.post("/login", rateLimit(20, 60_000), async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const user = await User.findOne({ email: body.email.toLowerCase() });
    const matches = user && (await bcrypt.compare(body.password, user.passwordHash));
    if (!matches || user.status !== "active") {
      const error = new Error("Email or password is incorrect.");
      error.status = 401;
      throw error;
    }
    user.lastLoginAt = new Date();
    await AuditLog.create({ actorUserId: user._id, action: "login", entityType: "user", entityId: String(user._id), ip: req.ip });
    const tokens = await setSession(res, user);
    res.json({ user: publicUser(user), ...tokens });
  } catch (error) {
    if (error.name === "ZodError") error.status = 400;
    next(error);
  }
});

router.post("/logout", async (req, res, next) => {
  try {
    const refresh = req.body?.refreshToken || req.cookies?.refresh;
    if (refresh) {
      await User.updateOne({ refreshTokenHash: hashToken(refresh) }, { $unset: { refreshTokenHash: 1 } });
    }
    clearSession(res);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.post("/refresh", async (req, res, next) => {
  try {
    const refresh = req.body?.refreshToken || req.cookies?.refresh;
    if (!refresh) {
      const error = new Error("Sign in required.");
      error.status = 401;
      throw error;
    }
    const user = await User.findOne({ refreshTokenHash: hashToken(refresh) });
    if (!user || user.status !== "active") {
      clearSession(res);
      const error = new Error("Sign in required.");
      error.status = 401;
      throw error;
    }
    const tokens = await setSession(res, user);
    res.json({ user: publicUser(user), ...tokens });
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

router.get("/notifications", requireAuth, async (req, res, next) => {
  try {
    const items = await Notification.find({ recipientUserId: req.user._id }).sort({ createdAt: -1 }).limit(30);
    res.json({ notifications: items });
  } catch (error) {
    next(error);
  }
});

router.patch("/notifications/:id/read", requireAuth, async (req, res, next) => {
  try {
    const item = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientUserId: req.user._id },
      { readAt: new Date() },
      { new: true },
    );
    if (!item) {
      const error = new Error("Notification not found.");
      error.status = 404;
      throw error;
    }
    res.json({ notification: item });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
