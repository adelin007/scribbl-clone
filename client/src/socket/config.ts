import { io } from "socket.io-client";
import type { ChangeRoomSettingsData, GameEvent, PlayerData } from "../types";

const URL = "http://localhost:3000";

export const socket = io(URL, { autoConnect: false });

export type ClientConnectionEvent =
  | "connecting"
  | "connected"
  | "disconnecting"
  | "disconnected"
  | "error";

export type ClientActionEvent = GameEvent;

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

export const joinRoom = (data?: unknown) => {
  emitClientAction("joinRoom", data);
};

interface CreateRoomData extends PlayerData {
  drawTime: number;
  rounds: number;
}
export const createRoom = (data?: CreateRoomData) => {
  emitClientAction("createRoom", data);
};

export const changeRoomSettings = (data: ChangeRoomSettingsData) => {
  emitClientAction("changeRoomSettings", data);
};

export const leaveRoom = (data?: unknown) => {
  emitClientAction("leaveRoom", data);
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

socket.on("connect", () => {
  emitClientEvent("connected");
});

socket.on("disconnect", (reason) => {
  emitClientEvent("disconnected", { reason });
});

socket.on("connect_error", (error) => {
  emitClientEvent("error", { error });
});

socket.on("roomCreated", (data) => {
  emitClientEvent("roomCreated", { data });
});
