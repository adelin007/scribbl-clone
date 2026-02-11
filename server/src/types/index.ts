export enum GameEvent {
  // Client events
  CONNECT = "connect",
  DISCONNECT = "disconnect",
  CONNECT_ERROR = "connect_error",
  JOIN_ROOM = "joinRoom",
  CREATE_ROOM = "createRoom",
  LEAVE_ROOM = "leaveRoom",
  START_GAME = "startGame",
  DRAW = "draw",
  GUESS = "guess",
  CHANGE_SETTINGS = "changeSettings",
  WORD_SELECT = "wordSelect",

  // Server events
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
  DRAWING_DATA = "drawingData",
  GUESS_MADE = "guessMade",
}

export interface PlayerData {
  name: string;
  color: string;
}

export interface Player extends PlayerData {
  id: string;
  score: boolean;
  guessed: boolean;
  guessedAt: string | null; // ISO timestamp
}
