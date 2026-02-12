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
}

export interface PlayerData {
  name: string;
  color: string;
}

export interface Player extends PlayerData {
  id: string;
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
  IN_GAME = "in_game",
  PLAYER_CHOOSE_WORD = "playerChooseWord",
  DRAWING = "drawing",
  GUESSED = "guessed",
  ENDED = "ended",
}

export interface GuessedLetters {
  index: number;
  letter: string;
}
export interface GameState {
  currentRound: number;
  currentDrawerId: string | null;
  currentWord: string | null;
  hintLetters: GuessedLetters[];
  roomState: RoomState;
  timerStartedAt: string | null; // ISO timestamp
  drawingData: DrawDataPoint[]; // Store drawing data for replaying on client
}

export interface ClientCreateRoomData extends PlayerData {
  drawTime: number;
  rounds: number;
}

export type Tool = "brush" | "eraser" | "bucket";
export interface DrawDataPoint {
  roomId: string;
  playerId: string;
  tool: Tool;
  size: number;
  color: string;
  x: number;
  y: number;
  timestamp: string; // ISO timestamp
}

export type DrawDataUpdateType = "DRAW" | "CLEAR";
