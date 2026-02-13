import type { Server } from "socket.io";
import {
  GameEvent,
  RoomState,
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
  deleteRoom,
  getRoomByPlayerSocketId,
  joinRoom,
} from "../game/roomController.ts";
import { setRedis, delRedis } from "../lib/redisClient.ts";
import {
  handleDrawingAction,
  handleDrawTimeExpired,
  handleGuess,
  handlePlayerLeft,
  handleWordSelect,
  startGame,
} from "../game/gameController.ts";

const drawTimers = new Map<Room["id"], ReturnType<typeof setTimeout>>();

const clearDrawTimer = (roomId: Room["id"]) => {
  const timer = drawTimers.get(roomId);
  if (timer) {
    clearTimeout(timer);
    drawTimers.delete(roomId);
    try {
      void delRedis(`drawtimer:${roomId}`);
    } catch (err) {
      console.warn("Failed to clear drawtimer in redis", err);
    }
  }
};

export function setupSocket(io: Server) {
  const startDrawTimer = (room: Room) => {
    clearDrawTimer(room.id);
    const drawTimeMs = Math.max(0, room.settings.drawTime) * 1000;
    if (!drawTimeMs) return;

    // persist expiry timestamp to redis
    try {
      const expiry = Date.now() + drawTimeMs;
      void setRedis(`drawtimer:${room.id}`, String(expiry));
    } catch (err) {
      console.warn("Failed to persist drawtimer expiry to redis", err);
    }

    const timer = setTimeout(() => {
      try {
        const result = handleDrawTimeExpired(room.id);
        if (!result) return;
        io.to(room.id).emit(GameEvent.ROUND_STARTED, result.room);
        if (result.room.gameState?.roomState === RoomState.ENDED) {
          io.to(room.id).emit(GameEvent.GAME_ENDED, {
            room: result.room,
            reason: "completed",
          });
        }
      } catch (error) {
        console.warn(
          `Error handling drawTime expiry for room ${room.id}: `,
          error,
        );
      }
    }, drawTimeMs);

    drawTimers.set(room.id, timer);
  };

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
                room: result.room,
                reason: "hostLeft",
              });
            }
          } else if (result.hostLeft) {
            io.to(room.id).emit(GameEvent.GAME_ENDED, {
              room: result.room,
              reason: "hostLeft",
            });
          } else if (result.notEnoughPlayers) {
            io.to(room.id).emit(GameEvent.GAME_ENDED, {
              room: result.room,
              reason: "notEnoughPlayers",
            });
          }
          if (
            result.hostLeft ||
            result.notEnoughPlayers ||
            result.roomDeleted
          ) {
            clearDrawTimer(room.id);
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
              room: result.room,
              reason: "hostLeft",
            });
          } else if (result.notEnoughPlayers) {
            io.to(result.room.id).emit(GameEvent.GAME_ENDED, {
              room: result.room,
              reason: "notEnoughPlayers",
            });
          }
        } else if (result.hostLeft) {
          io.to(room.id).emit(GameEvent.GAME_ENDED, {
            room: result.room,
            reason: "hostLeft",
          });
        } else if (result.notEnoughPlayers) {
          io.to(room.id).emit(GameEvent.GAME_ENDED, {
            room: result.room,
            reason: "notEnoughPlayers",
          });
        }
        if (result.hostLeft || result.notEnoughPlayers || result.roomDeleted) {
          clearDrawTimer(room.id);
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
        try {
          void setRedis(`room:${data.roomId}`, JSON.stringify(newRoomData));
        } catch (err) {
          console.warn("Failed to persist room drawing data to redis", err);
        }
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
        try {
          void setRedis(`room:${updatedRoom.id}`, JSON.stringify(updatedRoom));
        } catch (err) {
          console.warn("Failed to persist started room to redis", err);
        }
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
        startDrawTimer(updatedRoom);
        try {
          void setRedis(`room:${updatedRoom.id}`, JSON.stringify(updatedRoom));
        } catch (err) {
          console.warn(
            "Failed to persist room after word select to redis",
            err,
          );
        }
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

        try {
          if (result.room) {
            void setRedis(
              `room:${result.room.id}`,
              JSON.stringify(result.room),
            );
          }
        } catch (err) {
          console.warn("Failed to persist room after guess to redis", err);
        }

        // If round ended and transitioned to new round, emit ROUND_STARTED
        if (result.roundEnded) {
          clearDrawTimer(data.roomId);
          io.to(data.roomId).emit(GameEvent.ROUND_STARTED, result.room);
        }
        if (result.room.gameState?.roomState === RoomState.ENDED) {
          clearDrawTimer(data.roomId);
          io.to(data.roomId).emit(GameEvent.GAME_ENDED, {
            room: result.room,
            reason: "completed",
          });
          // remove room from in-memory store and redis
          console.log("GONNA_DELETE_NEXT_ROOM: ", data.roomId);
          deleteRoom(data.roomId);
        }
      },
    );
  });
}
