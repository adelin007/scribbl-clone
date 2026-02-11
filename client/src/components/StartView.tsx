import type { StartViewProps } from "../types/views";

export const StartView = ({
  playerName,
  playerColor,
  createDisabled,
  onNameChange,
  onColorChange,
  onCreate,
}: StartViewProps) => (
  <section className="view start-view">
    <div className="panel start-panel">
      <h1 className="panel-title">Create a Private Room</h1>
      <p className="panel-subtitle">
        Pick a name and color to start. We will copy your invite link.
      </p>

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
          <input
            type="color"
            value={playerColor}
            onChange={(event) => onColorChange(event.target.value)}
          />
        </label>
      </div>

      <button
        className="btn primary"
        onClick={onCreate}
        disabled={createDisabled}
      >
        Create Private Room
      </button>
    </div>
  </section>
);
