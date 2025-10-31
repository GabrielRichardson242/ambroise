import { useRef, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import SceneCanvas from "../components/SceneCanvas";
import { useLiDAR } from "../context/LiDARContext";

export default function Viewer() {
  const canvasRef = useRef();
  const lidarRef = useRef();
  const orbitRef = useRef();
  const { roomId } = useParams();
  const { setMeshes } = useLiDAR();

  const [roomData, setRoomData] = useState(null);
  const [posters, setPosters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAndLoad() {
      try {
        setLoading(true);
        setError(null);

        const { data: room, error: roomErr } = await supabase
          .from("rooms")
          .select("*")
          .eq("id", roomId)
          .single();
        if (roomErr) throw roomErr;
        setRoomData(room);

        const { data: posterRows, error: posterErr } = await supabase
          .from("posters")
          .select("*")
          .eq("room_id", roomId)
          .order("created_at", { ascending: true });
        if (posterErr) throw posterErr;
        setPosters(posterRows || []);

        if (room.scan_draco_url) {
          console.log("Loading scan from:", room.scan_draco_url);

          const dracoLoader = new DRACOLoader();
          dracoLoader.setDecoderPath("/draco/");
          const loader = new GLTFLoader();
          loader.setDRACOLoader(dracoLoader);

          const gltf = await new Promise((resolve, reject) =>
            loader.load(room.scan_draco_url, resolve, undefined, reject)
          );

          const lidarScene = gltf.scene || gltf.scenes?.[0];
          if (!lidarScene) throw new Error("Invalid GLB: no scene");

          lidarScene.traverse((c) => (c.frustumCulled = false));
          const proxyMesh = lidarScene.clone(true);
          setMeshes({ lidarMesh: lidarScene, proxyMesh });

          console.log("✅ Scan loaded successfully");
        } else {
          console.warn("No scan_draco_url found for this room.");
        }
      } catch (err) {
        console.error("❌ Viewer load error:", err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAndLoad();
  }, [roomId, setMeshes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400">
        Loading LiDAR scan...
      </div>
    );
  }

  if (error || !roomData) {
    return (
      <div className="flex items-center justify-center h-screen text-red-400">
        {error ? `Error: ${error}` : "Room data not found"}
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
        isEditable={false}
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