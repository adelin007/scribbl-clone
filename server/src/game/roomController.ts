import type { Player, PlayerData, Room } from "../types/index.ts";
import { RoomState } from "../types/index.ts";
import { createPlayer } from "./gameController.ts";

interface CreateRoomData {
  host: PlayerData;
  socketId: string;
  settings: Room["settings"];
}

//TODO - implement database to store rooms and players, for now we will use an in-memory store
export const rooms: Set<Room> = new Set();

export const getRoomById = (roomId: string): Room | undefined => {
  return Array.from(rooms).find((r) => r.id === roomId);
};

export const getRoomBySocketId = (socketId: string): Room | undefined => {
  return Array.from(rooms).find((r) => r.socketId === socketId);
};

export const getRoomByPlayerSocketId = (socketId: string): Room | undefined => {
  return Array.from(rooms).find((room) =>
    room.players.some((player) => player.socketId === socketId),
  );
};

export const getAllRooms = (): Room[] => {
  return Array.from(rooms);
};

export const deleteRoom = (roomId: string) => {
  const room = getRoomById(roomId);
  if (room) {
    rooms.delete(room);
  }
};

export const createRoom = (data: CreateRoomData) => {
  console.log("Creating room with data: ", data);
  const newPlayer: Player = createPlayer(data.host, data.socketId, true);
  const newRoom: Room = {
    id: crypto.randomUUID(),
    hostId: newPlayer.id,
    socketId: data.socketId,
    players: [newPlayer],
    settings: data.settings,
    gameState: null,
  };
  rooms.add(newRoom);
  console.log("Current rooms: ", rooms);
  return newRoom;
};

export const joinRoom = (
  roomId: string,
  playerData: PlayerData,
  socketId: string,
) => {
  const room = Array.from(rooms).find((r) => r.id === roomId);
  if (!room) {
    throw new Error("Room not found");
  }
  // Prevent joining if game has already started
  if (room.gameState && room.gameState.roomState !== RoomState.WAITING) {
    throw new Error("Cannot join room: game has already started");
  }
  const newPlayer: Player = createPlayer(playerData, socketId, false);
  room.players.push(newPlayer);
  return room;
};

export const changeRoomSettings = (
  roomId: string,
  newSettings: Partial<Room["settings"]>,
) => {
  console.log(`Changing settings for room ${roomId}`);
  console.log("Old rooms: ", rooms);

  const room = Array.from(rooms).find((r) => r.id === roomId);
  if (!room) {
    throw new Error("Room not found");
  }
  room.settings = { ...room.settings, ...newSettings };
  console.log(`Room ${roomId} settings changed: `, room.settings);
  return room;
};
