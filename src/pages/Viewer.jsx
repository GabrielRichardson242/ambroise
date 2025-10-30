import { useRef, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import SceneCanvas from "../components/SceneCanvas";

export default function Viewer() {
  const canvasRef = useRef();
  const lidarRef = useRef();
  const orbitRef = useRef();
  const { roomId } = useParams();

  const [roomData, setRoomData] = useState(null);
  const [posters, setPosters] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: room, error: roomErr } = await supabase
          .from("rooms")
          .select("*")
          .eq("id", roomId)
          .single();
        if (roomErr) throw roomErr;

        const { data: posterRows, error: posterErr } = await supabase
          .from("posters")
          .select("*")
          .eq("room_id", roomId)
          .order("created_at", { ascending: true });
        if (posterErr) throw posterErr;

        setRoomData(room);
        setPosters(posterRows || []);
      } catch (err) {
        console.error("Failed to fetch room:", err.message);
      }
    }
    fetchData();
  }, [roomId]);

  if (!roomData) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400">
        Loading room...
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen bg-black">
      <SceneCanvas
        sceneKey={roomId}
        lidarRef={lidarRef}
        orbitRef={orbitRef}
        canvasRef={canvasRef}
        posterUrls={posters.map((p) => p.file_url)}
        posterSizes={posters.map((p) => p.size || "A0")}
        posterTransforms={posters.map((p) => ({
          position: p.position,
          rotation: p.rotation,
          scale: p.scale,
        }))}
        selectedPosterIndex={null}
        setSelectedPosterIndex={() => {}}
        isDragging={false}
        setIsDragging={() => {}}
        renderMode="mesh"
        isEditable={false} // view-only
      />

      <div className="absolute top-4 left-4 bg-white/80 backdrop-blur p-3 rounded-lg text-black shadow-lg">
        <h1 className="text-xl font-semibold">{roomData.name}</h1>
        {roomData.description && (
          <p className="text-sm opacity-70 mt-1">{roomData.description}</p>
        )}
      </div>
    </div>
  );
}