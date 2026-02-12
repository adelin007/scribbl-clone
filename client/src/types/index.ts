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
  DRAWING_DATA: "drawingData",
  GUESS_MADE: "guessMade",
} as const;

export type GameEventType = (typeof GameEvent)[keyof typeof GameEvent];

export interface PlayerData {
  name: string;
  color: string;
}

export interface Player extends PlayerData {
  id: string;
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
