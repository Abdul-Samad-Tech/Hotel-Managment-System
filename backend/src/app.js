const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const { clientOrigin } = require("./config");

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
      const allowed = [clientOrigin, "http://localhost:5173", "http://127.0.0.1:5173"];
      if (!origin || allowed.includes(origin) || origin.endsWith(".vercel.app")) {
        callback(null, true);
        return;
      }
      callback(null, false);
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
