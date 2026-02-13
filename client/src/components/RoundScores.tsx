import React from "react";
import type { Player, GameState } from "../types";

interface RoundScoresProps {
  players: Player[];
  localPlayerId?: string;
  roundScores: GameState["roundScores"];
  currentRound: number;
}

export const RoundScores: React.FC<RoundScoresProps> = ({
  players,
  localPlayerId,
  roundScores,
  currentRound,
}) => {
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {players
        .slice()
        .sort((a, b) => b.score - a.score)
        .map((player) => {
          // Get round score for this player for the current round
          let roundScore: number = 0;
          if (roundScores && currentRound && roundScores[currentRound]) {
            const playerScoreEntry = roundScores[currentRound]?.find(
              (entry) => entry.playerId === player.id,
            );

            roundScore = playerScoreEntry ? playerScoreEntry.score : 0;
          }
          return (
            <li
              key={player.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.25rem 0.5rem",
                borderRadius: "0.25rem",
                background: player.id === localPlayerId ? "#e3f0ff" : undefined,
                fontWeight: player.id === localPlayerId ? 600 : 400,
                marginBottom: "0.25rem",
              }}
            >
              <span style={{ color: player.color }}>
                {player.name}
                {player.id === localPlayerId ? " (You)" : ""}
              </span>
              <span style={{ color: "#4f86c6", fontWeight: 600 }}>
                {player.score}
                <span
                  style={{
                    color:
                      roundScore > 0
                        ? "#2ca02c"
                        : roundScore < 0
                          ? "#d62728"
                          : "#888",
                    fontWeight: 400,
                    marginLeft: 8,
                  }}
                >
                  {roundScore > 0
                    ? `(+${roundScore})`
                    : roundScore < 0
                      ? `(${roundScore})`
                      : `(0)`}
                </span>
              </span>
            </li>
          );
        })}
    </ul>
  );
};
