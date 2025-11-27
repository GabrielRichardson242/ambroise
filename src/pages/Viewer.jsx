import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useLiDAR } from "../context/LiDARContext";
import { useSupabaseRoom } from "../hooks/useSupabaseRoom";
import SceneCanvas from "../components/SceneCanvas";
import { createProxyMeshFromScene } from "../utils/proxyGenerator";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { supabase } from "../lib/supabaseClient";

export default function Viewer() {
  const { roomId } = useParams();
  const { room, posters, loading } = useSupabaseRoom(roomId);
  const { setMeshes, meshReady } = useLiDAR();

  const hydratedRef = useRef(false);
  const screenshotDoneRef = useRef(false);
  const canvasRef = useRef(null);

  // ------------------ LOAD SCAN ------------------
  useEffect(() => {
    async function hydrateScan() {
      if (loading || hydratedRef.current) return;
      if (!room?.scan_draco_url) return;

      try {
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath("/draco/");
        dracoLoader.setWorkerLimit(1);

        const loader = new GLTFLoader();
        loader.setDRACOLoader(dracoLoader);

        const gltf = await new Promise((resolve, reject) =>
          loader.load(room.scan_draco_url, resolve, undefined, reject)
        );

        const lidarScene = gltf.scene || gltf.scenes?.[0];
        lidarScene.traverse((c) => (c.frustumCulled = false));

        const proxyMesh = createProxyMeshFromScene(lidarScene.clone(true), {
          simplifyRatio: 0.05,
          inflateDistance: 0.02,
        });

        setMeshes({ lidarMesh: lidarScene, proxyMesh });
        hydratedRef.current = true;
      } catch (err) {
        console.error("Viewer load error:", err);
      }
    }

    hydrateScan();
  }, [room, loading, setMeshes]);


  // ------------------ TAKE & SAVE SCREENSHOT ------------------
  useEffect(() => {
    if (!meshReady) return;
    if (!posters.length) return;
    if (screenshotDoneRef.current) return;

    const timeout = setTimeout(async () => {
      const canvas = canvasRef.current?.getCanvas?.();
      if (!canvas) return;

      try {
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

        // upload to Supabase bucket
        const fileName = `thumb_${roomId}.jpg`;
        const path = `${roomId}/${fileName}`;
        const file = await (await fetch(dataUrl)).blob();

        const { error: uploadErr } = await supabase.storage
          .from("room_thumbnails")
          .upload(path, file, { upsert: true });

        if (uploadErr) {
          console.error("Thumbnail upload failed:", uploadErr);
          return;
        }

        const { data: urlData } = supabase.storage
          .from("room_thumbnails")
          .getPublicUrl(path);

        await supabase
          .from("rooms")
          .update({ thumbnail_url: urlData.publicUrl })
          .eq("id", roomId);

        screenshotDoneRef.current = true;
        console.log("Thumbnail saved:", urlData.publicUrl);
      } catch (err) {
        console.error("Screenshot error:", err);
      }
    }, 800); // allow scene to settle

    return () => clearTimeout(timeout);
  }, [meshReady, posters, roomId]);


  // ------------------ UI STATES ------------------
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


  // ------------------ RENDER ------------------
  return (
    <div className="relative w-screen h-screen bg-black">
      <SceneCanvas ref={canvasRef} mode="preview" />

      <div className="absolute top-4 left-4 bg-white/80 backdrop-blur p-3 rounded-lg text-black shadow-lg">
        <h1 className="text-xl font-semibold">{room.name || "Untitled Room"}</h1>
        {room.description && (
          <p className="text-sm opacity-70 mt-1">{room.description}</p>
        )}
      </div>
    </div>
  );
}