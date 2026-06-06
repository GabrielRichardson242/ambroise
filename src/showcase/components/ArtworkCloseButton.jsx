export default function ArtworkCloseButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close artwork"
      style={{
        position: "fixed",
        top: "18px",
        right: "18px",
        zIndex: 99999999,

        width: "48px",
        height: "48px",

        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        background: "Transparent",
        border: "0.5px solid #AFAFAF",

        color: "#ffffff",
        fontSize: "34px",
        lineHeight: 1,

        padding: 0,
        margin: 0,

        cursor: "pointer",
        pointerEvents: "auto",
      }}
    >
      ×
    </button>
  );
}