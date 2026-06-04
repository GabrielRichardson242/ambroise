export default function VideoReferenceModule({
  title,
  image,
  url,
  duration,
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
        padding: "0 clamp(16px, 4vw, 28px) clamp(28px, 6vw, 44px)",
      }}
    >
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        style={{
          display: "block",
          color: "inherit",
          textDecoration: "none",
          border: "0.5px solid #AFAFAF",
          background: "#151515",
        }}
      >
        <div style={{ position: "relative" }}>
          <img
            src={image}
            alt=""
            loading="lazy"
            decoding="async"
            style={{
              display: "block",
              width: "100%",
              height: "auto",
            }}
          />

          {duration && (
            <div
              className="font-disket"
              style={{
                position: "absolute",
                right: "10px",
                bottom: "10px",
                background: "rgba(0,0,0,0.72)",
                color: "#ffffff",
                fontSize: "14px",
                padding: "5px 8px",
              }}
            >
              ▶ {duration}
            </div>
          )}
        </div>

        <div
          className="font-newrail"
          style={{
            borderTop: "0.5px solid #AFAFAF",
            padding: "12px 14px",
            fontSize: "clamp(14px, 3vw, 22px)",
            fontWeight: 650,
            lineHeight: 1.1,
          }}
        >
          {title}
        </div>
      </a>
    </section>
  );
}