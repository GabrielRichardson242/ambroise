import { useState, useEffect } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "../lib/supabaseClient";
import { useLiDAR } from "../context/LiDARContext";
import { createProxyMeshFromScene } from "../utils/proxyGenerator";
import { uploadRawAndCompressed } from "../lib/storage";
import { useAuth } from "../context/AuthContext";

export default function UploadGLBPage() {
  const navigate = useNavigate();
  const { setMeshes } = useLiDAR();
  const { user } = useAuth();

  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState("");
  const [error, setError] = useState("");
  const [rooms, setRooms] = useState([]);

  // 🧭 Load user's existing scans
  useEffect(() => {
    const fetchRooms = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      if (error) console.error("Failed to load rooms:", error.message);
      else setRooms(data || []);
    };
    fetchRooms();
  }, [user]);

  // 🧱 Create new scan logic
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

    if (!user) {
      setError("Please sign in to upload scans.");
      return;
    }

    setBusy(true);
    const roomId = uuidv4();

    try {
      console.log("STEP 1: Starting upload for room", roomId);

      setStep("Compressing scan…");
      const worker = new Worker(new URL("../workers/dracoWorker.ts", import.meta.url), { type: "module" });
      const rawBuffer = await file.arrayBuffer();

      const compressedBuffer = await new Promise((resolve, reject) => {
        worker.onmessage = (e) => {
          if (e.data?.__error) reject(new Error(e.data.__error));
          else resolve(e.data);
          worker.terminate();
        };
        const uint8 = new Uint8Array(rawBuffer);
        worker.postMessage(uint8, [uint8.buffer]);
      });

      setStep("Uploading raw and compressed files…");
      const { rawUrl, dracoUrl } = await uploadRawAndCompressed(roomId, file, compressedBuffer);

      setStep("Creating room record…");
      const { error: roomErr } = await supabase.from("rooms").upsert({
        id: roomId,
        user_id: user.id,
        name: "Untitled Room",
        description: "",
        scan_draco_url: dracoUrl,
        raw_url: rawUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      if (roomErr) throw roomErr;

      // load into scene
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath("/draco/");
      const loader = new GLTFLoader();
      loader.setDRACOLoader(dracoLoader);
      const gltf = await new Promise((res, rej) => loader.load(dracoUrl, res, undefined, rej));
      const lidarScene = gltf.scene || gltf.scenes?.[0];
      if (!lidarScene) throw new Error("Invalid GLB: no scene");

      const lidarClone = lidarScene.clone(true);
      const proxyMesh = createProxyMeshFromScene(lidarClone, { simplifyRatio: 0.05, inflateScale: 1.02 });
      setMeshes({ lidarMesh: lidarClone, proxyMesh });

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
        color: "#eee",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 40,
      }}
    >
      {/* Header */}
      <h2 style={{ letterSpacing: 1, textAlign: "center" }}>
        {user ? `Welcome back, ${user.email}` : "Please sign in"}
      </h2>

      {/* Create new room */}
      <div style={{ border: "1px solid #aaa", padding: 24, marginTop: 20, width: 440 }}>
        <h3 style={{ textAlign: "center" }}>Create New Room</h3>
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
        {busy && <p style={{ color: "#bbb", marginTop: 12 }}>{step}</p>}
        {error && <p style={{ color: "#ff6b6b", marginTop: 12 }}>{error}</p>}
      </div>

      {/* List user's rooms */}
      <div style={{ width: "80%", marginTop: 40 }}>
        <h3 style={{ textAlign: "center", marginBottom: 16 }}>Your Saved Scans</h3>
        {rooms.length === 0 ? (
          <p style={{ textAlign: "center", opacity: 0.6 }}>No scans yet.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: 20,
            }}
          >
            {rooms.map((room) => (
              <div
                key={room.id}
                style={{
                  border: "1px solid #555",
                  borderRadius: 8,
                  padding: 16,
                  textAlign: "center",
                }}
              >
                <h4>{room.name}</h4>
                <p style={{ fontSize: 12, opacity: 0.7 }}>
                  Updated {new Date(room.updated_at).toLocaleDateString()}
                </p>
                <div style={{ marginTop: 10, display: "flex", justifyContent: "center", gap: 8 }}>
                  <button style={btnSmall} onClick={() => navigate(`/edit/${room.id}`)}>
                    Edit
                  </button>
                  <button style={btnSmall} onClick={() => navigate(`/room/${room.id}`)}>
                    Preview
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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

const btnSmall = {
  border: "1px solid #aaa",
  color: "#eee",
  background: "transparent",
  fontSize: 12,
  padding: "4px 10px",
  borderRadius: 4,
  cursor: "pointer",
};