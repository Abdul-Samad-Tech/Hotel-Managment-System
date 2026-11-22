const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const { allowOrigin } = require("./config");

const app = express();

app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  res.setHeader("X-Request-Id", req.id);
  next();
});
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "6mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin(origin, callback) {
      callback(null, allowOrigin(origin));
    },
    credentials: true,
  }),
);

app.get("/api/v1/health", (req, res) => {
  res.json({ ok: true, service: "azure-bay-hms" });
});

const authRoutes = require("./routes/auth");
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1", authRoutes);
app.use("/api/v1", require("./routes/rooms"));
app.use("/api/v1/reservations", require("./routes/reservations"));
app.use("/api/v1", require("./routes/billing"));
app.use("/api/v1", require("./routes/operations"));
app.use("/api/v1", require("./routes/admin"));
app.use("/api/v1", require("./routes/media"));
app.use("/api/v1/desk-messages", require("./routes/deskMessages"));
app.use("/api/v1/dining", require("./routes/dining"));

const clientDist = path.join(__dirname, "../../frontend/dist");
if (process.env.NODE_ENV === "production" && fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api/") || req.path.startsWith("/socket.io")) {
      next();
      return;
    }
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.use((error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }
  const status = error.status || (error.name === "ZodError" ? 400 : 500);
  const message = error.issues ? "Check the form and try again." : error.message;
  if (status >= 500) console.error(error);
  res.status(status).json({ message: message || "Something went wrong." });
});

module.exports = app;
