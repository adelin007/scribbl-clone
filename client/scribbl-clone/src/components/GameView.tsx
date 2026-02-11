import type { GameViewProps } from "../types/views";

export const GameView = ({ playerName, playerColor }: GameViewProps) => (
  <section className="view game-view">
    <div className="game-topbar panel">
      <div>
        <strong>Round 1</strong>
        <span className="muted"> / 3</span>
      </div>
      <div className="game-topbar-center">Draw the word!</div>
      <div className="game-timer">01:32</div>
    </div>

    <div className="game-grid">
      <aside className="panel game-players">
        <h3>Players</h3>
        <ul className="list">
          <li className="list-item">
            <span className="avatar" style={{ backgroundColor: playerColor }} />
            {playerName || "Player"}
          </li>
          <li className="list-item">Luna</li>
          <li className="list-item">Kai</li>
          <li className="list-item">Mara</li>
        </ul>
      </aside>

      <section className="panel game-board">
        <div className="canvas">Canvas</div>
        <div className="tools">
          <div className="tool-row">
            <button className="btn secondary">Undo</button>
            <button className="btn secondary">Clear</button>
            <button className="btn secondary">Fill</button>
          </div>
          <div className="tool-row">
            <span className="label">Brush</span>
            <div className="brush-sizes">
              <span className="brush-dot small" />
              <span className="brush-dot" />
              <span className="brush-dot large" />
            </div>
          </div>
          <div className="tool-row">
            <span className="label">Colors</span>
            <div className="color-palette">
              <span className="color" style={{ backgroundColor: "#000000" }} />
              <span className="color" style={{ backgroundColor: "#ff5b5b" }} />
              <span className="color" style={{ backgroundColor: "#ffd166" }} />
              <span className="color" style={{ backgroundColor: "#06d6a0" }} />
              <span className="color" style={{ backgroundColor: "#118ab2" }} />
              <span className="color" style={{ backgroundColor: "#ffffff" }} />
            </div>
          </div>
        </div>
      </section>

      <aside className="panel game-chat">
        <h3>Chat</h3>
        <div className="chat-feed">
          <div className="chat-line">
            <strong>System:</strong> Game started!
          </div>
          <div className="chat-line">
            <strong>Luna:</strong> hello!
          </div>
          <div className="chat-line">
            <strong>Kai:</strong> is it a cat?
          </div>
        </div>
        <input
          className="chat-input"
          type="text"
          placeholder="Type your guess..."
        />
      </aside>
    </div>

    <div className="panel game-prompt">
      <span className="label">Word:</span>
      <span className="word-placeholder">_ _ _ _ _</span>
    </div>
  </section>
);
