import "./rightSidebar.css";
import FileUploadBox from "./FileUploadBox";
import WorldEditPanel from "./WorldEditPanel";

export default function RightSidebar({
  mode,                  // 'upload' | 'world'
  onModeChange,
  handleFileUpload,
  onSelectPoster,
  selectedPosterIndex,
  posterUrls,
  posterSizes,
  onChangePosterSize,
  setPosterUrls,
  setPosterSizes,
}) {
  return (
    <aside className="sidebar">
      {/* --- Tab buttons --- */}
      <div className="tabs">
        <button
          className={`tab ${mode === "upload" ? "active" : ""}`}
          onClick={() => onModeChange("upload")}
          title="Poster / Upload mode"
        >
          🖼
        </button>
        <button
          className={`tab ${mode === "world" ? "active" : ""}`}
          onClick={() => onModeChange("world")}
          title="World Edit mode"
        >
          🌐
        </button>
      </div>

      {/* --- Content area --- */}
      <div className="content">
        {mode === "upload" && (
          <FileUploadBox
            onFileUpload={handleFileUpload}
            onSelectPoster={onSelectPoster}
            selectedPosterIndex={selectedPosterIndex}
            posterUrls={posterUrls}
            posterSizes={posterSizes}
            onChangePosterSize={onChangePosterSize}
            setPosterUrls={setPosterUrls}
            setPosterSizes={setPosterSizes}
          />
        )}

        {mode === "world" && <WorldEditPanel />}
      </div>
    </aside>
  );
}