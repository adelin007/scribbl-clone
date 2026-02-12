import type { LobbyViewProps } from "../types/views";

export const LobbyView = ({
  room,
  playerName,
  playerColor,
  playerCount,
  maxPlayers,
  isHost,
  drawTime,
  rounds,
  startDisabled,
  showStartTooltip,
  inviteCopied,
  roomId,
  onDrawTimeChange,
  onRoundsChange,
  onHoverStart,
  onStart,
  onInvite,
}: LobbyViewProps) => {
  const lobbyPlayers = room?.players?.length
    ? room.players
    : [
        {
          id: "local",
          name: playerName || "Player",
          color: playerColor || "#4f86c6",
          score: 0,
          guessed: false,
          guessedAt: null,
        },
      ];
  const currentCount = room?.players?.length ?? playerCount;
  const currentMaxPlayers = room?.settings.maxPlayers ?? maxPlayers;

  return (
    <section className="view lobby-view">
      <div className="lobby-header">
        <div>
          <h2>Lobby</h2>
          <p className="muted">
            Waiting for players ({currentCount}/{currentMaxPlayers})
          </p>
        </div>
        <div className="lobby-status">Room Status: Open</div>
      </div>

      <div className="lobby-body">
        <div className="panel players-panel">
          <h3>Players</h3>
          <div className="player-list">
            {lobbyPlayers.map((player) => {
              const isPlayerHost = room?.hostId
                ? player.id === room.hostId
                : isHost;
              return (
                <div className="player-card" key={player.id}>
                  <span
                    className="avatar"
                    style={{ backgroundColor: player.color }}
                  />
                  <div className="player-meta">
                    <span className="player-name">{player.name}</span>
                    <span className="player-role">
                      {isPlayerHost ? "Host" : "Guest"}
                    </span>
                  </div>
                  <span className="player-status ready">In lobby</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="panel lobby-actions">
          <h3>Room Controls</h3>
          {isHost && (
            <div className="settings-grid">
              <label className="field">
                <span>Draw time</span>
                <select
                  value={drawTime}
                  onChange={(event) => onDrawTimeChange(event.target.value)}
                >
                  <option value="">Select</option>
                  <option value="60">60s</option>
                  <option value="80">80s</option>
                  <option value="100">100s</option>
                  <option value="120">120s</option>
                </select>
              </label>

              <label className="field">
                <span>Rounds</span>
                <select
                  value={rounds}
                  onChange={(event) => onRoundsChange(event.target.value)}
                >
                  <option value="">Select</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
              </label>
            </div>
          )}
          <div className="actions-row">
            {isHost ? (
              <>
                <div
                  className="start-button-wrap"
                  onMouseEnter={() => {
                    if (startDisabled) onHoverStart(true);
                  }}
                  onMouseLeave={() => onHoverStart(false)}
                >
                  {startDisabled && showStartTooltip && (
                    <div className="tooltip">
                      Select draw time and rounds
                      <span className="tooltip-arrow" />
                    </div>
                  )}
                  <button
                    className="btn primary"
                    disabled={startDisabled}
                    onClick={onStart}
                  >
                    Start
                  </button>
                </div>

                <button
                  className="btn secondary"
                  onClick={onInvite}
                  disabled={inviteCopied || !roomId}
                >
                  {inviteCopied ? "Copied!" : "Invite"}
                </button>
              </>
            ) : (
              <p className="muted">Wait for the host to start the game</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
