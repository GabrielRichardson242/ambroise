import "./rightSidebar.css";
import FileUploadBox from "./FileUploadBox";
import WorldEditPanel from "./WorldEditPanel";
import {roomState} from "../state/roomState";

export default function RightSidebar({ mode, onModeChange, posters, handleFileUpload }) {

  const handleUploadFallback = async (file) => {
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowed.includes(file.type)) {
      alert("Invalid file type. Use JPG, PNG, or PDF.");
      return;
    }

    const path = `${roomState.data.id}/${crypto.randomUUID()}-${file.name}`;
    const { error } = await window.supabase.storage
      .from("posters")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (error) {
      console.error("Upload failed:", error.message);
      alert("Upload failed.");
      return;
    }

    const { data: urlData } =
      window.supabase.storage.from("posters").getPublicUrl(path);

    roomState.addPoster(urlData.publicUrl);
  };

  return (
    <aside className="sidebar">
      <div className="tabs">
        <button
          className={`tab ${mode === "upload" ? "active" : ""}`}
          onClick={() => onModeChange?.("upload")}
          title="Poster / Upload mode"
        >
          🖼
        </button>

        <button
          className={`tab ${mode === "world" ? "active" : ""}`}
          onClick={() => onModeChange?.("world")}
          title="World Edit mode"
        >
          🌐
        </button>
      </div>

      <div className="content">
        {mode === "upload" && (
          <FileUploadBox
            posters={posters}
            handleFileUpload={handleFileUpload || handleUploadFallback}
          />
        )}
        {mode === "world" && <WorldEditPanel />}
      </div>
    </aside>
  );
}