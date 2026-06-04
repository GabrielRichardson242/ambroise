export default function ArtworkCloseButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: "fixed",
        top: "2vh",
        right: "3vw",
        zIndex: 9999999,
        color: "white",
        background: "transparent",
        border: "none",
        padding: 0,
        margin: 0,
        fontSize: "32px",
        lineHeight: 1,
        pointerEvents: "auto",
        cursor: "pointer",
      }}
      aria-label="Close artwork"
    >
      ×
    </button>
  );
}