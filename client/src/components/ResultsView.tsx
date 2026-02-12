import type { ResultsViewProps } from "../types/views";

export const ResultsView = ({
  playerName,
  message,
  onBackToStart,
}: ResultsViewProps) => (
  <section className="view results-view">
    <div className="panel results-panel">
      <h2>Results</h2>
      {message && <p className="muted">{message}</p>}
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
      <div className="flex justify-center justify-items-center">
        <button className="btn primary" onClick={onBackToStart}>
          Back to Start
        </button>
      </div>
    </div>
  </section>
);
