export default function ProcessStripModule({ title = "Process", items = [] }) {
  return (
    <section
      style={{
        width: "100%",
        maxWidth: "100vw",
        boxSizing: "border-box",
        overflowX: "hidden",
        background: "#202020",
        color: "#ffffff",
        padding: "0 clamp(16px, 4vw, 28px) clamp(22px, 5vw, 36px)",
      }}
    >
      <h2
        className="font-newrail"
        style={{
          color: "#AFAFAF",
          fontSize: "clamp(12px, 2.4vw, 18px)",
          fontWeight: 200,
          lineHeight: 1,
          margin: "0 0 10px",
        }}
      >
        {title}
      </h2>

      <div
        style={{
          border: "0.5px solid #AFAFAF",
          overflowX: "auto",
          overflowY: "hidden",
          WebkitOverflowScrolling: "touch",
          scrollSnapType: "x proximity",
          boxSizing: "border-box",
          padding: "0 0 12px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            width: "max-content",
          }}
        >
          {items.map((item, index) => (
            <ProcessCard key={index} {...item} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProcessCard({
  image,
  title,
  text,
  orientation = "portrait",
}) {
  const isLandscape = orientation === "landscape";

  return (
    <article
      style={{
        width: isLandscape ? "358px" : "300px",
        height: "470px",
        flex: "0 0 auto",
        borderRight: "0.5px solid #AFAFAF",
        boxSizing: "border-box",
        scrollSnapAlign: "start",
        display: "grid",
        gridTemplateRows: "330px 32px 1fr",
        background: "#201F1F",
      }}
    >
      <div
        style={{
          boxSizing: "border-box",
          padding: "14px 27px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <img
          src={image}
          alt=""
          loading="lazy"
          decoding="async"
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            width: "auto",
            height: "auto",
            objectFit: "contain",
            display: "block",
            boxShadow: "0 0 18px rgba(0,0,0,0.45)",
          }}
        />
      </div>

      <div
        className="font-newrail"
        style={{
          borderTop: "0.5px solid #AFAFAF",
          borderBottom: "0.5px solid #AFAFAF",
          padding: "7px 12px 0",
          fontSize: "clamp(12px, 2.2vw, 15px)",
          lineHeight: 1,
          fontWeight: 500,
          color: "#ffffff",
          boxSizing: "border-box",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {title}
      </div>

      <p
        className="font-newrail"
        style={{
          margin: 0,
          padding: "14px 12px",
          fontSize: "clamp(11px, 2vw, 14px)",
          lineHeight: 1.18,
          fontWeight: 300,
          color: "#ffffff",
          boxSizing: "border-box",
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 4,
          WebkitBoxOrient: "vertical",
        }}
      >
        {text}
      </p>
    </article>
  );
}