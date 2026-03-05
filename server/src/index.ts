import { createServer } from "http";

import { Server } from "socket.io";
import { setupSocket } from "./socket/socketHandlers";

console.log("Starting server...");
const allowedOrigin = process.env.CLIENT_URL ?? "*";
const io = new Server(3000, {
  cors: {
    origin: allowedOrigin,
    credentials: true,
  },
});
setupSocket(io);
// io.on("disconnect", (socket) => {
//   console.log("a user disconnected");
// });
