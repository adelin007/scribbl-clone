import type { Player, PlayerData, Room } from "../types/index.ts";
import { createPlayer } from "./gameController.ts";

interface CreateRoomData {
  host: PlayerData;
  socketId: string;
  settings: Room["settings"];
}

//TODO - implement database to store rooms and players, for now we will use an in-memory store
const rooms: Set<Room> = new Set();

export const createRoom = (data: CreateRoomData) => {
  console.log("Creating room with data: ", data);
  const newPlayer: Player = createPlayer(data.host);
  const newRoom: Room = {
    id: crypto.randomUUID(),
    hostId: newPlayer.id,
    socketId: data.socketId,
    players: [newPlayer],
    settings: data.settings,
  };
  rooms.add(newRoom);
  console.log("Current rooms: ", rooms);
  return newRoom;
};

export const joinRoom = (roomId: string, playerData: PlayerData) => {
  const room = Array.from(rooms).find((r) => r.id === roomId);
  if (!room) {
    throw new Error("Room not found");
  }
  const newPlayer: Player = createPlayer(playerData);
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
