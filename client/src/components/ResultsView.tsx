import type { ResultsViewProps } from "../types/views";

export const ResultsView = ({
  players,
  message,
  onBackToStart,
}: ResultsViewProps) => (
  <section className="view results-view">
    <div className="panel results-panel">
      <h2>Results</h2>
      {message && <p className="muted">{message}</p>}
      <ol className="results-list">
        {players
          .sort((a, b) => b.score - a.score)
          .map((player) => (
            <li key={player.id}>
              {player.name || "Player"}{" "}
              <span className="muted">- {player.score} pts</span>
            </li>
          ))}
      </ol>
      <div className="flex justify-center justify-items-center">
        <button className="btn primary" onClick={onBackToStart}>
          Back to Start
        </button>
      </div>
    </div>
  </section>
);
