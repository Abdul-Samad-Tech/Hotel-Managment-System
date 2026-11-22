const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const clientOrigin = process.env.CLIENT_ORIGIN || "http://127.0.0.1:5173";

function allowOrigin(origin) {
  if (!origin || origin === clientOrigin) return true;
  if (origin === "http://localhost:5173" || origin === "http://127.0.0.1:5173") return true;
  try {
    const host = new URL(origin).hostname;
    return host.endsWith(".fly.dev") || host.endsWith(".vercel.app");
  } catch {
    return false;
  }
}

module.exports = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI || "",
  jwtSecret: process.env.JWT_SECRET || "azure-bay-dev-secret-change-me",
  clientOrigin,
  allowOrigin,
};
