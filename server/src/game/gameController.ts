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
