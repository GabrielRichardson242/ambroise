import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useLiDAR } from "../context/LiDARContext";
import { useSupabaseRoom } from "../hooks/useSupabaseRoom";
import SceneCanvas from "../components/SceneCanvas";
import { createProxyMeshFromScene } from "../utils/proxyGenerator";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

/**
 * Viewer.jsx — Read-only preview for published Ambroise rooms.
 * Hydrates the same Supabase room data as Editor but locks all interactions.
 */

export default function Viewer() {
  const { roomId } = useParams();
  const { room, posters, loading } = useSupabaseRoom(roomId);
  const { setMeshes } = useLiDAR();

  const hydratedRef = useRef(false);

  // ---------- 1. HYDRATE LIDAR SCAN ----------
  useEffect(() => {
    async function hydrateScan() {
      if (loading || hydratedRef.current) return;
      if (!room?.scan_draco_url) {
        console.warn("No scan_draco_url found for this room.");
        return;
      }

      try {
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
        const proxyMesh = createProxyMeshFromScene(lidarScene.clone(true), {
          simplifyRatio: 0.05,
          inflateDistance: 0.02,
        });

        setMeshes({ lidarMesh: lidarScene, proxyMesh });
        hydratedRef.current = true;
        console.log("✅ Scan loaded successfully");
      } catch (err) {
        console.error("❌ Viewer load error:", err.message);
      }
    }

    hydrateScan();
  }, [room, loading, setMeshes]);

  // ---------- 2. RENDER STATES ----------
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400">
        Loading LiDAR scan...
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex items-center justify-center h-screen text-red-400">
        Room not found
      </div>
    );
  }

  // ---------- 3. RENDER LOCKED SCENE ----------
  return (
    <div className="relative w-screen h-screen bg-black">
      <SceneCanvas mode="preview" />

      <div className="absolute top-4 left-4 bg-white/80 backdrop-blur p-3 rounded-lg text-black shadow-lg">
        <h1 className="text-xl font-semibold">{room.name || "Untitled Room"}</h1>
        {room.description && (
          <p className="text-sm opacity-70 mt-1">{room.description}</p>
        )}
      </div>
    </div>
  );
}