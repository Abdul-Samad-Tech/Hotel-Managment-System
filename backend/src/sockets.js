const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const { jwtSecret, clientOrigin } = require("./config");

let io;

function readCookie(header, name) {
  const hit = String(header || "")
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : "";
}

function attachSocket(server) {
  io = new Server(server, {
    cors: {
      origin: [clientOrigin, "http://localhost:5173", "http://127.0.0.1:5173"],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (String(socket.handshake.headers.authorization || "").startsWith("Bearer ")
          ? String(socket.handshake.headers.authorization).slice(7)
          : "") ||
        readCookie(socket.handshake.headers.cookie, "access");
      if (!token) {
        next(new Error("Sign in required."));
        return;
      }
      socket.user = jwt.verify(token, jwtSecret);
      next();
    } catch {
      next(new Error("Sign in required."));
    }
  });

  io.on("connection", (socket) => {
    socket.join("staff");
  });
}

function publish(event) {
  if (!io) return;
  io.to("staff").emit("ops", { event, at: Date.now() });
}

module.exports = { attachSocket, publish };
