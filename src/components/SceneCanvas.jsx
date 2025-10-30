import { Canvas } from "@react-three/fiber";
import { OrbitControls, TransformControls } from "@react-three/drei";
import { Suspense, useRef, useEffect } from "react";
import LiDARRoom from "./LiDARRoom";
import PointRoom from "./PointRoom";
import EditPoster from "./EditPoster";
import { useLiDAR } from "../context/LiDARContext";

export default function SceneCanvas({
  lidarRef,
  orbitRef,
  canvasRef,                         // ref object provided by parent
  posterUrls = [],
  posterSizes = [],
  selectedPosterIndex = null,
  setSelectedPosterIndex = () => {}, // safe defaults for Viewer mode
  setIsDragging = () => {},
  isDragging = false,
  renderMode = "mesh",               // 'mesh' | 'points'
  isEditable = true,                 // controls interactivity
  sceneKey = undefined,              // optional: pass roomId to force clean mount
  posterTransforms: initialTransforms = [], // array from Viewer (per index)
}) {
  const { meshReady } = useLiDAR();

  // Edit-mode refs
  const posterRefs = useRef(new Map());
  const transformRef = useRef();

  // Collected transforms during editing; Map<index, { position, rotation, scale }>
  const collectedTransforms = useRef(new Map());

  // Keep a handle to the underlying WebGL canvas for stability hooks
  const webglCanvasRef = useRef(null);

  // Expose an imperative getter for Editor: canvasRef.current.getPosterTransforms()
  useEffect(() => {
    if (!canvasRef) return;
    if (!canvasRef.current) canvasRef.current = {};
    canvasRef.current.getPosterTransforms = () => {
      return Array.from(collectedTransforms.current.entries())
        .sort(([a], [b]) => a - b)
        .map(([_, val]) => val);
    };
  }, [canvasRef]);

  // Prevent default on WebGL context loss (stops Chrome nuking the context)
  useEffect(() => {
    const el = webglCanvasRef.current;
    if (!el) return;
    const handleLost = (e) => e.preventDefault();
    el.addEventListener("webglcontextlost", handleLost, { passive: false });
    return () => el.removeEventListener("webglcontextlost", handleLost);
  }, []);

  // --- Edit only: selection / attach logic ---
  const handleSelect = (index) => {
    if (!isEditable) return;
    if (!transformRef.current) return;
    transformRef.current.detach();
    setSelectedPosterIndex(index);
    const mesh = posterRefs.current.get(index) || null;
    if (mesh) transformRef.current.attach(mesh);
  };

  const handlePosterMount = (index, mesh) => {
    if (!isEditable) return;
    posterRefs.current.set(index, mesh);

    const attachToMesh = () => {
      if (!transformRef.current || !mesh) return;
      transformRef.current.detach();
      setSelectedPosterIndex(index);
      transformRef.current.attach(mesh);
    };

    if (!transformRef.current) {
      const interval = setInterval(() => {
        if (transformRef.current) {
          clearInterval(interval);
          attachToMesh();
        }
      }, 50);
    } else {
      attachToMesh();
    }
  };

  const showPosters = renderMode === "mesh" && posterUrls.length > 0;

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas
        key={sceneKey}
        gl={{ preserveDrawingBuffer: false }}
        camera={{ position: [0, -2.2, -3.5], fov: 70 }}
        onCreated={(state) => {
          // retain three state if you need it later
          canvasRef.current = canvasRef.current || {};
          canvasRef.current.__three = state;
          // reattach getter in case current was replaced
          canvasRef.current.getPosterTransforms = () => {
            return Array.from(collectedTransforms.current.entries())
              .sort(([a], [b]) => a - b)
              .map(([_, val]) => val);
          };
          // capture the actual WebGL canvas element
          webglCanvasRef.current = state.gl.domElement;
        }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[2, 4, 2]} intensity={0.8} />

        <Suspense fallback={null}>
          {/* LiDAR mesh or points */}
          {meshReady && renderMode === "mesh" && (
            <group ref={lidarRef}>
              <LiDARRoom />
            </group>
          )}
          {meshReady && renderMode === "points" && <PointRoom />}

          {/* Posters */}
          {showPosters &&
            posterUrls.map((url, i) => (
              <EditPoster
                key={i}
                imageUrl={url}
                index={i}
                size={posterSizes?.[i] ?? "A0"}
                selectedPosterIndex={selectedPosterIndex}
                onSelect={isEditable ? handleSelect : undefined}
                onMount={isEditable ? handlePosterMount : undefined}
                onDragStart={isEditable ? () => setIsDragging(true) : undefined}
                onDragEnd={isEditable ? () => setIsDragging(false) : undefined}
                onTransformChange={(idx, t) => collectedTransforms.current.set(idx, t)}
                initialTransform={initialTransforms?.[i]}
              />
            ))}
        </Suspense>

        {/* Edit-only transform gizmo */}
        {isEditable && showPosters && (
          <TransformControls
            ref={transformRef}
            enabled={selectedPosterIndex !== null}
            mode="translate"
            space="world"
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
          />
        )}

        {/* Orbit always on; disable while dragging in edit */}
        <OrbitControls ref={orbitRef} enabled={!isDragging} target={[0, -1.6, 0]} />
      </Canvas>
    </div>
  );
}