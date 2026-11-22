const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

module.exports = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI || "",
  jwtSecret: process.env.JWT_SECRET || "azure-bay-dev-secret-change-me",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://127.0.0.1:5173",
};
