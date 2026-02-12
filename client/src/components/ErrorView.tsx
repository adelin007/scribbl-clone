interface ErrorViewProps {
  message: string;
  onBack: () => void;
}

export const ErrorView = ({ message, onBack }: ErrorViewProps) => {
  return (
    <div
      style={{
        padding: "2rem",
        backgroundColor: "#fee",
        border: "2px solid #fcc",
        borderRadius: "0.5rem",
        color: "#c00",
        textAlign: "center",
        maxWidth: "500px",
        margin: "2rem auto",
        fontSize: "1.1rem",
      }}
    >
      <h2 style={{ marginTop: 0, color: "#c00" }}>Error</h2>
      <p>{message}</p>
      <button
        style={{
          marginTop: "1rem",
          padding: "0.75rem 1.5rem",
          backgroundColor: "#c00",
          color: "white",
          border: "none",
          borderRadius: "0.25rem",
          cursor: "pointer",
          fontSize: "1rem",
        }}
        onClick={onBack}
      >
        Back to Start
      </button>
    </div>
  );
};
