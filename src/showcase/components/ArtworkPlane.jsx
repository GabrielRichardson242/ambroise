import { useRef } from "react";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";

export default function ArtworkPlane({ artwork, onClick }) {
  const meshRef = useRef(null);
  const pointerStart = useRef(null);

  const imageUrl = artwork.image_url || artwork.url || artwork.poster_url;
  const texture = useLoader(THREE.TextureLoader, imageUrl);

  const transform = artwork.transform ?? {};
  const position = transform.position ?? artwork.position ?? [0, 0, 0];
  const rotation = transform.rotation ?? artwork.rotation ?? [0, 0, 0];
  const scale = transform.scale ?? artwork.scale ?? [1, 1, 1];

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      scale={scale}
      renderOrder={9999}
      onPointerDown={(e) => {
        pointerStart.current = {
          x: e.nativeEvent.clientX,
          y: e.nativeEvent.clientY,
        };
      }}
      onPointerUp={(e) => {
        if (!pointerStart.current) return;

        const dx = e.nativeEvent.clientX - pointerStart.current.x;
        const dy = e.nativeEvent.clientY - pointerStart.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        pointerStart.current = null;

        if (distance < 8) {
          e.stopPropagation();
          onClick?.(artwork, meshRef.current);
        }
      }}
    >
      <planeGeometry args={[1, 1.414]} />

      <meshBasicMaterial
        map={texture}
        side={THREE.DoubleSide}
        transparent
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}