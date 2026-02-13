import {
  RoomState,
  type DrawDataPoint,
  type DrawDataUpdateType,
  type Player,
  type PlayerData,
  type Room,
} from "../types/index.ts";
import { deleteRoom, getRoomById, rooms } from "./roomController.ts";

// State Machine Definition
const STATE_TRANSITIONS: Record<RoomState, RoomState[]> = {
  [RoomState.WAITING]: [RoomState.PLAYER_CHOOSE_WORD],
  [RoomState.PLAYER_CHOOSE_WORD]: [RoomState.DRAWING, RoomState.ENDED],
  [RoomState.DRAWING]: [
    RoomState.GUESSED,
    RoomState.ROUND_END,
    RoomState.ENDED,
  ],
  [RoomState.GUESSED]: [RoomState.ROUND_END, RoomState.ENDED],
  [RoomState.ROUND_END]: [RoomState.PLAYER_CHOOSE_WORD, RoomState.ENDED],
  [RoomState.ENDED]: [],
};

const validateStateTransition = (
  currentState: RoomState,
  nextState: RoomState,
): boolean => {
  return STATE_TRANSITIONS[currentState]?.includes(nextState) ?? false;
};

const transitionState = (room: Room, nextState: RoomState): void => {
  if (!room.gameState) {
    throw new Error("Cannot transition state: game state is null");
  }

  if (!validateStateTransition(room.gameState.roomState, nextState)) {
    throw new Error(
      `Invalid state transition from ${room.gameState.roomState} to ${nextState}`,
    );
  }

  room.gameState.roomState = nextState;

  // Handle ROUND_END transition
  if (nextState === RoomState.ROUND_END) {
    // Reset all players' guessed status
    room.players.forEach((player) => {
      player.guessed = false;
      player.guessedAt = null;
    });

    // Clear guesses array
    room.gameState.guesses = [];

    // Clear drawing data
    room.gameState.drawingData = [];

    // Select next drawer (rotate through players)
    const currentDrawerIndex = room.players.findIndex(
      (p) => p.id === room.gameState?.currentDrawerId,
    );
    const nextDrawerIndex = (currentDrawerIndex + 1) % room.players.length;
    room.gameState.currentDrawerId = room.players[nextDrawerIndex]?.id ?? null;

    // Save current word as lastWord, then clear current word and provide new choices
    room.gameState.lastWord = room.gameState.currentWord;
    room.gameState.currentWord = null;
    room.gameState.wordChoices = getRandomWords(3);

    // Increment round if we've cycled through all players
    if (nextDrawerIndex === 0) {
      room.gameState.currentRound += 1;
    }

    // If we've reached the max rounds, transition to ENDED
    if (room.gameState.currentRound > room.settings.rounds) {
      room.gameState.currentRound = room.settings.rounds; // Cap at max rounds
      transitionState(room, RoomState.ENDED);
      return;
    }

    // Transition to PLAYER_CHOOSE_WORD and wait for drawer to select
    room.gameState.roomState = RoomState.PLAYER_CHOOSE_WORD;
  }
};

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

export const getRandomWords = (count: number = 3): string[] => {
  const shuffled = [...words].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, words.length));
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

  const roundScores = new Map<number, { playerId: string; score: number }[]>();
  roundScores.set(
    1,
    room.players.map((p) => ({ playerId: p.id, score: 0 })),
  );

  console.log("ROUND_SCORES: ", roundScores);

  room.gameState = {
    currentRound: 1,
    currentDrawerId: firstDrawer.id,
    currentWord: null,
    lastWord: null,
    wordChoices: getRandomWords(3),
    hintLetters: [],
    guesses: [],
    roomState: RoomState.PLAYER_CHOOSE_WORD,
    timerStartedAt: null,
    drawingData: [],
    roundScores: {
      1: [],
    },
  };

  console.log("ROOM_GAME_STATE: ", room.gameState);

  return room;
};

export const handleWordSelect = (
  roomId: Room["id"],
  playerId: Player["id"],
  selectedWord: string,
) => {
  const room = getRoomById(roomId);
  if (!room) {
    throw new Error("Room not found");
  }
  if (!room.gameState) {
    throw new Error("Game state not found");
  }
  if (room.gameState.roomState !== RoomState.PLAYER_CHOOSE_WORD) {
    throw new Error("Game is not in word selection state");
  }
  if (room.gameState.currentDrawerId !== playerId) {
    throw new Error("Only the current drawer can select a word");
  }
  if (!room.gameState.wordChoices.includes(selectedWord)) {
    throw new Error("Invalid word selection");
  }

  // Set the selected word and transition to DRAWING
  room.gameState.currentWord = selectedWord;
  room.gameState.wordChoices = [];
  transitionState(room, RoomState.DRAWING);

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
  if (player.guessed) {
    throw new Error("Player has already guessed correctly");
  }
  if (room.gameState.currentDrawerId === playerId) {
    throw new Error("Drawer cannot make guesses");
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
    const roundScore = Math.max(
      10 - room.gameState.guesses.filter((g) => g.correct).length, // More points for earlier correct guesses
      1,
    );
    player.score += roundScore;
    player.guessed = true;
    player.guessedAt = guessItem.guessedAt;

    if (!room.gameState.roundScores[room.gameState.currentRound]) {
      room.gameState.roundScores[room.gameState.currentRound] = [];
    }

    room.gameState.roundScores[room.gameState.currentRound] = [
      ...(room.gameState.roundScores[room.gameState.currentRound] ?? []),
      {
        playerId,
        score: roundScore,
      },
    ];

    // Check if all non-drawer players have guessed correctly
    const nonDrawerPlayers = room.players.filter(
      (p) => p.id !== room.gameState?.currentDrawerId,
    );
    const allGuessed = nonDrawerPlayers.every((p) => p.guessed);

    if (allGuessed) {
      // Award drawer points: half of the highest round score (rounded down), times number of correct guessers
      const roundScoresArr =
        room.gameState.roundScores[room.gameState.currentRound] || [];
      const highestScore = roundScoresArr.reduce(
        (max, s) => (s.score > max ? s.score : max),
        0,
      );
      const drawerScore = Math.floor(highestScore / 2) * roundScoresArr.length;
      if (drawerScore > 0 && room.gameState.currentDrawerId) {
        const drawer = room.players.find(
          (p) => p.id === room?.gameState?.currentDrawerId,
        );
        if (drawer && room.gameState.roundScores[room.gameState.currentRound]) {
          drawer.score += drawerScore;
          room.gameState.roundScores[room.gameState.currentRound]!.push({
            playerId: drawer.id,
            score: drawerScore,
          });
        }
      }

      transitionState(room, RoomState.ROUND_END);

      return {
        room,
        guessItem,
        roundEnded: true,
      };
    }
  }

  return { room, guessItem, roundEnded: false };
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
    // Transition to ENDED state if game was active
    if (room.gameState) {
      transitionState(room, RoomState.ENDED);
    }
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
    // Transition to ENDED state if game was active
    if (room.gameState) {
      transitionState(room, RoomState.ENDED);
    }
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
  const room = getRoomById(roomId);
  if (!room) {
    throw new Error("Room not found");
  }
  if (room.gameState) {
    transitionState(room, RoomState.ENDED);
  }
  return room;
};
