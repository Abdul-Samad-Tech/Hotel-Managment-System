const app = require("../backend/src/app");
const { connectDatabase } = require("../backend/src/db");
const { seedDatabase } = require("../backend/src/seed");

let ready;

function ensureReady() {
  if (!ready) {
    ready = connectDatabase()
      .then(() => seedDatabase())
      .catch((error) => {
        ready = null;
        throw error;
      });
  }
  return ready;
}

function originalPath(req) {
  const candidates = [
    req.headers["x-vercel-original-url"],
    req.headers["x-forwarded-uri"],
    req.headers["x-invoke-path"],
    req.url,
  ];
  for (const value of candidates) {
    if (typeof value !== "string" || !value) continue;
    if (value.startsWith("/api/")) return value;
    if (value.startsWith("http")) {
      try {
        const url = new URL(value);
        if (url.pathname.startsWith("/api/")) return `${url.pathname}${url.search}`;
      } catch {
        /* keep looking */
      }
    }
  }
  return req.url;
}

module.exports = async (req, res) => {
  try {
    await ensureReady();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "The desk could not reach the database." });
    return;
  }
  req.url = originalPath(req);
  return app(req, res);
};
