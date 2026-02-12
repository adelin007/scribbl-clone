import { io } from "socket.io-client";
import { GameEvent } from "../types";
import type {
  ChangeRoomSettingsData,
  CreateRoomData,
  DrawDataPoint,
  DrawDataUpdateType,
  GameEventType,
  JoinRoomData,
  Player,
  Room,
} from "../types";

const URL = "http://localhost:3000";

export const socket = io(URL, { autoConnect: false });

export type ClientConnectionEvent =
  | "connecting"
  | "connected"
  | "disconnecting"
  | "disconnected"
  | "error";

export type ClientActionEvent = GameEventType;

export type ClientEvent = ClientConnectionEvent | ClientActionEvent;

export type ClientEventPayload = {
  reason?: string;
  error?: Error;
  data?: unknown;
};

type ClientEventHandler = (payload?: ClientEventPayload) => void;

const clientEventListeners = new Map<ClientEvent, Set<ClientEventHandler>>();

const emitClientEvent = (event: ClientEvent, payload?: ClientEventPayload) => {
  const listeners = clientEventListeners.get(event);
  if (!listeners) return;
  listeners.forEach((handler) => handler(payload));
};

export const onClientEvent = (
  event: ClientEvent,
  handler: ClientEventHandler,
) => {
  const listeners = clientEventListeners.get(event) ?? new Set();
  listeners.add(handler);
  clientEventListeners.set(event, listeners);

  return () => {
    listeners.delete(handler);
    if (listeners.size === 0) {
      clientEventListeners.delete(event);
    }
  };
};

export const connectSocket = () => {
  emitClientEvent("connecting");
  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  emitClientEvent("disconnecting");
  if (socket.connected) {
    socket.disconnect();
  }
};

const emitClientAction = (event: ClientActionEvent, data?: unknown) => {
  emitClientEvent(event, { data });
  socket.emit(event, data);
};

export const joinRoom = (data: JoinRoomData) => {
  emitClientAction(GameEvent.JOIN_ROOM, data);
};

export const createRoom = (data?: CreateRoomData) => {
  emitClientAction("createRoom", data);
};

export const changeRoomSettings = (data: ChangeRoomSettingsData) => {
  emitClientAction("changeRoomSettings", data);
};

export const leaveRoom = () => {
  emitClientAction(GameEvent.LEAVE_ROOM);
};

export const startGame = (data?: unknown) => {
  emitClientAction("startGame", data);
};

export const draw = (data?: unknown) => {
  emitClientAction("draw", data);
};

export const guess = (data?: unknown) => {
  emitClientAction("guess", data);
};

export const changeSettings = (data?: unknown) => {
  emitClientAction("changeSettings", data);
};

export const wordSelect = (data?: unknown) => {
  emitClientAction("wordSelect", data);
};

export const sendDrawingData = (data: {
  roomId: string;
  playerId: string;
  action: DrawDataUpdateType;
  drawingData: DrawDataPoint;
}) => {
  emitClientAction(GameEvent.DRAWING_DATA, data);
};

export const sendGuess = (data: {
  roomId: Room["id"];
  playerId: Player["id"];
  guess: string;
}) => {
  emitClientAction(GameEvent.GUESS_MADE, data);
};

export const selectWord = (data: {
  roomId: Room["id"];
  playerId: Player["id"];
  word: string;
}) => {
  emitClientAction(GameEvent.WORD_SELECT, data);
};

socket.on("connect", () => {
  emitClientEvent("connected");
});

socket.on("disconnect", (reason) => {
  emitClientEvent("disconnected", { reason });
});

socket.on("connect_error", (error) => {
  emitClientEvent("error", { error });
});

socket.on("roomCreated", (data: Room) => {
  emitClientEvent("roomCreated", { data });
});

socket.on(GameEvent.JOINED_ROOM, (data: Room) => {
  emitClientEvent(GameEvent.JOINED_ROOM, { data });
});

socket.on(GameEvent.PLAYER_JOINED, (data: Room) => {
  emitClientEvent(GameEvent.PLAYER_JOINED, { data });
});

socket.on(GameEvent.PLAYER_LEFT, (data: Room) => {
  emitClientEvent(GameEvent.PLAYER_LEFT, { data });
});

socket.on(GameEvent.GAME_STARTED, (data: Room) => {
  emitClientEvent(GameEvent.GAME_STARTED, { data });
});

socket.on(GameEvent.UPDATED_DRAWING_DATA, (data: Room) => {
  emitClientEvent(GameEvent.UPDATED_DRAWING_DATA, { data });
});

socket.on(GameEvent.GAME_ENDED, (data) => {
  emitClientEvent(GameEvent.GAME_ENDED, { data });
});

socket.on(GameEvent.GUESS_MADE, (data) => {
  emitClientEvent(GameEvent.GUESS_MADE, { data });
});

socket.on(GameEvent.ROUND_STARTED, (data: Room) => {
  emitClientEvent(GameEvent.ROUND_STARTED, { data });
});

socket.on(GameEvent.WORD_SELECTED, (data: Room) => {
  emitClientEvent(GameEvent.WORD_SELECTED, { data });
});

socket.on("error", (error: { error: string }) => {
  emitClientEvent("error", { error: new Error(error.error) });
});
