import type { LobbyViewProps } from "../types/views";

export const LobbyView = ({
  playerName,
  playerColor,
  playerCount,
  maxPlayers,
  isHost,
  startDisabled,
  showStartTooltip,
  inviteCopied,
  roomId,
  onHoverStart,
  onStart,
  onInvite,
}: LobbyViewProps) => (
  <section className="view lobby-view">
    <div className="lobby-header">
      <div>
        <h2>Lobby</h2>
        <p className="muted">
          Waiting for players ({playerCount}/{maxPlayers})
        </p>
      </div>
      <div className="lobby-status">Room Status: Open</div>
    </div>

    <div className="lobby-body">
      <div className="panel players-panel">
        <h3>Players</h3>
        <div className="player-list">
          <div className="player-card">
            <span className="avatar" style={{ backgroundColor: playerColor }} />
            <div className="player-meta">
              <span className="player-name">{playerName || "Player"}</span>
              <span className="player-role">{isHost ? "Host" : "Guest"}</span>
            </div>
            <span className={`player-status ${isHost ? "ready" : "not-ready"}`}>
              {isHost ? "Ready" : "Not ready"}
            </span>
          </div>

          <div className="player-card">
            <span className="avatar" style={{ backgroundColor: "#4f86c6" }} />
            <div className="player-meta">
              <span className="player-name">Luna</span>
              <span className="player-role">Guest</span>
            </div>
            <span className="player-status ready">Ready</span>
          </div>

          <div className="player-card">
            <span className="avatar" style={{ backgroundColor: "#f25c54" }} />
            <div className="player-meta">
              <span className="player-name">Kai</span>
              <span className="player-role">Guest</span>
            </div>
            <span className="player-status not-ready">Not ready</span>
          </div>

          <div className="player-card">
            <span className="avatar" style={{ backgroundColor: "#06d6a0" }} />
            <div className="player-meta">
              <span className="player-name">Mara</span>
              <span className="player-role">Guest</span>
            </div>
            <span className="player-status ready">Ready</span>
          </div>
        </div>
      </div>

      <div className="panel lobby-actions">
        <h3>Room Controls</h3>
        <div className="actions-row">
          <div
            className="start-button-wrap"
            onMouseEnter={() => {
              if (startDisabled) onHoverStart(true);
            }}
            onMouseLeave={() => onHoverStart(false)}
          >
            {startDisabled && showStartTooltip && (
              <div className="tooltip">
                At least 2 players required
                <span className="tooltip-arrow" />
              </div>
            )}
            <button
              className="btn primary"
              disabled={startDisabled}
              onClick={onStart}
            >
              {isHost ? "Start" : "Ready"}
            </button>
          </div>

          {isHost && (
            <button
              className="btn secondary"
              onClick={onInvite}
              disabled={inviteCopied || !roomId}
            >
              {inviteCopied ? "Copied!" : "Invite"}
            </button>
          )}
        </div>
      </div>
    </div>
  </section>
);
