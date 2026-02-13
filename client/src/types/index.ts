export const GameEvent = {
  // Client events
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  CONNECT_ERROR: "connect_error",
  JOIN_ROOM: "joinRoom",
  CREATE_ROOM: "createRoom",
  CHANGE_ROOM_SETTINGS: "changeRoomSettings",
  LEAVE_ROOM: "leaveRoom",
  START_GAME: "startGame",
  DRAW: "draw",
  GUESS: "guess",
  CHANGE_SETTINGS: "changeSettings",
  WORD_SELECT: "wordSelect",
  DRAWING_DATA: "drawingData",

  // Server events
  ROOM_CREATED: "roomCreated",
  JOINED_ROOM: "joinedRoom",
  LEFT_ROOM: "leftRoom",
  GAME_STARTED: "gameStarted",
  GAME_ENDED: "gameEnded",
  PLAYER_JOINED: "playerJoined",
  PLAYER_LEFT: "playerLeft",
  PLAYER_READY: "playerReady",
  PLAYER_UNREADY: "playerUnready",
  SETTINGS_CHANGED: "settingsChanged",
  WORD_SELECTED: "wordSelected",
  UPDATED_DRAWING_DATA: "updatedDrawingData",

  GUESS_MADE: "guessMade",
  GUESS_CORRECT: "guessCorrect",
  HOST_CHANGED: "hostChanged",
  ROUND_STARTED: "roundStarted",
} as const;

export type GameEventType = (typeof GameEvent)[keyof typeof GameEvent];

export interface PlayerData {
  name: string;
  color: string;
}

export interface Player extends PlayerData {
  id: string;
  socketId: string;
  isHost: boolean;
  score: number;
  guessed: boolean;
  guessedAt: string | null; // ISO timestamp
}

export interface RoomSettings {
  maxPlayers: number;
  drawTime: number; // in seconds
  roundTime: number; // in seconds
  rounds: number;
}
export interface HintLetters {
  index: number;
  letter: string;
}

export interface GuessItem {
  playerId: string;
  guess: string;
  correct: boolean;
  guessedAt: string; // ISO timestamp
}
export interface RoundScore {
  playerId: string;
  score: number;
}
export interface GameState {
  currentRound: number;
  currentDrawerId: string | null;
  currentWord: string | null;
  lastWord: string | null;
  wordChoices: string[];
  hintLetters: HintLetters[];
  roomState: RoomStateType;
  timerStartedAt: string | null; // ISO timestamp
  drawingData: DrawDataPoint[]; // Store drawing data for replaying on client
  guesses: GuessItem[]; // Store guesses for replaying on client - this is the actual chat messages with guesses, correct or incorrect, along with timestamps
  roundScores: {
    [round: number]: RoundScore[];
  };
}

export const RoomState = {
  WAITING: "waiting",
  PLAYER_CHOOSE_WORD: "playerChooseWord",
  DRAWING: "drawing",
  GUESSED: "guessed",
  ROUND_END: "roundEnd",
  ENDED: "ended",
} as const;

export type RoomStateType = (typeof RoomState)[keyof typeof RoomState];
export interface Room {
  id: string;
  hostId: string;
  socketId: string;
  players: Player[];
  settings: RoomSettings;
  gameState: GameState | null; // null while in lobby, populated when game starts
}

export interface RoomSettings {
  maxPlayers: number;
  drawTime: number; // in seconds
  roundTime: number; // in seconds
  rounds: number;
}

export interface ClientCreateRoomData extends PlayerData {
  drawTime: number;
  rounds: number;
}

export type GameEndedReason = "hostLeft" | "notEnoughPlayers";
export interface GameEndedPayload {
  room: Room;
  reason: GameEndedReason;
}

export interface CreateRoomData extends PlayerData {
  drawTime: number;
  rounds: number;
}
export interface ChangeRoomSettingsData {
  roomId: Room["id"];
  newSettings: Partial<RoomSettings>;
}

export interface JoinRoomData {
  roomId: Room["id"];
  playerData: PlayerData;
}

export type ShapeType = "circle" | "triangle" | "rectangle";
export type Tool = "brush" | "shape";

export interface DrawStrokeDataPoint {
  roomId: string;
  playerId: string;
  tool: "brush";
  size: number;
  color: string;
  x: number;
  y: number;
  timestamp: string; // ISO timestamp
}

export interface DrawShapeDataPoint {
  roomId: string;
  playerId: string;
  tool: "shape";
  size: number;
  color: string;
  shape: {
    kind: ShapeType;
    start: { x: number; y: number };
    end: { x: number; y: number };
  };
  timestamp: string; // ISO timestamp
}

export type DrawDataPoint = DrawStrokeDataPoint | DrawShapeDataPoint;

export type DrawDataUpdateType = "DRAW" | "CLEAR";
