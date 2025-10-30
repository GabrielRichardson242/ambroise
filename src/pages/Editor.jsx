import { useRef, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import SceneCanvas from "../components/SceneCanvas";
import RightSidebar from "../components/RightSidebar";
import { v4 as uuidv4 } from "uuid";

export default function Editor() {
  const canvasRef = useRef();
  const lidarRef = useRef();
  const orbitRef = useRef();

  const { roomId: routeRoomId } = useParams();
  const navigate = useNavigate();

  const generatedId = useRef(routeRoomId || uuidv4());
  const roomId = generatedId.current;

  useEffect(() => {
    if (!routeRoomId) navigate(`/edit/${roomId}`, { replace: true });
  }, [routeRoomId, roomId, navigate]);

  const [roomData, setRoomData] = useState({
    id: roomId,
    name: "Untitled Room",
    description: "",
    scan_url: "",
    camera_position: [0, 2, 5],
    camera_target: [0, 0, 0],
    theme: "default",
  });

  const [posterUrls, setPosterUrls] = useState([]);
  const [posterSizes, setPosterSizes] = useState([]);
  const [selectedPosterIndex, setSelectedPosterIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const [sidebarMode, setSidebarMode] = useState("upload");
  const renderMode = sidebarMode === "world" ? "points" : "mesh";

  const handleFileUpload = async (file) => {
  const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
  const maxSizeMB = 15; // safe limit for posters

  if (!allowedTypes.includes(file.type)) {
    alert("Invalid file type. Only JPG, PNG, or PDF allowed.");
    return;
  }

  if (file.size > maxSizeMB * 1024 * 1024) {
    alert(`File too large. Max size is ${maxSizeMB} MB.`);
    return;
  }

  const url = URL.createObjectURL(file);
  setPosterUrls((prev) => [...prev, url]);
  setPosterSizes((prev) => [...prev, "A0"]);
};

  const handleChangePosterSize = (index, newSize) => {
    const updated = [...posterSizes];
    updated[index] = newSize;
    setPosterSizes(updated);
  };

  async function handleSave(isPreview = false) {
    try {
      // 1) pull transforms captured inside SceneCanvas
      const transforms = canvasRef.current?.getPosterTransforms?.() || [];

      // 2) build poster payload using real transforms
      const posterData = posterUrls.map((url, index) => ({
        room_id: roomId,
        file_url: url,
        position: transforms[index]?.position ?? [0, 0, 0],
        rotation: transforms[index]?.rotation ?? [0, 0, 0],
        scale: transforms[index]?.scale ?? [1, 1, 1],
        size: posterSizes[index] ?? "A0",
        title: `Poster ${index + 1}`,
        description: "",
      }));

      // 3) upsert room
      const { error: roomErr } = await supabase.from("rooms").upsert({
        id: roomId,
        name: roomData.name,
        description: roomData.description,
        scan_url: roomData.scan_url,
        camera_position: roomData.camera_position,
        camera_target: roomData.camera_target,
        theme: roomData.theme,
        is_preview: isPreview,
        updated_at: new Date().toISOString(),
      });
      if (roomErr) throw roomErr;

      // 4) replace posters
      const { error: delErr } = await supabase
        .from("posters")
        .delete()
        .eq("room_id", roomId);
      if (delErr) throw delErr;

      if (posterData.length > 0) {
        const { error: postersErr } = await supabase
          .from("posters")
          .insert(posterData);
        if (postersErr) throw postersErr;
      }

      // 5) navigate on publish
      if (isPreview) navigate(`/room/${roomId}`);
    } catch (err) {
      console.error("Save failed:", err.message);
    }
  }

  return (
    <>
      <SceneCanvas
        sceneKey={roomId}
        lidarRef={lidarRef}
        orbitRef={orbitRef}
        canvasRef={canvasRef}
        posterUrls={posterUrls}
        posterSizes={posterSizes}
        selectedPosterIndex={selectedPosterIndex}
        setSelectedPosterIndex={setSelectedPosterIndex}
        isDragging={isDragging}
        setIsDragging={setIsDragging}
        renderMode={renderMode}
        isEditable={true}
      />

      <RightSidebar
        mode={sidebarMode}
        onModeChange={setSidebarMode}
        onFileUpload={handleFileUpload}
        onSelectPoster={setSelectedPosterIndex}
        selectedPosterIndex={selectedPosterIndex}
        posterUrls={posterUrls}
        posterSizes={posterSizes}
        onChangePosterSize={handleChangePosterSize}
        setPosterUrls={setPosterUrls}
        setPosterSizes={setPosterSizes}
      />

      <div className="absolute bottom-4 right-4 flex gap-2 z-50">
        <button onClick={() => handleSave(false)}>Save Draft</button>
        <button onClick={() => handleSave(true)}>Publish Room</button>
      </div>
    </>
  );
}