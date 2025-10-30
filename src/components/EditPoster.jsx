import { useRef, useEffect, useState } from "react";
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

export default function EditPoster({
  imageUrl,
  index,
  size = "A0",
  onSelect,
  onMount,
  selectedPosterIndex,
  onDragStart,
  onDragEnd,
  onTransformChange,      // NEW callback
  initialTransform = {},  // NEW optional data from Supabase
}) {
  const texture = useLoader(THREE.TextureLoader, imageUrl);
  const meshRef = useRef();
  const { camera, gl } = useThree();
  const { proxyMeshRef } = useLiDAR();

  const [isDragging, setIsDragging] = useState(false);
  const [hasSpawned, setHasSpawned] = useState(false);
  const planeSize = A_SIZES[size] ?? A_SIZES["A0"];
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const offset = 0.015;

  // === Apply initial transform from Supabase ===
  useEffect(() => {
    if (!meshRef.current) return;
    if (initialTransform.position) meshRef.current.position.fromArray(initialTransform.position);
    if (initialTransform.rotation) meshRef.current.rotation.set(...initialTransform.rotation);
    if (initialTransform.scale) meshRef.current.scale.fromArray(initialTransform.scale);
  }, [initialTransform]);

  // === Spawn once in front of camera (only for new posters) ===
  useEffect(() => {
    if (!meshRef.current || !camera || hasSpawned || initialTransform?.position) return;
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    meshRef.current.position.copy(camera.position.clone().add(dir.multiplyScalar(1)));
    meshRef.current.lookAt(camera.position);
    onMount?.(index, meshRef.current);
    setHasSpawned(true);
  }, [camera, onMount, index, hasSpawned, initialTransform]);

  // === Track pointer for raycasting ===
  useEffect(() => {
    const handlePointerMove = (event) => {
      const rect = gl.domElement.getBoundingClientRect();
      mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };
    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [gl]);

  // === Continuous snap while dragging ===
  useFrame(() => {
    if (!isDragging || !proxyMeshRef.current || !meshRef.current) return;

    raycaster.current.setFromCamera(mouse.current, camera);
    const hits = raycaster.current.intersectObject(proxyMeshRef.current, true);

    if (hits.length > 0) {
      const hit = hits[0];

      // position slightly off the surface
      meshRef.current.position.copy(hit.point).addScaledVector(hit.normal, offset);

      // align to surface normal
      const targetNormal = hit.normal
        .clone()
        .applyMatrix3(new THREE.Matrix3().getNormalMatrix(proxyMeshRef.current.matrixWorld))
        .normalize();

      const worldUp = new THREE.Vector3(0, 1, 0);
      const projectedUp = worldUp
        .clone()
        .sub(targetNormal.clone().multiplyScalar(worldUp.dot(targetNormal)))
        .normalize();

      if (projectedUp.lengthSq() < 1e-6) projectedUp.set(0, 0, 1);

      const right = new THREE.Vector3().crossVectors(projectedUp, targetNormal).normalize();
      const upAligned = new THREE.Vector3().crossVectors(targetNormal, right).normalize();

      const basis = new THREE.Matrix4().makeBasis(right, upAligned, targetNormal);
      meshRef.current.quaternion.setFromRotationMatrix(basis);
    }
  });

  // === Pointer down: select first; if already selected, start drag ===
  const handlePointerDown = (e) => {
    e.stopPropagation();

    if (selectedPosterIndex !== index) {
      onSelect?.(index);
      return; // first click = select only
    }

    // already selected -> begin drag
    setIsDragging(true);
    onDragStart?.(); // inform parent to disable OrbitControls
    document.body.style.cursor = "grabbing";
  };

  // === Pointer up: stop drag and emit transform ===
  const handlePointerUp = (e) => {
    e.stopPropagation();

    if (isDragging && meshRef.current) {
      const pos = meshRef.current.position.toArray();
      const rot = [
        meshRef.current.rotation.x,
        meshRef.current.rotation.y,
        meshRef.current.rotation.z,
      ];
      const scl = meshRef.current.scale.toArray();
      onTransformChange?.(index, { position: pos, rotation: rot, scale: scl });
    }

    if (isDragging) {
      setIsDragging(false);
      onDragEnd?.();
      document.body.style.cursor = "default";
    }
  };

  // === If selection changes away, stop drag cleanly ===
  useEffect(() => {
    if (selectedPosterIndex !== index && isDragging) {
      setIsDragging(false);
      onDragEnd?.();
      document.body.style.cursor = "default";
    }
  }, [selectedPosterIndex, index, isDragging, onDragEnd]);

  // === Render ===
  return (
    <mesh
      ref={meshRef}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <planeGeometry args={[planeSize[0], planeSize[1]]} />
      <meshBasicMaterial map={texture} transparent side={THREE.FrontSide} />
    </mesh>
  );
}