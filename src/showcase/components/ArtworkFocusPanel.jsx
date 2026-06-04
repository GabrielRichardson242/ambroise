import WorkInfoModule from "../modules/WorkInfoModule";
import ProcessStripModule from "../modules/ProcessStripModule";
import PlaylistModule from "../modules/PlaylistModule";
import VideoReferenceModule from "../modules/VideoReferenceModule";

export default function ArtworkFocusPanel({ artwork }) {
  if (!artwork) return null;

  const modules = artwork.modules ?? [];

  return (
    <div
      style={{
        width: "100vw",
        background: "#202020",
        color: "white",
        overflowX: "hidden",
        boxSizing: "border-box",
        borderTop: "0.5px solid #AFAFAF",
      }}
    >
      {modules.map((module, index) => {
        if (module.type === "workInfo") {
          return <WorkInfoModule key={index} {...module} />;
        }

        if (module.type === "processStrip") {
          return <ProcessStripModule key={index} {...module} />;
        }

        if (module.type === "playlist") {
          return <PlaylistModule key={index} {...module} />;
        }

        if (module.type === "videoReference") {
          return <VideoReferenceModule key={index} {...module} />;
        }

        return null;
      })}
    </div>
  );
}