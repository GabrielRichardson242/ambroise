import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, TransformControls } from "@react-three/drei";
import {
  Suspense,
  useRef,
  useEffect,
  useState,
  useMemo,
  forwardRef,
} from "react";
import * as THREE from "three";

import { getFocusCameraPose } from "../showcase/utils/cameraFocus";

import LiDARRoom from "./LiDARRoom";
import PointRoom from "./PointRoom";
import EditPoster from "./EditPoster";
import { useLiDAR } from "../context/LiDARContext";
import ArtworkPlane from "../showcase/components/ArtworkPlane";

function CameraFocusController({
  focusPose,
  returnPose,
  orbitRef,
  onReturnComplete,
}) {
  const { camera } = useThree();
  const returnCompleteRef = useRef(false);

  useEffect(() => {
    returnCompleteRef.current = false;
  }, [returnPose]);

  useFrame(() => {
    const activePose = returnPose || focusPose;

    if (!activePose?.position || !activePose?.target) return;

    const nextPosition = new THREE.Vector3(...activePose.position);
    const nextTarget = new THREE.Vector3(...activePose.target);

    camera.position.lerp(nextPosition, 0.08);
    camera.lookAt(nextTarget);

    if (orbitRef?.current) {
      orbitRef.current.target.lerp(nextTarget, 0.08);
      orbitRef.current.update();
    }

    if (returnPose && !returnCompleteRef.current) {
      const distanceToPosition = camera.position.distanceTo(nextPosition);
      const distanceToTarget = orbitRef?.current
        ? orbitRef.current.target.distanceTo(nextTarget)
        : 0;

      if (distanceToPosition < 0.03 && distanceToTarget < 0.03) {
        returnCompleteRef.current = true;
        onReturnComplete?.();
      }
    }
  });

  return null;
}

function ShowcaseArtworkLayer({
  posters,
  onArtworkSelect,
  orbitRef,
  resetSignal,
  onCameraResetComplete,
}) {
  const { camera } = useThree();

  const [focusPose, setFocusPose] = useState(null);
  const [returnPose, setReturnPose] = useState(null);

  const lastIdlePoseRef = useRef(null);
  const lastResetSignalRef = useRef(resetSignal);

  const handleArtworkClick = (poster, mesh) => {
    if (!mesh) return;

    const currentTarget = orbitRef?.current?.target
      ? orbitRef.current.target.toArray()
      : [0, 0, 0];

    lastIdlePoseRef.current = {
      position: camera.position.toArray(),
      target: currentTarget,
    };

    console.log("Saved idle pose:", lastIdlePoseRef.current);

    const pose = getFocusCameraPose(
      mesh,
      camera,
      poster.focus?.distance ?? 1.6,
      poster.focus?.yOffset ?? 0.15,
      poster.focus?.targetYOffset ?? 0
    );

    setReturnPose(null);
    setFocusPose({
      ...pose,
    });

    onArtworkSelect?.(poster);
  };

  useEffect(() => {
    if (resetSignal === lastResetSignalRef.current) return;

    lastResetSignalRef.current = resetSignal;

    console.log("Reset signal received:", resetSignal);
    console.log("Returning to:", lastIdlePoseRef.current);


    if (!lastIdlePoseRef.current) {
      console.warn("No saved camera pose to return to.");
      return;
    }
    console.log("Saving idle pose:", lastIdlePoseRef.current);
    // if (!lastIdlePoseRef.current) {
    //   setFocusPose(null);
    //   setReturnPose(null);
    //   onCameraResetComplete?.();
    //   return;
    // }

    setReturnPose(lastIdlePoseRef.current);
    setFocusPose(null);
  }, [resetSignal, onCameraResetComplete]);

  const handleReturnComplete = () => {
    setReturnPose(null);
    setFocusPose(null);
    onCameraResetComplete?.();
  };

  return (
    <>
      {posters.map((poster, i) => (
        <ArtworkPlane
          key={poster.id || i}
          artwork={poster}
          onClick={handleArtworkClick}
        />
      ))}

      <CameraFocusController
        focusPose={focusPose}
        returnPose={returnPose}
        orbitRef={orbitRef}
        onReturnComplete={handleReturnComplete}
      />
    </>
  );
}

const SceneCanvas = forwardRef(function SceneCanvas(
  {
    mode = "upload",
    data,
    onArtworkSelect,
    isArtworkFocused = false,
    resetSignal = 0,
    onCameraResetComplete,
  },
  ref
) {
  const { meshReady } = useLiDAR();

  const posters = data?.artworks ?? [];

  const [selectedPosterIndex, setSelectedPosterIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const lidarRef = useRef();
  const orbitRef = useRef();
  const transformRef = useRef();
  const collectedTransforms = useRef(new Map());
  const webglCanvasRef = useRef(null);

  const isUpload = mode === "upload";
  const isShowcase = mode === "showcase";
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
    if (isUpload) {
      setSelectedPosterIndex(index);
    }
  };

  const handlePosterMount = (index, mesh) => {
    if (!mesh) return;

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
    console.log("Transform changed:", idx, transform);
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
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        zIndex: 0,
      }}
    >
      <Canvas
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
        }}
        gl={{
          preserveDrawingBuffer: true,
          antialias: true,
          alpha: true,
        }}
        camera={{ position: [0, 2, -3.5], fov: 70 }}
        onCreated={(state) => {
          webglCanvasRef.current = state.gl.domElement;

          state.gl.setClearColor(0x000000, 0);

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

          {isShowcase ? (
            <ShowcaseArtworkLayer
              posters={posters}
              onArtworkSelect={onArtworkSelect}
              orbitRef={orbitRef}
              resetSignal={resetSignal}
              onCameraResetComplete={onCameraResetComplete}
            />
          ) : (
            posters.map((poster, i) => (
              <EditPoster
                key={
                  (poster.id || i) +
                  ":" +
                  (poster.image_url || poster.url || "")
                }
                imageUrl={poster.image_url || poster.url}
                index={i}
                size={poster.size ?? "A0"}
                initialTransform={poster.transform}
                selectedPosterIndex={selectedPosterIndex}
                onSelect={() => handleSelect(i)}
                onMount={(mesh) => handlePosterMount(i, mesh)}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={() => setIsDragging(false)}
                onTransformChange={handleTransformChange}
                mode={mode}
              />
            ))
          )}
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
          enabled={!isDragging && !isArtworkFocused}
          target={[0, 0, 0]}
          enablePan={true}
          enableZoom={true}
          minDistance={1}
          maxDistance={6}
          minPolarAngle={Math.PI / 2 - 0.18}
          maxPolarAngle={Math.PI / 2 + 0.18}
          rotateSpeed={1.6}
          zoomSpeed={0.8}
        />
      </Canvas>
    </div>
  );
});

export default SceneCanvas;