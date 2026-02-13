import type { Server } from "socket.io";
import {
  GameEvent,
  type ClientCreateRoomData,
  type DrawDataPoint,
  type DrawDataUpdateType,
  type Player,
  type PlayerData,
  type Room,
  type RoomSettings,
} from "../types/index.ts";
import {
  changeRoomSettings,
  createRoom,
  getRoomByPlayerSocketId,
  joinRoom,
} from "../game/roomController.ts";
import {
  handleDrawingAction,
  handleGuess,
  handlePlayerLeft,
  handleWordSelect,
  startGame,
} from "../game/gameController.ts";

export function setupSocket(io: Server) {
  io.on(GameEvent.CONNECT, (socket) => {
    console.log("a user connected: ", socket.id);
    socket.on(GameEvent.DISCONNECT, () => {
      console.log(
        `Socket ${socket.id} disconnected, checking for associated room and player...`,
      );
      const room = getRoomByPlayerSocketId(socket.id);
      const player = room?.players.find(
        (roomPlayer) => roomPlayer.socketId === socket.id,
      );
      console.log("ROOM_LEFT: ", room);
      console.log("PLAYER_LEFT: ", player);

      if (room && player) {
        try {
          const result = handlePlayerLeft(room.id, player.id);
          if (result.room) {
            io.to(result.room.id).emit(GameEvent.PLAYER_LEFT, result.room);
            if (result.hostLeft) {
              io.to(result.room.id).emit(GameEvent.GAME_ENDED, {
                roomId: result.room.id,
                reason: "hostLeft",
              });
            }
          } else if (result.hostLeft) {
            io.to(room.id).emit(GameEvent.GAME_ENDED, {
              roomId: room.id,
              reason: "hostLeft",
            });
          } else if (result.notEnoughPlayers) {
            io.to(room.id).emit(GameEvent.GAME_ENDED, {
              roomId: room.id,
              reason: "notEnoughPlayers",
            });
          }
        } catch (error) {
          console.warn(
            `Error handling disconnect for player ${player.id} in room ${room.id}: `,
            error,
          );
        }
      }
      console.log("user disconnected: ", socket.id);
    });
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
          const updatedRoom = joinRoom(data.roomId, data.playerData, socket.id);
          const joinedPlayer =
            updatedRoom.players[updatedRoom.players.length - 1];
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

    socket.on(GameEvent.LEAVE_ROOM, async () => {
      const room = getRoomByPlayerSocketId(socket.id);
      const player = room?.players.find(
        (roomPlayer) => roomPlayer.socketId === socket.id,
      );
      if (!room || !player) return;
      try {
        const result = handlePlayerLeft(room.id, player.id);
        if (result.room) {
          io.to(result.room.id).emit(GameEvent.PLAYER_LEFT, result.room);
          if (result.hostLeft) {
            io.to(result.room.id).emit(GameEvent.GAME_ENDED, {
              roomId: result.room.id,
              reason: "hostLeft",
            });
          } else if (result.notEnoughPlayers) {
            io.to(result.room.id).emit(GameEvent.GAME_ENDED, {
              roomId: result.room.id,
              reason: "notEnoughPlayers",
            });
          }
        } else if (result.hostLeft) {
          io.to(room.id).emit(GameEvent.GAME_ENDED, {
            roomId: room.id,
            reason: "hostLeft",
          });
        } else if (result.notEnoughPlayers) {
          io.to(room.id).emit(GameEvent.GAME_ENDED, {
            roomId: room.id,
            reason: "notEnoughPlayers",
          });
        }
      } catch (error) {
        console.warn(
          `Error handling leaveRoom for player ${player.id} in room ${room.id}: `,
          error,
        );
      }
    });

    socket.on(
      GameEvent.CHANGE_ROOM_SETTINGS,
      async (data: { roomId: string; newSettings: Partial<RoomSettings> }) => {
        changeRoomSettings(data.roomId, data.newSettings);
      },
    );

    socket.on(
      GameEvent.DRAWING_DATA,
      async (data: {
        roomId: Room["id"];
        playerId: Player["id"];
        action: DrawDataUpdateType;
        drawingData: DrawDataPoint;
      }) => {
        // console.log(
        //   `Received drawing data from player ${data.playerId} in room ${data.roomId}, drawingData: ${JSON.stringify(data.drawingData)}`,
        // );
        const newRoomData = handleDrawingAction(
          data.roomId,
          data.playerId,
          data.action,
          data.drawingData,
        );
        io.to(data.roomId).emit(GameEvent.UPDATED_DRAWING_DATA, newRoomData);
      },
    );

    socket.on(
      GameEvent.START_GAME,
      async (data: { roomId: Room["id"]; playerId: Player["id"] }) => {
        console.log(
          `Starting game for room ${data.roomId} by player ${data.playerId}`,
        );
        const updatedRoom = startGame(data.roomId, data.playerId);
        console.log("UPADTED_ROOM_AFTER_START: ", updatedRoom);
        io.to(updatedRoom.id).emit(GameEvent.GAME_STARTED, updatedRoom);
      },
    );

    socket.on(
      GameEvent.WORD_SELECT,
      async (data: {
        roomId: Room["id"];
        playerId: Player["id"];
        word: string;
      }) => {
        console.log(
          `Player ${data.playerId} selected word in room ${data.roomId}`,
        );
        const updatedRoom = handleWordSelect(
          data.roomId,
          data.playerId,
          data.word,
        );
        io.to(updatedRoom.id).emit(GameEvent.WORD_SELECTED, updatedRoom);
      },
    );

    socket.on(
      GameEvent.GUESS_MADE,
      async (data: {
        roomId: Room["id"];
        playerId: Player["id"];
        guess: string;
      }) => {
        const result = handleGuess(data.roomId, data.playerId, data.guess);
        io.to(data.roomId).emit(GameEvent.GUESS_MADE, result.room);

        // If round ended and transitioned to new round, emit ROUND_STARTED
        if (result.roundEnded) {
          io.to(data.roomId).emit(GameEvent.ROUND_STARTED, result.room);
        }
      },
    );
  });
}
