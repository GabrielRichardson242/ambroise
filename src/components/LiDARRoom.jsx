import { forwardRef, useMemo } from "react";
import * as THREE from "three";
import { useLiDAR } from "../context/LiDARContext";
import { useFrame } from "@react-three/fiber";
import { useFxStore } from "../state/useFxStore";

const LiDARRoom = forwardRef((props, ref) => {
  const { lidarMeshRef, proxyMeshRef } = useLiDAR();
  const { fx } = useFxStore();

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

      mat.userData.shader = shader;
    };

    return mat;
  }, []);

  useFrame(() => {
    const shader = fxMaterial.userData.shader;

    if (!shader) return;

    shader.uniforms.uPointDensity.value = fx.pointDensity;
    shader.uniforms.uBlur.value = fx.blur;
    shader.uniforms.uNoise.value = fx.noise;
    shader.uniforms.uTransparency.value = fx.transparency;
    shader.uniforms.uHue.value.set(fx.hue);

    fxMaterial.opacity = fx.transparency;
    fxMaterial.color.set(fx.hue);
  });

  useFrame(() => {
    if (lidarMeshRef.current) {
      lidarMeshRef.current.updateMatrixWorld(true);
    }

    if (proxyMeshRef.current) {
      proxyMeshRef.current.updateMatrixWorld(true);
    }
  });

  if (!lidarMeshRef.current) return null;

  return (
    <group ref={ref} rotation={[0, Math.PI, 0]} position={[0, -1.6, 0]}>
      <primitive object={lidarMeshRef.current} material={fxMaterial} />

      {proxyMeshRef.current && (
        <primitive object={proxyMeshRef.current} visible={false} />
      )}
    </group>
  );
});

export default LiDARRoom;