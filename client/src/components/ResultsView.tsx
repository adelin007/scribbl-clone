import type { ResultsViewProps } from "../types/views";

export const ResultsView = ({
  playerName,
  onBackToLobby,
}: ResultsViewProps) => (
  <section className="view results-view">
    <div className="panel results-panel">
      <h2>Results</h2>
      <ol className="results-list">
        <li>
          {playerName || "Player"} <span className="muted">- 620 pts</span>
        </li>
        <li>
          Luna <span className="muted">- 540 pts</span>
        </li>
        <li>
          Kai <span className="muted">- 410 pts</span>
        </li>
      </ol>
      <button className="btn primary" onClick={onBackToLobby}>
        Back to Lobby
      </button>
    </div>
  </section>
);
