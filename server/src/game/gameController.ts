import {
  RoomState,
  type DrawDataPoint,
  type DrawDataUpdateType,
  type Player,
  type PlayerData,
  type Room,
} from "../types/index.ts";
import { deleteRoom, getRoomById, rooms } from "./roomController.ts";

const words = [
  "apple",
  "banana",
  "cat",
  "dog",
  "elephant",
  "flower",
  "guitar",
  "house",
];

export const getRandomWord = () => {
  const randomIndex = Math.floor(Math.random() * words.length);
  return words[randomIndex] ?? null;
};

//TODO - implement database to store rooms and players, for now we will use an in-memory store
const players: Set<Player> = new Set();
export const createPlayer = (
  playerData: PlayerData,
  socketId: string,
  isHost: boolean,
): Player => {
  const newPlayer: Player = {
    id: crypto.randomUUID(),
    socketId,
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
    currentWord: getRandomWord(),
    hintLetters: [],
    guesses: [],
    roomState: RoomState.DRAWING,
    timerStartedAt: null,
    drawingData: [],
  };

  return room;
};

export const handleGuess = (
  roomId: Room["id"],
  playerId: Player["id"],
  guess: string,
) => {
  const room = getRoomById(roomId);
  if (!room) {
    throw new Error("Room not found");
  }
  const player = room.players.find((p) => p.id === playerId);
  if (!player) {
    throw new Error("Player not found in the room");
  }
  if (room.gameState?.roomState !== RoomState.DRAWING) {
    throw new Error("Game is not currently in drawing state");
  }
  const correct =
    guess.toLowerCase() === room.gameState.currentWord?.toLowerCase();
  const guessItem = {
    playerId,
    guess,
    correct,
    guessedAt: new Date().toISOString(),
  };
  room.gameState.guesses.push(guessItem);

  if (correct) {
    player.score += Math.max(
      10 - room.gameState.guesses.filter((g) => g.correct).length, // More points for earlier correct guesses
      1,
    );
    player.guessed = true;
    player.guessedAt = guessItem.guessedAt;
  }

  return { room, guessItem };
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
  const removedPlayer = room.players[playerIndex];
  const wasHost = removedPlayer?.isHost;
  room.players.splice(playerIndex, 1);

  if (wasHost) {
    room.gameState = null;
    deleteRoom(room.id);
    return {
      room,
      removedPlayer,
      hostLeft: true,
      notEnoughPlayers: false,
      roomDeleted: true,
    };
  }

  if (room.players.length < 2) {
    deleteRoom(room.id);
    return {
      room: null,
      removedPlayer,
      hostLeft: false,
      notEnoughPlayers: true,
      roomDeleted: true,
    };
  }

  return {
    room,
    removedPlayer,
    hostLeft: false,
    notEnoughPlayers: false,
    roomDeleted: false,
  };
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
