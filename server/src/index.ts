import { createServer } from "http";

import { Server } from "socket.io";
import { setupSocket } from "./socket/socketHandlers";

console.log("Starting server...");

// Read allowed client origins from env (comma-separated). Default to allow all.
const rawOrigins = process.env.CLIENT_URL ?? "*";
const allowedOrigins = rawOrigins
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const io = new Server(3000, {
  cors: {
    origin: (origin, callback) => {
      // allow non-browser tools (no origin)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS origin denied"));
    },
    credentials: true,
  },
});

setupSocket(io);
// io.on("disconnect", (socket) => {
//   console.log("a user disconnected");
// });
