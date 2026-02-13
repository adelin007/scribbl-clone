import type { Player, PlayerData, Room } from "../types/index.ts";
import { RoomState } from "../types/index.ts";
import { createPlayer } from "./gameController.ts";
import {
  setRedis,
  delRedis,
  getRedis,
  connectRedis,
} from "../lib/redisClient.ts";
import redisClient from "../lib/redisClient.ts";

interface CreateRoomData {
  host: PlayerData;
  socketId: string;
  settings: Room["settings"];
}

//TODO - implement database to store rooms and players, for now we will use an in-memory store
export const rooms: Set<Room> = new Set();

const initRooms = async () => {
  try {
    await connectRedis();
    // scan for keys matching room:*
    // redis client exposes .keys; for large datasets consider SCAN
    const keys = await redisClient.keys("room:*");
    for (const key of keys) {
      try {
        const raw = await getRedis(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        if (parsed && parsed.id) {
          rooms.add(parsed as Room);
        }
      } catch (err) {
        console.warn(`Failed to parse room from redis key ${key}:`, err);
      }
    }
    console.log(`Hydrated ${rooms.size} rooms from redis`);
  } catch (err) {
    console.warn("Failed to initialize rooms from redis", err);
  }
};

// hydrate rooms in background
void initRooms();

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

  console.log(`Deleting room ${roomId}`);
  if (room) {
    rooms.delete(room);
    // perform async removal from redis and log errors; do not block callers
    try {
      setRedis(`room:${roomId}`, JSON.stringify(null)).catch((err) =>
        console.warn(`Failed to set null for room:${roomId} in redis`, err),
      );
      delRedis(`room:${roomId}`).catch((err) =>
        console.warn(`Failed to delete room:${roomId} from redis`, err),
      );
    } catch (err) {
      console.warn("Failed to initiate redis removal for room", err);
    }
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
  try {
    void setRedis(`room:${newRoom.id}`, JSON.stringify(newRoom));
  } catch (err) {
    console.warn("Failed to persist room to redis", err);
  }
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
  try {
    void setRedis(`room:${room.id}`, JSON.stringify(room));
  } catch (err) {
    console.warn("Failed to persist room to redis", err);
  }
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
  try {
    void setRedis(`room:${room.id}`, JSON.stringify(room));
  } catch (err) {
    console.warn("Failed to persist room settings to redis", err);
  }
  console.log(`Room ${roomId} settings changed: `, room.settings);
  return room;
};
