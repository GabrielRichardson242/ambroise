import { useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "../lib/supabaseClient";
import { useLiDAR } from "../context/LiDARContext";
import { createProxyMeshFromScene } from "../utils/proxyGenerator";
import { uploadRawAndCompressed } from "../lib/storage";

export default function UploadGLBPage() {
  const navigate = useNavigate();
  const { setMeshes } = useLiDAR();

  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState("");
  const [error, setError] = useState("");

  const onPick = async (file) => {
    setError("");
    if (!file) return;
    if (!/\.(glb|gltf)$/i.test(file.name)) {
      setError("File must be .glb or .gltf");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setError("Max 100MB");
      return;
    }

    setBusy(true);
    const roomId = uuidv4();

    try {
      console.log("STEP 1: Starting upload for room", roomId);

      // Step 1: compress to Draco via worker
      setStep("Compressing scan…");
      console.log("STEP 2: Spawning worker…");
      const worker = new Worker(new URL("../workers/dracoWorker.ts", import.meta.url), { type: "module" });
      const rawBuffer = await file.arrayBuffer();

      const compressedBuffer = await new Promise((resolve, reject) => {
        worker.onmessage = (e) => {
          if (e.data?.__error) {
            console.error("Worker error:", e.data.__error);
            reject(new Error(e.data.__error));
          } else {
            console.log(
              "STEP 3: Worker finished compression. Size MB:",
              (e.data.byteLength / 1024 / 1024).toFixed(2)
            );
            resolve(e.data);
          }
          worker.terminate();
        };
        const uint8 = new Uint8Array(rawBuffer);
        worker.postMessage(uint8, [uint8.buffer]);
      });

      // Step 2: upload both versions
      setStep("Uploading raw and compressed files…");
      console.log("STEP 4: Uploading to Supabase…");
      const { rawUrl, dracoUrl } = await uploadRawAndCompressed(roomId, file, compressedBuffer);
      console.log("STEP 5: Upload complete:", { rawUrl, dracoUrl });

      // Step 3: create room record
      setStep("Creating room record…");
      console.log("STEP 6: Writing to Supabase rooms…");
      const { error: roomErr } = await supabase.from("rooms").upsert({
        id: roomId,
        name: "Untitled Room",
        description: "",
        scan_draco_url: dracoUrl,
        raw_url: rawUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      if (roomErr) throw roomErr;
      console.log("STEP 7: Room upsert complete");

      // Step 4: verify Draco decode & load into context
      setStep("Loading scene…");
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath("/draco/");

      const loader = new GLTFLoader();
      loader.setDRACOLoader(dracoLoader);

      console.log("STEP 8: Loading compressed GLB into scene:", dracoUrl);
      const gltf = await new Promise((res, rej) => loader.load(dracoUrl, res, undefined, rej));
      console.log("STEP 9: GLB loaded successfully");

      const lidarScene = gltf.scene || gltf.scenes?.[0];
      if (!lidarScene) throw new Error("Invalid GLB: no scene");

      const lidarClone = lidarScene.clone(true);
      const proxyMesh = createProxyMeshFromScene(lidarClone, { simplifyRatio: 0.05, inflateScale: 1.02 });

      setMeshes({ lidarMesh: lidarClone, proxyMesh });

      console.log("STEP 10: Scene loaded, navigating to editor");
      setStep("Done");
      navigate(`/edit/${roomId}`);
    } catch (e) {
      console.error("Upload/compression failed:", e);
      setError(e.message || "Failed to process GLB");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#1e1e1e",
        display: "grid",
        placeItems: "center",
      }}
    >
      <div style={{ border: "1px solid #aaa", padding: 24, width: 440 }}>
        <h2 style={{ color: "#eee", textAlign: "center", letterSpacing: 1 }}>
          Add a LiDAR Scan
        </h2>
        <div style={{ marginTop: 16 }}>
          <label
            htmlFor="file"
            style={{ ...btn, display: "block", textAlign: "center", cursor: "pointer" }}
          >
            Choose File
          </label>
          <input
            id="file"
            type="file"
            accept=".glb,.gltf"
            style={{ display: "none" }}
            onChange={(e) => onPick(e.target.files?.[0])}
          />
        </div>
        {busy && <p style={{ color: "#bbb", marginTop: 12 }}>{step}</p>}
        {error && <p style={{ color: "#ff6b6b", marginTop: 12 }}>{error}</p>}
      </div>
    </div>
  );
}

const btn = {
  width: 200,
  height: 36,
  border: "1px solid #ccc",
  color: "#eee",
  background: "transparent",
  letterSpacing: 1,
  fontSize: 14,
};