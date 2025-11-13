import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { useLiDAR } from "../context/LiDARContext";
import { useSupabaseRoom } from "../hooks/useSupabaseRoom";
import { roomState } from "../state/roomState";
import { roomActions } from "../state/roomActions";
import { uploadFile, getPublicUrl } from "../lib/storage.ts";
import SceneCanvas from "../components/SceneCanvas";
import RightSidebar from "../components/RightSidebar";
import { createProxyMeshFromScene } from "../utils/proxyGenerator";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

export default function Editor() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const { room, posters, loading } = useSupabaseRoom(roomId);
  const { setMeshes } = useLiDAR();

  const canvasRef = useRef();
  const hydratedRef = useRef(false);
  const [sidebarMode, setSidebarMode] = useState("upload");

  // --- 0. CLEAR STALE STATE ON EDITOR LOAD ---
  useEffect(() => {
    roomState.reset();
  }, [roomId]);

  // --- 1. HYDRATE SCAN ---
  useEffect(() => {
    async function hydrateScan() {
      if (loading || hydratedRef.current) return;

      const url = room?.scan_draco_url || roomState.data.scan_draco_url;
      if (!url) {
        console.warn("No scan_url available.");
        return;
      }

      try {
        const draco = new DRACOLoader();
        draco.setDecoderPath("/draco/");
        draco.setWorkerLimit(1);

        const loader = new GLTFLoader();
        loader.setDRACOLoader(draco);

        const gltf = await new Promise((resolve, reject) =>
          loader.load(url, resolve, undefined, reject)
        );

        const scene = gltf.scene || gltf.scenes?.[0];
        if (!scene) throw new Error("Invalid GLB: no scene");

        scene.traverse((c) => (c.frustumCulled = false));

        const proxy = createProxyMeshFromScene(scene.clone(true), {
          simplifyRatio: 0.05,
          inflateDistance: 0.02,
        });

        setMeshes({ lidarMesh: scene, proxyMesh: proxy });
        hydratedRef.current = true;
      } catch (err) {
        console.error("Editor hydrate error:", err.message);
      }
    }

    hydrateScan();
  }, [loading, room, setMeshes]);

  // --- 2. HANDLE POSTER UPLOAD ---
  const handleFileUpload = async (file) => {
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    const maxMB = 15;

    if (!allowed.includes(file.type))
      return alert("Only JPG, PNG, or PDF allowed.");
    if (file.size > maxMB * 1024 * 1024)
      return alert(`Max file size is ${maxMB} MB.`);

    try {
      const path = `${roomState.data.id}/${uuidv4()}-${file.name}`;

      await uploadFile("posters", path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

      const url = getPublicUrl("posters", path);
      if (!url) {
        console.error("Received invalid URL from storage");
        return;
      }

      roomState.addPoster(url, "A0");
    } catch (err) {
      console.error("Poster upload failed:", err.message);
      alert("Upload failed.");
    }
  };

  // --- 3. SAVE / PUBLISH ---
  async function handleSave(isPreview = false) {
    try {
      const transforms = canvasRef.current?.getPosterTransforms?.() || [];

      transforms.forEach((t, i) => {
        roomState.updatePoster(i, { transform: t });
      });

      await roomActions.saveRoomToSupabase(isPreview);

      if (isPreview) navigate(`/room/${roomState.data.id}`);
    } catch (err) {
      console.error("Save failed:", err.message);
    }
  }

  if (loading) {
    return <div className="loading">Loading editor…</div>;
  }
  
  return (
    <>
      <SceneCanvas ref={canvasRef} mode="upload" />
      <RightSidebar
        mode={sidebarMode}
        onModeChange={setSidebarMode}
        posters={roomState.posters}
        handleFileUpload={handleFileUpload}
      />

      <div className="absolute bottom-4 right-4 flex gap-2 z-50">
        <button onClick={() => handleSave(false)}>💾 Save Draft</button>
        <button onClick={() => handleSave(true)}>🚀 Publish</button>
      </div>
    </>
  );
}