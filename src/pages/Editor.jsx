import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { useLiDAR } from "../context/LiDARContext";
import { useSupabaseRoom } from "../hooks/useSupabaseRoom";
import { supabase } from "../lib/supabaseClient";
import { roomState } from "../state/roomState";
import { roomActions } from "../state/roomActions";
import { uploadFile, getPublicUrl } from "../lib/storage";
import SceneCanvas from "../components/SceneCanvas";
import RightSidebar from "../components/RightSidebar";
import { createProxyMeshFromScene } from "../utils/proxyGenerator";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { captureCanvas } from "../utils/screenshot";
import { uploadThumbnail } from "../utils/uploadDataURLToSupabase";

export default function Editor() {
  const navigate = useNavigate();
  const { roomId } = useParams();

  useEffect(() => {
    supabase.auth.getSession().then(res => {
      console.log("AUTH SESSION:", res);
    });
  }, []);

  const { room, posters, loading } = useSupabaseRoom(roomId);
  const { setMeshes } = useLiDAR();

  const canvasRef = useRef(null);
  const hydratedRef = useRef(false);

  const [sidebarMode, setSidebarMode] = useState("upload");

  // ------------------------------------------------------------
  // 1. HYDRATE LIDAR SCAN
  // ------------------------------------------------------------
  useEffect(() => {
    async function hydrateScan() {
      if (loading || hydratedRef.current) return;

      const dracoUrl = roomState.data.scan_draco_url;
      if (!dracoUrl) return;

      try {
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath("/draco/");
        dracoLoader.setWorkerLimit(1);

        const loader = new GLTFLoader();
        loader.setDRACOLoader(dracoLoader);

        const gltf = await new Promise((resolve, reject) =>
          loader.load(dracoUrl, resolve, undefined, reject)
        );

        const lidarScene = gltf.scene || gltf.scenes?.[0];
        if (lidarScene) {
          lidarScene.traverse((c) => (c.frustumCulled = false));

          const proxyMesh = createProxyMeshFromScene(
            lidarScene.clone(true),
            { simplifyRatio: 0.05, inflateDistance: 0.02 }
          );

          setMeshes({ lidarMesh: lidarScene, proxyMesh });
          hydratedRef.current = true;
        }
      } catch (err) {
        console.error("Scan hydration failed:", err);
      }
    }

    hydrateScan();
  }, [loading, setMeshes]);

  // ------------------------------------------------------------
  // 2. POSTER FILE UPLOAD
  // ------------------------------------------------------------
  const handleFileUpload = async (file) => {
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    const maxMB = 15;

    if (!allowed.includes(file.type))
      return alert("Only JPG, PNG, or PDF allowed.");

    if (file.size > maxMB * 1024 * 1024)
      return alert(`Max file size is ${maxMB} MB.`);

    try {
      const path = `${roomId}/${uuidv4()}-${file.name}`;

      await uploadFile("posters", path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "image/png",
      });

      const publicUrl = getPublicUrl("posters", path);
      roomState.addPoster(publicUrl, "A0");
    } catch (err) {
      console.error("Poster upload failed:", err);
    }
  };

  // ------------------------------------------------------------
  // 3. SAVE AND PUBLISH (WITH THUMBNAIL)
  // ------------------------------------------------------------
  async function handleSave(isPreview = false) {
  console.log("[handleSave] triggered. isPreview:", isPreview);

  try {
    const transforms = canvasRef.current?.getPosterTransforms?.() || [];
    transforms.forEach((t, i) => roomState.updatePoster(i, { transform: t }));

    const renderer = canvasRef.current?.getRenderer?.();
    console.log("[handleSave] renderer:", renderer);

    if (!renderer) {
      console.error("[handleSave] Renderer missing.");
      throw new Error("Renderer not found");
    }

    const dataURL = captureCanvas(renderer);
    console.log("[handleSave] dataURL length:", dataURL?.length);

    if (!dataURL) {
      console.error("[handleSave] No dataURL produced.");
    }

    console.log("[handleSave] calling uploadThumbnail...");
    const thumbnailURL = await uploadThumbnail(dataURL, roomId);

    console.log("[handleSave] thumbnailURL:", thumbnailURL);

    await roomActions.saveRoomToSupabase(isPreview, {
      screenshot_url: thumbnailURL,
    });

    console.log("[handleSave] saveRoomToSupabase completed.");

    if (isPreview) navigate(`/room/${roomId}`);

  } catch (err) {
    console.error("Save failed:", err);
  }
}
  if (loading) {
    return (
      <div className="loading">Loading editor...</div>
    );
  }

  // ------------------------------------------------------------
  // 4. RENDER
  // ------------------------------------------------------------
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
        <button onClick={() => handleSave(false)}>Save Draft</button>
        <button onClick={() => handleSave(true)}>Publish</button>
      </div>
    </>
  );
}