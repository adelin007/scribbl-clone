import type { StartViewProps } from "../types/views";

export const StartView = ({
  playerName,
  playerColor,
  createDisabled,
  isGuest,
  title,
  subtitle,
  actionLabel,
  onNameChange,
  onColorChange,
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
