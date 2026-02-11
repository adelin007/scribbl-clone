import { createServer } from "http";

import { Server } from "socket.io";
import { setupSocket } from "./socket/socketHandlers.ts";

console.log("Starting server...");
const io = new Server(3000, {
  cors: {
    origin: ["http://localhost:5173"],
    credentials: true,
  },
});
setupSocket(io);
// io.on("disconnect", (socket) => {
//   console.log("a user disconnected");
// });
