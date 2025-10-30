import { forwardRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { useLiDAR } from "../context/LiDARContext";
import { useFrame } from "@react-three/fiber";
import { useFxStore } from "../state/useFxStore";

const LiDARRoom = forwardRef((props, ref) => {
  const { lidarMeshRef, proxyMeshRef } = useLiDAR();
  const { fx } = useFxStore();
  
  // build simple material once
  const fxMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(fx.hue),
      transparent: true,
      opacity: fx.transparency,
    });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uPointDensity = { value: fx.pointDensity };
      shader.uniforms.uBlur = { value: fx.blur };
      shader.uniforms.uNoise = { value: fx.noise };
      shader.uniforms.uTransparency = { value: fx.transparency };
      shader.uniforms.uHue = { value: new THREE.Color(fx.hue) };
      // keep reference for live updates
      mat.userData.shader = shader;
    };
    return mat;
  }, []);

  // live-update uniforms every frame (lightweight)
  useFrame(() => {
    const s = fxMaterial.userData.shader;
    if (!s) return;
    s.uniforms.uPointDensity.value = fx.pointDensity;
    s.uniforms.uBlur.value = fx.blur;
    s.uniforms.uNoise.value = fx.noise;
    s.uniforms.uTransparency.value = fx.transparency;
    s.uniforms.uHue.value.set(fx.hue);
    fxMaterial.opacity = fx.transparency;
    fxMaterial.color.set(fx.hue);
  });

  if (!lidarMeshRef.current) return null;

  return (
    <group ref={ref} rotation={[0, Math.PI / 2, 0]} position={[0, -1.6, 0]}>
      <primitive object={lidarMeshRef.current} material={fxMaterial} />
      {proxyMeshRef.current && <primitive object={proxyMeshRef.current} visible={false} />}
    </group>
  );
});

export default LiDARRoom;