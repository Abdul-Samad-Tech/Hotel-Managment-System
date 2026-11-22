const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config");
const { User } = require("../models");

function hashToken(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function signAccess(user) {
  return jwt.sign({ sub: String(user._id), role: user.role }, jwtSecret, { expiresIn: "12h" });
}

function cookieOptions() {
  return { httpOnly: true, sameSite: "lax", secure: false, path: "/" };
}

async function setSession(res, user) {
  const refresh = crypto.randomBytes(32).toString("hex");
  const access = signAccess(user);
  user.refreshTokenHash = hashToken(refresh);
  await user.save();
  // Cookies kept for backward compatibility; multi-tab clients prefer Bearer tokens.
  res.cookie("access", access, { ...cookieOptions(), maxAge: 12 * 60 * 60 * 1000 });
  res.cookie("refresh", refresh, { ...cookieOptions(), maxAge: 7 * 24 * 60 * 60 * 1000 });
  return { accessToken: access, refreshToken: refresh };
}

function clearSession(res) {
  res.clearCookie("access", cookieOptions());
  res.clearCookie("refresh", cookieOptions());
}

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    // Prefer Bearer so each browser tab can keep its own session (cookies are shared).
    const token = (header.startsWith("Bearer ") ? header.slice(7) : "") || req.cookies?.access || "";
    if (!token) {
      const error = new Error("Sign in required.");
      error.status = 401;
      throw error;
    }
    const payload = jwt.verify(token, jwtSecret);
    const user = await User.findById(payload.sub).select("-passwordHash");
    if (!user || user.status !== "active") {
      const error = new Error("Account is not active.");
      error.status = 401;
      throw error;
    }
    req.user = user;
    next();
  } catch (error) {
    if (!error.status) error.status = 401;
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      error.message = "Sign in required.";
      error.status = 401;
    }
    next(error);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      const error = new Error("You do not have access to this action.");
      error.status = 403;
      next(error);
      return;
    }
    next();
  };
}

const staffRoles = ["admin", "manager", "receptionist", "housekeeping", "maintenance"];

module.exports = { setSession, clearSession, hashToken, requireAuth, requireRole, staffRoles };
