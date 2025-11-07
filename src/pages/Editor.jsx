import { useRef, useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import SceneCanvas from "../components/SceneCanvas";
import RightSidebar from "../components/RightSidebar";
import { v4 as uuidv4 } from "uuid";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { useLiDAR } from "../context/LiDARContext";
import { createProxyMeshFromScene } from "../utils/proxyGenerator";

export default function Editor() {
  const canvasRef = useRef();
  const lidarRef = useRef();
  const orbitRef = useRef();
  const navigate = useNavigate();
  const { roomId: routeRoomId } = useParams();
  const generatedId = useRef(routeRoomId || uuidv4());
  const roomId = generatedId.current;
  const { setMeshes } = useLiDAR();
  const hydratedRef = useRef(false);

  console.log("roomID stable check:", roomId);

  useEffect(() => {
    if (!routeRoomId) navigate(`/edit/${roomId}`, { replace: true });
  }, [routeRoomId, roomId, navigate]);

  const [roomData, setRoomData] = useState({
    id: roomId,
    name: "Untitled Room",
    description: "",
    scan_draco_url: "",
    raw_url: "",
    camera_position: [0, 2, 5],
    camera_target: [0, 0, 0],
    theme: "default",
  });

  // unified poster array
  const [posters, setPosters] = useState([]);
  const [selectedPosterIndex, setSelectedPosterIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [sidebarMode, setSidebarMode] = useState("upload");
  const renderMode = sidebarMode === "world" ? "points" : "mesh";

  // ---------- ensure room exists ----------
  useEffect(() => {
    async function ensureRoomExists() {
      const { data, error } = await supabase
        .from("rooms")
        .select("id")
        .eq("id", roomId)
        .maybeSingle();
      if (error) {
        console.error("Room check failed:", error.message);
        return;
      }
      if (!data) {
        const { error: createErr } = await supabase.from("rooms").insert({
          id: roomId,
          name: "Untitled Room",
          description: "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        if (createErr)
          console.error("Failed to create draft room:", createErr.message);
        else console.log("Draft room created:", roomId);
      }
    }
    ensureRoomExists();
  }, [roomId]);

  // ---------- fetch room + hydrate scan, THEN fetch posters ----------
  useEffect(() => {
    async function fetchRoomAndHydrate() {
      console.log("Hydrate check:", roomId);

      const { data: room, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .maybeSingle();

      if (error) {
        console.error("Failed to fetch room:", error.message);
        return;
      }
      if (!room) {
        console.warn("No room found for ID:", roomId);
        return;
      }

      setRoomData((prev) => ({
        ...prev,
        ...room,
        scan_draco_url: room.scan_draco_url || room.scan_url || "",
      }));

      // ---- hydrate scan only once ----
      if (room.scan_draco_url && !hydratedRef.current) {
        try {
          console.log("Attempting to load scan from:", room.scan_draco_url);
          const dracoLoader = new DRACOLoader();
          dracoLoader.setDecoderPath("/draco/");
          dracoLoader.setWorkerLimit(1);

          const loader = new GLTFLoader();
          loader.setDRACOLoader(dracoLoader);

          const gltf = await new Promise((resolve, reject) =>
            loader.load(room.scan_draco_url, resolve, undefined, reject)
          );

          const lidarScene = gltf.scene || gltf.scenes?.[0];
          if (lidarScene) {
            lidarScene.traverse((c) => (c.frustumCulled = false));
            const proxyMesh = createProxyMeshFromScene(lidarScene.clone(true), {
              simplifyRatio: 0.05,
              inflateDistance: 0.02,
            });
            setMeshes({ lidarMesh: lidarScene, proxyMesh });
            hydratedRef.current = true;
            console.log("Scan hydrated ONCE");
          } else {
            console.warn("GLTF loaded but no scene found");
          }
        } catch (e) {
          console.error("Editor: failed to hydrate scan:", e?.message || e);
        }
      }

      // ---- fetch posters AFTER scan ----
      const { data: postersData, error: postersErr } = await supabase
        .from("posters")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });

      if (postersErr) {
        console.error("Failed to fetch posters:", postersErr.message);
        return;
      }

      const hydrated = postersData.map((p) => ({
        url: p.file_url,
        size: p.size || "A0",
        transform: Array.isArray(p.position)
          ? { position: p.position, rotation: p.rotation, scale: p.scale }
          : null,
      }));

      setPosters(hydrated);
      console.log("Posters fetched after scan:", hydrated.length);
    }

    fetchRoomAndHydrate();
  }, [roomId]); // << run once per room

  // ---------- poster upload ----------
  const handleFileUpload = async (file) => {
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    const maxSizeMB = 15;

    if (!allowedTypes.includes(file.type)) {
      alert("Invalid file type. Only JPG, PNG, or PDF allowed.");
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`File too large. Max size is ${maxSizeMB} MB.`);
      return;
    }

    const path = `${roomId}/${crypto.randomUUID()}-${file.name}`;
    console.log("Uploading poster to:", path);

    const { error } = await supabase.storage
      .from("posters")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "image/png",
      });

    if (error) {
      console.error("Poster upload failed:", error.message);
      alert("Upload failed.");
      return;
    }

    const { data: urlData } = supabase.storage.from("posters").getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    const { error: insertErr } = await supabase.from("posters").insert({
      id: crypto.randomUUID(),
      room_id: roomId,
      file_url: publicUrl,
      size: "A0",
      position: null,
      rotation: null,
      scale: null,
      title: file.name,
      description: "",
      created_at: new Date().toISOString(),
    });

    if (insertErr) {
      console.error("Poster insert failed:", insertErr.message);
    } else {
      console.log("Poster inserted:", publicUrl);
    }

    // single stable update
    setPosters((prev) => {
      const next = [...prev, { url: publicUrl, size: "A0", transform: null }];
      console.log("setPosters next len:", next.length);
      return next;
    });
  };

  useEffect(() => {
    console.log("Editor posters changed ->", posters.length);
  }, [posters]);

  const handleChangePosterSize = (index, newSize) => {
    setPosters((prev) =>
      prev.map((p, i) => (i === index ? { ...p, size: newSize } : p))
    );
  };

  async function handleSave(isPreview = false) {
    try {
      const transforms = canvasRef.current?.getPosterTransforms?.() || [];
      console.log("Poster transforms on save:", transforms);

      const { error: roomErr } = await supabase.from("rooms").upsert({
        id: roomId,
        name: roomData.name,
        description: roomData.description,
        scan_draco_url: roomData.scan_draco_url || null,
        raw_url: roomData.raw_url || null,
        camera_position: roomData.camera_position,
        camera_target: roomData.camera_target,
        theme: roomData.theme,
        is_preview: isPreview,
        updated_at: new Date().toISOString(),
      });
      if (roomErr) throw roomErr;

      const { data: existingPosters, error: epErr } = await supabase
        .from("posters")
        .select("id")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });

      if (epErr) {
        console.error("Failed to refetch posters before update:", epErr.message);
      } else if (existingPosters && transforms.length) {
        const n = Math.min(existingPosters.length, transforms.length);
        for (let i = 0; i < n; i++) {
          const t = transforms[i];
          if (!t) continue;
          const { error: updateErr } = await supabase
            .from("posters")
            .update({
              position: t.position,
              rotation: t.rotation,
              scale: t.scale,
              size: posters[i].size ?? "A0",
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingPosters[i].id);
          if (updateErr)
            console.error("Poster update failed:", updateErr.message);
        }
      } else {
        console.warn("No transforms captured; posters not updated");
      }

      if (isPreview) navigate(`/room/${roomId}`);
      console.log("Room saved successfully");
    } catch (err) {
      console.error("Save failed:", err.message);
    }
  }

  const postersMemo = useMemo(() => posters, [posters]);

  // diagnostics
  console.log("Editor posters len:", posters.length, posters[0]);

  return (
    <>
      <SceneCanvas
        sceneKey={roomId}
        lidarRef={lidarRef}
        orbitRef={orbitRef}
        canvasRef={canvasRef}
        posters={postersMemo}
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
        handleFileUpload={handleFileUpload}
        onSelectPoster={setSelectedPosterIndex}
        selectedPosterIndex={selectedPosterIndex}
        posters={posters}
        onChangePosterSize={handleChangePosterSize}
        setPosters={setPosters}
      />

      <div className="absolute bottom-4 right-4 flex gap-2 z-50">
        <button onClick={() => handleSave(false)}>Save Draft</button>
        <button onClick={() => handleSave(true)}>Publish Room</button>
      </div>
    </>
  );
}