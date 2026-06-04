export default function WorkInfoModule({
  title,
  usedFor = [],
  medium = [],
  instagram = [],
  projects = [],
  description,
}) {
  return (
    <section
      style={{
        width: "100%",
        maxWidth: "100vw",
        boxSizing: "border-box",
        overflowX: "hidden",
        background: "#202020",
        color: "#ffffff",
        borderTop: "0.5px solid #AFAFAF",
        padding: "clamp(16px, 4vw, 28px)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) auto",
          gap: "clamp(12px, 3vw, 24px)",
          alignItems: "start",
          marginBottom: "clamp(18px, 3vw, 28px)",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <h1
          className="font-disket uppercase"
          style={{
            fontSize: "clamp(18px, 4.4vw, 30px)",
            lineHeight: 0.95,
            letterSpacing: "0.03em",
            margin: 0,
            minWidth: 0,
            wordBreak: "break-word",
            transform: "translateY(4px)",
          }}
        >
          {title}
        </h1>

        <button
          type="button"
          className="font-disket uppercase"
          style={{
            minWidth: "clamp(90px, 26vw, 180px)",
            height: "clamp(24px, 4vw, 32px)",
            border: "0.5px solid #AFAFAF",
            background:
              "linear-gradient(90deg, rgba(160,180,160,0.12), rgba(255,255,255,0.03))",
            color: "#ffffff",
            fontSize: "clamp(12px, 2.6vw, 18px)",
            letterSpacing: "0.06em",
            borderRadius: 0,
            boxSizing: "border-box",
            padding: "0 8px",
          }}
        >
          ADD +
        </button>
      </div>

      <div
        className="font-newrail"
        style={{
            fontWeight: 400,
            fontSize: "clamp(12px, 2.4vw, 18px)",
          display: "grid",
          gridTemplateColumns: "88px 1fr",
          columnGap: "2px",
          rowGap: "4px",
          marginBottom: "clamp(34px, 7vw, 64px)",
          width: "100%",
          boxSizing: "border-box",
          overflowX: "hidden",
        }}
      >
        <MetaRow label="Used for" value={usedFor.join("  /  ")} />
        <MetaRow label="Medium" value={medium.join("  /  ")} />

        {projects.length > 0 && (
          <MetaRow label="Projects" value={projects.join("  /  ")} underline />
        )}
        {instagram.length > 0 && (
          <MetaRow label="Instagram" value={instagram.join("  /  ")} underline />
        )}
      </div>

      <div
        style={{
          width: "100%",
          boxSizing: "border-box",
          overflowX: "hidden",
        }}
      >
        <div
          style={{
            color: "#AFAFAF",
            fontSize: "clamp(12px, 2.4vw, 18px)",
            fontWeight: 200,
            lineHeight: 1,
            marginBottom: "8px",
          }}
        >
          Description
        </div>

        <div
          style={{
            width: "100%",
            boxSizing: "border-box",
            border: "0.5px solid #AFAFAF",
            padding: "clamp(14px, 3vw, 22px)",
            overflowX: "hidden",
          }}
        >
          <p
            style={{
              margin: 0,
              whiteSpace: "pre-line",
              fontSize: "clamp(12px, 2.4vw, 18px)",
              lineHeight: 1.18,
              fontWeight: 450,
              overflowWrap: "break-word",
              wordBreak: "normal",
            }}
          >
            {description}
          </p>
        </div>
      </div>
    </section>
  );
}

function MetaRow({ label, value, underline = false }) {
  return (
    <>
      <div
        className="font-newrail"
        style={{
          color: "#AFAFAF",
          fontSize: "clamp(12px, 2.4vw, 18px)",
          lineHeight: 1.1,
          minWidth: 0,
        }}
      >
        {label}
      </div>

      <div
        className="font-newrail"
        style={{
          color: "#ffffff",
          fontSize: "clamp(12px, 2.4vw, 18px)",
          lineHeight: 1.1,
          fontWeight: 450,
          textDecoration: underline ? "underline" : "none",
          textUnderlineOffset: "3px",
          minWidth: 0,
          overflowWrap: "break-word",
        }}
      >
        {value}
      </div>
    </>
  );
}