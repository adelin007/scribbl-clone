import type { Player, PlayerData } from "../types/index.ts";

//TODO - implement database to store rooms and players, for now we will use an in-memory store
const players: Set<Player> = new Set();
export const createPlayer = (
  playerData: PlayerData,
  isHost: boolean,
): Player => {
  const newPlayer: Player = {
    id: crypto.randomUUID(),
    isHost,
    name: playerData.name,
    color: playerData.color,
    score: 0,
    guessed: false,
    guessedAt: null,
  };
  players.add(newPlayer);
  return newPlayer;
};
