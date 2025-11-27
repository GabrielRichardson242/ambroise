import { useRef, useEffect, useLayoutEffect, useState } from "react";
import { useLoader, useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useLiDAR } from "../context/LiDARContext";

export const A_SIZES = {
  A4: [0.21, 0.297],
  A3: [0.297, 0.42],
  A2: [0.42, 0.594],
  A1: [0.594, 0.841],
  A0: [0.841, 1.189],
  A4_L: [0.297, 0.21],
  A3_L: [0.42, 0.297],
  A2_L: [0.594, 0.42],
  A1_L: [0.841, 0.594],
  A0_L: [1.189, 0.841],
};

export default function EditPoster(props) {
  const {
    imageUrl,
    index,
    size = "A0",
    onSelect,
    onMount,
    selectedPosterIndex,
    onDragStart,
    onDragEnd,
    onTransformChange,
    initialTransform = {},
    mode = "upload",
  } = props;

  // Guard: prevent undefined texture crash
  if (!imageUrl) {
    console.warn("EditPoster: missing imageUrl for index", index);
    return null;
  }

  const texture = useLoader(THREE.TextureLoader, imageUrl);
  const meshRef = useRef();
  const hasMounted = useRef(false);
  const { camera, gl } = useThree();
  const { proxyMeshRef } = useLiDAR();

  const [isDragging, setIsDragging] = useState(false);
  const [hasSpawned, setHasSpawned] = useState(false);
  const planeSize = A_SIZES[size] ?? A_SIZES["A0"];
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const isUpload = mode === "upload";

  // Mount once
  useLayoutEffect(() => {
    if (hasMounted.current || !meshRef.current) return;
    onMount?.(meshRef.current);
    hasMounted.current = true;
  }, [onMount]);

  // Apply stored transform
  useEffect(() => {
    if (!meshRef.current || !initialTransform) return;
    const mesh = meshRef.current;
    if (initialTransform.position)
      mesh.position.fromArray(initialTransform.position);
    if (initialTransform.rotation)
      mesh.rotation.set(...initialTransform.rotation);
    if (initialTransform.scale)
      mesh.scale.fromArray(initialTransform.scale);
  }, [initialTransform]);

  // Spawn in front of camera on first load (upload mode)
  useEffect(() => {
    if (
      !isUpload ||
      hasSpawned ||
      !meshRef.current ||
      (initialTransform?.position?.length === 3)
    )
      return;

    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    meshRef.current.position.copy(
      camera.position.clone().add(dir.multiplyScalar(2))
    );
    meshRef.current.lookAt(camera.position);
    setHasSpawned(true);
  }, [camera, hasSpawned, imageUrl, isUpload, initialTransform]);

  // Track mouse for dragging
  useEffect(() => {
    if (!isUpload) return;
    const handlePointerMove = (event) => {
      const rect = gl.domElement.getBoundingClientRect();
      mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };
    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [gl, isUpload]);

  // Snapping & dragging
  useFrame(() => {
    if (!isUpload || !isDragging || !proxyMeshRef.current || !meshRef.current)
      return;

    const POSTER_PROUD = 0.02;
    const mesh = meshRef.current;
    const proxyMesh = proxyMeshRef.current;

    raycaster.current.setFromCamera(mouse.current, camera);
    const hits = raycaster.current.intersectObject(proxyMesh, true);
    if (hits.length === 0) return;

    const hit = hits[0];
    mesh.position.copy(hit.point).addScaledVector(hit.normal, POSTER_PROUD);

    const normalMatrix = new THREE.Matrix3().getNormalMatrix(
      proxyMesh.matrixWorld
    );
    const targetNormal = hit.normal
      .clone()
      .applyMatrix3(normalMatrix)
      .normalize();

    const worldUp = new THREE.Vector3(0, 1, 0);
    const projectedUp = worldUp
      .clone()
      .sub(targetNormal.clone().multiplyScalar(worldUp.dot(targetNormal)))
      .normalize();
    if (projectedUp.lengthSq() < 1e-6) projectedUp.set(0, 0, 1);

    const right = new THREE.Vector3()
      .crossVectors(projectedUp, targetNormal)
      .normalize();
    const upAligned = new THREE.Vector3()
      .crossVectors(targetNormal, right)
      .normalize();

    const basis = new THREE.Matrix4().makeBasis(right, upAligned, targetNormal);
    mesh.quaternion.setFromRotationMatrix(basis);
  });

  // Pointer handlers
  const handlePointerDown = (e) => {
    if (!isUpload) return;
    e.stopPropagation();
    if (selectedPosterIndex !== index) {
      onSelect?.(index);
      return;
    }
    setIsDragging(true);
    onDragStart?.();
    document.body.style.cursor = "grabbing";
  };

  const handlePointerUp = (e) => {
    if (!isUpload) return;
    e.stopPropagation();

    if (isDragging && meshRef.current) {
      onTransformChange?.(index, {
        position: meshRef.current.position.toArray(),
        rotation: [
          meshRef.current.rotation.x,
          meshRef.current.rotation.y,
          meshRef.current.rotation.z,
        ],
        scale: meshRef.current.scale.toArray(),
      });
    }

    if (isDragging) {
      setIsDragging(false);
      onDragEnd?.();
      document.body.style.cursor = "default";
    }
  };

  // Deselect
  useEffect(() => {
    if (!isUpload) return;
    if (selectedPosterIndex !== index && isDragging) {
      setIsDragging(false);
      onDragEnd?.();
      document.body.style.cursor = "default";
    }
  }, [selectedPosterIndex, index, isDragging, onDragEnd, isUpload]);

  // Update geometry on size change
  useEffect(() => {
    if (!meshRef.current) return;
    const [w, h] = A_SIZES[size] ?? A_SIZES["A0"];
    const geom = new THREE.PlaneGeometry(w, h);
    meshRef.current.geometry.dispose();
    meshRef.current.geometry = geom;
  }, [size]);

  // Force poster to always render above mesh
  useEffect(() => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material;

    mat.transparent = true;  // <-- REQUIRED FIX
    mat.opacity = 1.0;       // <-- stays visually solid

    mat.depthTest = false;
    mat.depthWrite = false;

    meshRef.current.renderOrder = 9999;
  });

  return (
    <mesh
      ref={meshRef}
      onPointerDown={isUpload ? handlePointerDown : undefined}
      onPointerUp={isUpload ? handlePointerUp : undefined}
    >
      <planeGeometry args={[planeSize[0], planeSize[1]]} />
      <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
    </mesh>
  );
}