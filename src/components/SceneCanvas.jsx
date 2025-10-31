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
  canvasRef,
  posterUrls = [],
  posterSizes = [],
  posterTransforms = [],
  selectedPosterIndex = null,
  setSelectedPosterIndex = () => {},
  setIsDragging = () => {},
  isDragging = false,
  renderMode = "mesh",
  isEditable = true,
  sceneKey = undefined,
}) {
  const { meshReady } = useLiDAR();
  const initialTransforms = posterTransforms;
  const posterRefs = useRef(new Map());
  const transformRef = useRef();
  const collectedTransforms = useRef(new Map());
  const webglCanvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef) return;
    if (!canvasRef.current) canvasRef.current = {};
    canvasRef.current.getPosterTransforms = () =>
      Array.from(collectedTransforms.current.entries())
        .sort(([a], [b]) => a - b)
        .map(([_, val]) => val);
  }, [canvasRef]);

  useEffect(() => {
    const el = webglCanvasRef.current;
    if (!el) return;
    const handleLost = (e) => e.preventDefault();
    el.addEventListener("webglcontextlost", handleLost, { passive: false });
    return () => el.removeEventListener("webglcontextlost", handleLost);
  }, []);

  const handleSelect = (index) => {
    if (!isEditable || !transformRef.current) return;
    transformRef.current.detach();
    setSelectedPosterIndex(index);
    const mesh = posterRefs.current.get(index) || null;
    if (mesh) transformRef.current.attach(mesh);
  };

  const handlePosterMount = (index, mesh) => {
    if (!isEditable) return;
    posterRefs.current.set(index, mesh);
    const attach = () => {
      if (!transformRef.current || !mesh) return;
      transformRef.current.detach();
      setSelectedPosterIndex(index);
      transformRef.current.attach(mesh);
    };
    if (!transformRef.current) {
      const interval = setInterval(() => {
        if (transformRef.current) {
          clearInterval(interval);
          attach();
        }
      }, 50);
    } else attach();
  };

  const handleTransformChange = (idx, t) => {
    console.log("Transform updated:", idx, t);
    collectedTransforms.current.set(idx, t);
  };

  const showPosters = renderMode === "mesh" && posterUrls.length > 0;

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas
        key={sceneKey}
        gl={{ preserveDrawingBuffer: false }}
        camera={{ position: [0, -2.2, -3.5], fov: 70 }}
        onCreated={(state) => {
          canvasRef.current = canvasRef.current || {};
          canvasRef.current.__three = state;
          canvasRef.current.getPosterTransforms = () =>
            Array.from(collectedTransforms.current.entries())
              .sort(([a], [b]) => a - b)
              .map(([_, val]) => val);
          webglCanvasRef.current = state.gl.domElement;
        }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[2, 4, 2]} intensity={0.8} />

        <Suspense fallback={null}>
          {meshReady && renderMode === "mesh" && (
            <group ref={lidarRef}>
              <LiDARRoom />
            </group>
          )}
          {meshReady && renderMode === "points" && <PointRoom />}
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
                onTransformChange={isEditable ? handleTransformChange : undefined}
                initialTransform={initialTransforms?.[i]}
              />
            ))}
        </Suspense>

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

        <OrbitControls ref={orbitRef} enabled={!isDragging} target={[0, -1.6, 0]} />
      </Canvas>
    </div>
  );
}