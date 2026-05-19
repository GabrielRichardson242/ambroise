import { useEffect, useRef } from "react";
import SceneCanvas from "../components/SceneCanvas";
import { SHOWCASE_ROOM_ID, SHOWCASE_ARTIST } from "./data/showcaseRoom";
import { useLiDAR } from "../context/LiDARContext";
import { useSupabaseRoom } from "../hooks/useSupabaseRoom";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { createProxyMeshFromScene } from "../utils/proxyGenerator";

export default function ShowcasePage() {
  const { room, posters, loading } = useSupabaseRoom(SHOWCASE_ROOM_ID);
  const { setMeshes } = useLiDAR();
  const hydratedRef = useRef(false);

  useEffect(() => {
    async function loadScan() {
      if (loading || hydratedRef.current) return;
      if (!room?.scan_draco_url) {
        console.warn("Showcase: no scan_draco_url found on room:", room);
        return;
      }

      try {
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath("/draco/");
        dracoLoader.setWorkerLimit(1);

        const loader = new GLTFLoader();
        loader.setDRACOLoader(dracoLoader);

        const gltf = await new Promise((resolve, reject) => {
          loader.load(room.scan_draco_url, resolve, undefined, reject);
        });

        const lidarScene = gltf.scene || gltf.scenes?.[0];
        if (!lidarScene) {
          throw new Error("No scene found in GLB");
        }

        lidarScene.traverse((child) => {
          child.frustumCulled = false;
        });

        let proxyMesh = null;

        try {
          proxyMesh = createProxyMeshFromScene(lidarScene.clone(true), {
            simplifyRatio: 0.05,
            inflateDistance: 0.02,
          });
        } catch (proxyErr) {
          console.warn("Proxy mesh skipped for showcase:", proxyErr);
        }

        setMeshes({ lidarMesh: lidarScene, proxyMesh });
        hydratedRef.current = true;

        console.log("Showcase scan loaded:", room.scan_draco_url);
      } catch (err) {
        console.error("Showcase scan failed to load:", err);
      }
    }

    loadScan();
  }, [loading, room, setMeshes]);

  console.log("SHOWCASE ROOM:", room);
  console.log("SHOWCASE POSTERS:", posters);

  if (loading) {
    return (
      <div className="w-screen h-screen bg-black text-white flex items-center justify-center">
        Loading showcase...
      </div>
    );
  }

  if (!room) {
    return (
      <div className="w-screen h-screen bg-black text-red-400 flex items-center justify-center">
        Showcase room not found
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      <div className="absolute top-4 left-4 z-10 text-white bg-black/40 backdrop-blur-md rounded-xl p-3 max-w-[320px]">
        <h1 className="text-lg font-semibold">{SHOWCASE_ARTIST.name}</h1>

        <p className="text-sm opacity-80 mt-1">{SHOWCASE_ARTIST.bio}</p>

        <a
          href={SHOWCASE_ARTIST.instagram}
          target="_blank"
          rel="noreferrer"
          className="text-sm underline opacity-80 mt-2 inline-block"
        >
          {SHOWCASE_ARTIST.handle}
        </a>

        <p className="text-xs opacity-50 mt-2">
          Room ID: {SHOWCASE_ROOM_ID}
        </p>

        <p className="text-xs opacity-50">
          Posters: {posters?.length ?? 0}
        </p>
      </div>

      <SceneCanvas
        mode="showcase"
        data={{
          room,
          artworks: posters ?? [],
        }}
      />
    </div>
  );
}