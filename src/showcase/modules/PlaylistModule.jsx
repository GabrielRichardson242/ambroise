import { useState } from "react";

export default function PlaylistModule({ playlists = [] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!playlists.length) return null;

  const active = playlists[activeIndex];

  const goToPlaylist = () => {
    if (!active.spotify) return;
    window.open(active.spotify, "_blank", "noopener,noreferrer");
  };

  const wrap = (index) => {
    if (index < 0) return playlists.length - 1;
    if (index >= playlists.length) return 0;
    return index;
  };

  const previousIndex = wrap(activeIndex - 1);
  const nextIndex = wrap(activeIndex + 1);

  return (
    <section
      style={{
        width: "100vw",
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
        boxSizing: "border-box",
        overflow: "hidden",
        background: "#202020",
        color: "#ffffff",
        padding: "0 0 12px",
      }}
    >
      <div
        style={{
          borderTop: "0.5px solid #AFAFAF",
          borderBottom: "0.5px solid #AFAFAF",
          position: "relative",
          height: "290px",
          overflow: "hidden",
          background: "#151515",
        }}
      >
        <div
          style={{
            position: "relative",
            zIndex: 2,
            padding: "12px 14px 18px",
            boxSizing: "border-box",
            width: "68%",
            minHeight: "120px",
          }}
        >
          <h2
            className="font-newrail"
            style={{
              margin: 0,
              color: "#ffffff",
              fontSize: "14px",
              lineHeight: 1,
              fontWeight: 500,
              maxWidth: "210px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {active.title}
          </h2>

          <div
            className="font-newrail"
            style={{
              color: "#AFAFAF",
              fontSize: "12px",
              lineHeight: 1.08,
              fontWeight: 300,
              marginTop: "3px",
              maxWidth: "130px",
            }}
          >
            {active.subtitle}
          </div>

          <div
            className="font-newrail"
            style={{
              color: "#ffffff",
              fontSize: "12px",
              lineHeight: 1.12,
              fontWeight: 300,
              marginTop: "12px",
              maxWidth: "200px",
            }}
          >
            “{active.quote}”
          </div>

          <button
            type="button"
            onClick={goToPlaylist}
            className="font-disket uppercase"
            style={{
              position: "absolute",
              top: "74px",
              left: "22px",
              width: "130px",
              height: "30px",
              border: "0.5px solid #AFAFAF",
              background:
                "linear-gradient(90deg, rgba(160,180,160,0.12), rgba(255,255,255,0.03))",
              color: "#ffffff",
              fontSize: "10px",
              lineHeight: 1,
              letterSpacing: "0.06em",
              borderRadius: 0,
              boxSizing: "border-box",
              cursor: "pointer",
            }}
          >
            GO TO SPOTIFY
          </button>
        </div>

        <div
          style={{
            height: "0.5px",
            width: "100%",
            background: "#AFAFAF",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 2,
            width: "100%",
          }}
        >
          {active.tracks.map((track, index) => (
            <TrackRow key={`${track.title}-${index}`} track={track} index={index} />
          ))}
        </div>

        <PlaylistWheel
          playlists={playlists}
          activeIndex={activeIndex}
          previousIndex={previousIndex}
          nextIndex={nextIndex}
          setActiveIndex={setActiveIndex}
        />
      </div>
    </section>
  );
}

function TrackRow({ track, index }) {
  const isAlt = index % 2 === 0;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) minmax(90px, 0.8fr)",
        columnGap: "8px",
        alignItems: "center",
        height: "34px",
        padding: "0 10px 0 18px",
        background: isAlt ? "#202020" : "#151515",
        boxSizing: "border-box",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          className="font-newrail"
          style={{
            color: "#ffffff",
            fontSize: "11.6px",
            lineHeight: 1,
            fontWeight: 650,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {track.title}
        </div>

        <div
          className="font-newrail"
          style={{
            color: "#AFAFAF",
            fontSize: "10px",
            lineHeight: 1.00,
            fontWeight: 300,
            marginTop: "1px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {track.artist}
        </div>
      </div>

      {/* <div
        className="font-newrail"
        style={{
          color: "#AFAFAF",
          fontSize: "10px",
          lineHeight: 1,
          fontWeight: 300,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {track.album}
      </div> */}
    </div>
  );
}

function PlaylistWheel({
  playlists,
  activeIndex,
  previousIndex,
  nextIndex,
  setActiveIndex,
}) {
  const active = playlists[activeIndex];
  const previous = playlists[previousIndex];
  const next = playlists[nextIndex];

  return (
    <div
      style={{
        position: "absolute",
        right: "-165px",
        top: "145px",
        transform: "translateY(-50%)",
        width: "280px",
        height: "280px",
        zIndex: 3,
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          border: "0.8px solid #AFAFAF",
          borderRadius: "50%",
          background: "#101010",
        }}
      />

      <CoverButton
        playlist={previous}
        onClick={() => setActiveIndex(previousIndex)}
        size="72px"
        style={{
          position: "absolute",
          top: "22px",
          left: "50px",
        }}
      />

      <CoverButton
        playlist={active}
        onClick={() => setActiveIndex(activeIndex)}
        size="92px"
        style={{
          position: "absolute",
          top: "50%",
          left: "8px",
          transform: "translateY(-50%)",
        }}
        active
      />

      <CoverButton
        playlist={next}
        onClick={() => setActiveIndex(nextIndex)}
        size="72px"
        style={{
          position: "absolute",
          bottom: "22px",
          left: "50px",
        }}
      />
    </div>
  );
}

function CoverButton({ playlist, onClick, size, style, active = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={playlist.title}
      style={{
        ...style,
        width: size,
        height: size,
        borderRadius: "50%",
        border: "0.8px solid #AFAFAF",
        padding: 0,
        margin: 0,
        overflow: "hidden",
        background: "#101010",
        cursor: "pointer",
        boxSizing: "border-box",
        opacity: active ? 1 : 0.95,
      }}
    >
      <img
        src={playlist.cover}
        alt=""
        loading="lazy"
        decoding="async"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
    </button>
  );
}