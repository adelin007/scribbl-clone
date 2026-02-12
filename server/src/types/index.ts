export enum GameEvent {
  // Client events
  CONNECT = "connect",
  DISCONNECT = "disconnect",
  CONNECT_ERROR = "connect_error",
  JOIN_ROOM = "joinRoom",
  CREATE_ROOM = "createRoom",
  CHANGE_ROOM_SETTINGS = "changeRoomSettings",
  LEAVE_ROOM = "leaveRoom",
  START_GAME = "startGame",
  DRAW = "draw",
  GUESS = "guess",
  CHANGE_SETTINGS = "changeSettings",
  WORD_SELECT = "wordSelect",
  DRAWING_DATA = "drawingData",

  // Server events
  ROOM_CREATED = "roomCreated",
  JOINED_ROOM = "joinedRoom",
  LEFT_ROOM = "leftRoom",
  GAME_STARTED = "gameStarted",
  GAME_ENDED = "gameEnded",
  PLAYER_JOINED = "playerJoined",
  PLAYER_LEFT = "playerLeft",
  PLAYER_READY = "playerReady",
  PLAYER_UNREADY = "playerUnready",
  SETTINGS_CHANGED = "settingsChanged",
  WORD_SELECTED = "wordSelected",
  UPDATED_DRAWING_DATA = "updatedDrawingData",
  GUESS_MADE = "guessMade",
  GUESS_CORRECT = "guessCorrect",
  HOST_CHANGED = "hostChanged",
}

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

export enum RoomState {
  WAITING = "waiting",
  PLAYER_CHOOSE_WORD = "playerChooseWord",
  DRAWING = "drawing",
  GUESSED = "guessed",
  ROUND_END = "roundEnd",
  ENDED = "ended",
}

export interface GuessItem {
  playerId: string;
  guess: string;
  correct: boolean;
  guessedAt: string; // ISO timestamp
}

export interface HintLetters {
  index: number;
  letter: string;
}
export interface GameState {
  currentRound: number;
  currentDrawerId: string | null;
  currentWord: string | null;
  hintLetters: HintLetters[];
  roomState: RoomState;
  timerStartedAt: string | null; // ISO timestamp
  drawingData: DrawDataPoint[]; // Store drawing data for replaying on client
  guesses: GuessItem[]; // Store guesses for replaying on client
}

export interface ClientCreateRoomData extends PlayerData {
  drawTime: number;
  rounds: number;
}

export type GameEndedReason = "hostLeft" | "notEnoughPlayers";

export interface GameEndedPayload {
  roomId: Room["id"];
  reason: GameEndedReason;
}

export type ShapeType = "circle" | "triangle" | "rectangle";
export type Tool = "brush" | "eraser" | "bucket" | "shape";

export interface DrawStrokeDataPoint {
  roomId: string;
  playerId: string;
  tool: "brush" | "eraser" | "bucket";
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
