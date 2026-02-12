import type { StartViewProps } from "../types/views";

export const StartView = ({
  playerName,
  playerColor,
  createDisabled,
  isGuest,
  drawTime,
  rounds,
  title,
  subtitle,
  actionLabel,
  onNameChange,
  onColorChange,
  onDrawTimeChange,
  onRoundsChange,
  onCreate,
}: StartViewProps) => {
  const palette = [
    "#000000",
    "#ff5b5b",
    "#ffd166",
    "#06d6a0",
    "#118ab2",
    "#7b5cff",
  ];

  return (
    <section className="view start-view">
      <div className="panel start-panel">
        <h1 className="panel-title">{title}</h1>
        <p className="panel-subtitle">{subtitle}</p>

        <div className="form-grid">
          <label className="field">
            <span>Name</span>
            <input
              type="text"
              placeholder="Your name"
              value={playerName}
              onChange={(event) => onNameChange(event.target.value)}
            />
          </label>

          <label className="field">
            <span>Color</span>
            <div className="color-palette">
              {palette.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`color ${playerColor === color ? "selected" : ""}`}
                  style={{ backgroundColor: color }}
                  onClick={() => onColorChange(color)}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
            {!playerColor && (
              <span className="field-error">Please select a color.</span>
            )}
          </label>

          {!isGuest && (
            <>
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
            </>
          )}
        </div>

        <button
          className="btn primary"
          onClick={onCreate}
          disabled={createDisabled}
        >
          {actionLabel}
        </button>
        {isGuest && (
          <p className="muted" style={{ marginTop: "12px" }}>
            You can toggle Ready once you enter the lobby.
          </p>
        )}
      </div>
    </section>
  );
};
