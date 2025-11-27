import { Canvas } from "@react-three/fiber";
import { OrbitControls, TransformControls } from "@react-three/drei";
import {
  Suspense,
  useRef,
  useEffect,
  useState,
  useMemo,
  forwardRef,
} from "react";
import LiDARRoom from "./LiDARRoom";
import PointRoom from "./PointRoom";
import EditPoster from "./EditPoster";
import { useLiDAR } from "../context/LiDARContext";
import { useRoomStore } from "../state/useRoomStore";
import { roomState } from "../state/roomState";

const SceneCanvas = forwardRef(function SceneCanvas({ mode = "upload" }, ref) {
  const { meshReady } = useLiDAR();
  const posters = useRoomStore((s) => s.posters);

  const [selectedPosterIndex, setSelectedPosterIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const lidarRef = useRef();
  const orbitRef = useRef();
  const transformRef = useRef();
  const collectedTransforms = useRef(new Map());
  const webglCanvasRef = useRef(null);

  const isUpload = mode === "upload";
  const renderMode = mode === "world" ? "points" : "mesh";

  useEffect(() => {
    const el = webglCanvasRef.current;
    if (!el) return;

    const preventLost = (e) => e.preventDefault();
    el.addEventListener("webglcontextlost", preventLost, { passive: false });

    return () => {
      el.removeEventListener("webglcontextlost", preventLost);
    };
  }, []);

  useEffect(() => {
    if (!isUpload || !transformRef.current) return;

    transformRef.current.detach();

    if (selectedPosterIndex == null) return;

    const mesh = collectedTransforms.current.get(selectedPosterIndex)?.mesh;
    if (mesh) {
      transformRef.current.attach(mesh);
      mesh.updateMatrixWorld(true);
      transformRef.current.updateMatrixWorld(true);
    }
  }, [selectedPosterIndex, isUpload]);

  useEffect(() => {
    if (!isUpload) return;
    if (posters.length === 0) return;

    const newestIndex = posters.length - 1;
    const newestMesh = collectedTransforms.current.get(newestIndex)?.mesh;

    if (newestMesh && selectedPosterIndex === null) {
      setSelectedPosterIndex(newestIndex);
    }
  }, [posters, selectedPosterIndex, isUpload]);

  const handleSelect = (index) => {
    if (isUpload) setSelectedPosterIndex(index);
  };

  const handlePosterMount = (mesh) => {
    if (!mesh) return;

    const index = posters.length - 1;
    collectedTransforms.current.set(index, { mesh });

    if (isUpload && transformRef.current) {
      transformRef.current.detach();
      transformRef.current.attach(mesh);
      mesh.updateMatrixWorld(true);
      transformRef.current.updateMatrixWorld(true);
      setSelectedPosterIndex(index);
    }
  };

  const handleTransformChange = (idx, transform) => {
    if (isUpload) {
      roomState.updatePoster(idx, { transform });
    }
  };

  const lidarSubtree = useMemo(() => {
    if (!meshReady) return null;

    return renderMode === "mesh" ? (
      <group ref={lidarRef}>
        <LiDARRoom />
      </group>
    ) : (
      <PointRoom />
    );
  }, [meshReady, renderMode]);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas
        gl={{
          preserveDrawingBuffer: true,
          antialias: true,
        }}
        camera={{ position: [0, -2.2, -3.5], fov: 70 }}
        onCreated={(state) => {
          webglCanvasRef.current = state.gl.domElement;

          if (ref) {
            ref.current = {
              getPosterTransforms: () =>
                Array.from(collectedTransforms.current.entries()).map(
                  ([i, { mesh }]) => {
                    if (!mesh) return null;
                    return {
                      index: i,
                      position: mesh.position.toArray(),
                      rotation: [
                        mesh.rotation.x,
                        mesh.rotation.y,
                        mesh.rotation.z,
                      ],
                      scale: mesh.scale.toArray(),
                    };
                  }
                ),
              getCanvas: () => webglCanvasRef.current,
              getRenderer: () => state.gl,
            };
          }
        }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[2, 4, 2]} intensity={0.8} />

        <Suspense fallback={null}>
          {lidarSubtree}

          {posters.map((poster, i) => (
            <EditPoster
              key={(poster.id || i) + ":" + (poster.url || "")}
              imageUrl={poster.url}
              index={i}
              size={poster.size ?? "A0"}
              initialTransform={poster.transform}
              selectedPosterIndex={selectedPosterIndex}
              onSelect={() => handleSelect(i)}
              onMount={handlePosterMount}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={() => setIsDragging(false)}
              onTransformChange={handleTransformChange}
              mode={mode}
            />
          ))}
        </Suspense>

        {isUpload && posters.length > 0 && (
          <TransformControls
            ref={transformRef}
            enabled={selectedPosterIndex !== null}
            mode="translate"
            space="world"
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
          />
        )}

        <OrbitControls
          ref={orbitRef}
          enabled={!isDragging}
          target={[0, -1.6, 0]}
        />
      </Canvas>
    </div>
  );
});

export default SceneCanvas;