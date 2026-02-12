import {
  RoomState,
  type DrawDataPoint,
  type DrawDataUpdateType,
  type Player,
  type PlayerData,
  type Room,
} from "../types/index.ts";
import { getRoomById, rooms } from "./roomController.ts";

//TODO - implement database to store rooms and players, for now we will use an in-memory store
const players: Set<Player> = new Set();
export const createPlayer = (
  playerData: PlayerData,
  isHost: boolean,
): Player => {
  const newPlayer: Player = {
    id: crypto.randomUUID(),
    isHost,
    name: playerData.name,
    color: playerData.color,
    score: 0,
    guessed: false,
    guessedAt: null,
  };
  players.add(newPlayer);
  return newPlayer;
};

export const startGame = (roomId: Room["id"], playerId: Player["id"]) => {
  const room = getRoomById(roomId);
  if (!room) {
    throw new Error("Room not found");
  }
  const player = room.players.find((p) => p.id === playerId);
  if (!player) {
    throw new Error("Player not found in the room");
  }
  if (!player.isHost) {
    throw new Error("Only the host can start the game");
  }
  const randomDrawerIndex = Math.floor(Math.random() * room.players.length);
  const firstDrawer = room.players[randomDrawerIndex];
  if (!firstDrawer) {
    throw new Error("No players in the room to start the game");
  }
  room.gameState = {
    currentRound: 1,
    currentDrawerId: firstDrawer.id,
    currentWord: null,
    hintLetters: [],
    roomState: RoomState.DRAWING,
    timerStartedAt: null,
    drawingData: [],
  };

  return room;
};

export const handlePlayerLeft = (
  roomId: Room["id"],
  playerId: Player["id"],
) => {
  const room = getRoomById(roomId);
  if (!room) {
    throw new Error("Room not found");
  }
  const playerIndex = room.players.findIndex((p) => p.id === playerId);
  if (playerIndex === -1) {
    throw new Error("Player not found in the room");
  }
  const wasHost = room.players?.[playerIndex]?.isHost;
  room.players.splice(playerIndex, 1);
  // If the host left, assign a new host if there are still players left
  if (wasHost && room.players.length > 0) {
    if (room.players.length === 0) {
      // No players left, end the game
      room.gameState = null;
    } else {
      // Assign a new drawer (for simplicity, we just pick the next player in the list)
      const newDrawerId = room.players?.[0]?.id ?? null;
      if (!newDrawerId) {
        room.gameState = null; // No players left, end the game
        throw new Error("No players left to assign as drawer");
      }
      if (room.gameState) {
        room.gameState.currentDrawerId = newDrawerId;
        room.gameState.roomState = RoomState.PLAYER_CHOOSE_WORD; // Move back to word selection phase
      }
    }
  }

  return room;
};

export const handleDrawingAction = (
  roomId: Room["id"],
  playerId: Player["id"],
  action: DrawDataUpdateType,
  drawingData: DrawDataPoint,
) => {
  const room = getRoomById(roomId);
  if (!room) {
    throw new Error("Room not found");
  }
  const player = room.players.find((p) => p.id === playerId);
  if (!player) {
    throw new Error("Player not found in the room");
  }
  if (room.gameState?.currentDrawerId !== playerId) {
    throw new Error("Only the current drawer can perform drawing actions");
  }
  if (action === "DRAW") {
    room.gameState?.drawingData.push(drawingData);
  } else if (action === "CLEAR") {
    room.gameState!.drawingData = [];
  }

  return room;
};

export const endGame = (roomId: string) => {
  //TODO - implement game logic to end the game, for now we will just log the action
  console.log(`Ending game for room ${roomId}`);
};
