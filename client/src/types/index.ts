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
