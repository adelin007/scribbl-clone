import type { Server } from "socket.io";
import { GameEvent, type PlayerData } from "../types/index.ts";

type GameRoomData = {
  id: string;
};

const gameRoom: GameRoomData = { id: "" };

export function setupSocket(io: Server) {
  io.on(GameEvent.CONNECT, (socket) => {
    console.log("a user connected: ", socket.id);
    socket.on(GameEvent.JOIN_ROOM, async (playerData: PlayerData) => {
      console.log(`${playerData.name} joined the room`);
    });

    socket.on(GameEvent.CREATE_ROOM, async (playerData: PlayerData) => {
      gameRoom.id = socket.id; // For simplicity, using socket ID as room ID. In production, you'd want a more robust solution.
      console.log(`${playerData.name} created the room`);
      console.log("GAME_ROOM: ", gameRoom);
    });
  });
}
