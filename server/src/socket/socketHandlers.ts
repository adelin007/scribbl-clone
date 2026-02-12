import type { Server } from "socket.io";
import {
  GameEvent,
  type ClientCreateRoomData,
  type PlayerData,
  type RoomSettings,
} from "../types/index.ts";
import {
  changeRoomSettings,
  createRoom,
  joinRoom,
} from "../game/roomController.ts";

export function setupSocket(io: Server) {
  io.on(GameEvent.CONNECT, (socket) => {
    console.log("a user connected: ", socket.id);
    socket.on(GameEvent.JOIN_ROOM, async (playerData: PlayerData) => {
      console.log(`${playerData.name} joined the room`);
    });

    socket.on(GameEvent.CREATE_ROOM, async (data: ClientCreateRoomData) => {
      const newRoom = createRoom({
        host: {
          name: data.name,
          color: data.color,
        },
        socketId: socket.id,
        settings: {
          maxPlayers: 8, // Default max players, can be made dynamic later
          roundTime: 60, // Default round time, can be made dynamic later
          drawTime: data.drawTime,
          rounds: data.rounds,
        },
      });
      console.log(`${data.name} created the room`);
      console.log("GAME_ROOM: ", newRoom);
      socket.join(newRoom.id);
      socket.emit(GameEvent.ROOM_CREATED, newRoom);
    });

    socket.on(
      GameEvent.JOIN_ROOM,
      async (data: { roomId: string; playerData: PlayerData }) => {
        try {
          const updatedRoom = joinRoom(data.roomId, data.playerData);
          socket.join(updatedRoom.id);
          io.to(updatedRoom.id).emit(GameEvent.PLAYER_JOINED, updatedRoom);
          socket.emit(GameEvent.JOINED_ROOM, updatedRoom);
        } catch (error) {
          console.error(`Error joining room ${data.roomId}: `, error);
          socket.emit("error", {
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      },
    );

    socket.on(
      GameEvent.CHANGE_ROOM_SETTINGS,
      async (data: { roomId: string; newSettings: Partial<RoomSettings> }) => {
        changeRoomSettings(data.roomId, data.newSettings);
      },
    );
  });
}
