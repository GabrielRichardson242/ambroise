import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useThree, useFrame } from "@react-three/fiber";
import { useLiDAR } from "../context/LiDARContext";
import { useFxStore } from "../state/useFxStore";

// Base target for point cloud; you can override with UPSAMPLE_FACTOR
const BASE_MAX_POINTS = 400_000;
// Set how many random samples per triangle (1 = original density)
const UPSAMPLE_FACTOR = 6; // try 2, 5, 8, 10 for 200k, 400k, etc.

export default function PointRoom() {
  const { camera } = useThree();
  const { lidarMeshRef } = useLiDAR();
  const { fx } = useFxStore();

  const geomRef = useRef();
  const matRef = useRef();

  // -----------------------------
  // Build positions + colors
  // -----------------------------
  const { positions, sampledColors } = useMemo(() => {
    if (!lidarMeshRef.current)
      return { positions: null, sampledColors: null };

    // Ensure all textures are loaded
    let allReady = true;
    lidarMeshRef.current.traverse((o) => {
      const tex = o.material?.map;
      if (tex && !tex.image) allReady = false;
    });
    if (!allReady) return { positions: null, sampledColors: null };

    const collector = [];
    const colors = [];
    const vA = new THREE.Vector3();
    const vB = new THREE.Vector3();
    const vC = new THREE.Vector3();
    const uvA = new THREE.Vector2();
    const uvB = new THREE.Vector2();
    const uvC = new THREE.Vector2();
    const color = new THREE.Color();

    // Traverse scene meshes
    lidarMeshRef.current.traverse((o) => {
      if (!o.isMesh || !o.geometry?.attributes?.position) return;

      const geom = o.geometry;
      const posAttr = geom.attributes.position;
      const uvAttr = geom.attributes.uv;
      const index = geom.index;
      const m = o.matrixWorld;

      // Load texture pixels if available
      const tex = o.material?.map;
      let data, width, height;
      if (tex?.image) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = tex.image.width;
        canvas.height = tex.image.height;
        ctx.drawImage(tex.image, 0, 0);
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        data = img.data;
        width = canvas.width;
        height = canvas.height;
      }

      // Skip if no index (not a triangle mesh)
      if (!index) return;

      // For each triangle in mesh
      for (let f = 0; f < index.count; f += 3) {
        const a = index.getX(f);
        const b = index.getX(f + 1);
        const c = index.getX(f + 2);

        vA.fromBufferAttribute(posAttr, a).applyMatrix4(m);
        vB.fromBufferAttribute(posAttr, b).applyMatrix4(m);
        vC.fromBufferAttribute(posAttr, c).applyMatrix4(m);

        if (uvAttr) {
          uvA.fromBufferAttribute(uvAttr, a);
          uvB.fromBufferAttribute(uvAttr, b);
          uvC.fromBufferAttribute(uvAttr, c);
        }

        // Randomly sample N points inside triangle
        for (let n = 0; n < UPSAMPLE_FACTOR; n++) {
          const r1 = Math.random();
          const r2 = Math.random();
          const sqrtR1 = Math.sqrt(r1);
          const u = 1 - sqrtR1;
          const v = r2 * sqrtR1;
          const w = 1 - u - v;

          const p = new THREE.Vector3()
            .addScaledVector(vA, u)
            .addScaledVector(vB, v)
            .addScaledVector(vC, w);

          collector.push(p.x, p.y, p.z);

          // Sample texture colour if available
          if (data && uvAttr) {
            const uvx = u * uvA.x + v * uvB.x + w * uvC.x;
            const uvy = u * uvA.y + v * uvB.y + w * uvC.y;
            const x = Math.floor(uvx * (width - 1));
            const y = Math.floor((1 - uvy) * (height - 1));
            const idx = (y * width + x) * 4;
            color.setRGB(
              data[idx] / 255,
              data[idx + 1] / 255,
              data[idx + 2] / 255
            );
            colors.push(color.r, color.g, color.b);
          } else {
            colors.push(0.6, 0.6, 0.6);
          }
        }
      }
    });

    const total = collector.length / 3;
    if (total === 0)
      return { positions: null, sampledColors: null };

    const target = Math.min(total, BASE_MAX_POINTS);
    const positions = new Float32Array(target * 3);
    const sampledColors = new Float32Array(target * 3);

    for (let i = 0; i < target; i++) {
      const idx = Math.floor(Math.random() * total);
      positions.set(collector.slice(idx * 3, idx * 3 + 3), i * 3);
      sampledColors.set(colors.slice(idx * 3, idx * 3 + 3), i * 3);
    }

    console.log(
      `✅ PointRoom: ${target.toLocaleString()} points generated from ${total.toLocaleString()} barycentric samples`
    );

    return { positions, sampledColors };
  }, [lidarMeshRef.current]);

  // -----------------------------
  // Geometry
  // -----------------------------
  const geometry = useMemo(() => {
    if (!positions) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("color", new THREE.BufferAttribute(sampledColors, 3));
    return g;
  }, [positions, sampledColors]);

  // -----------------------------
  // Shader Material
  // -----------------------------
  const material = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthTest: true,
      blending: THREE.NormalBlending,
      vertexColors: true,
      uniforms: {
        uPointSize: { value: fx.pointSize },
        uDensity: { value: fx.pointDensity },
        uFill: { value: fx.fill },
        uTint: { value: new THREE.Color(fx.hue) },
        uAlpha: { value: fx.transparency },
        uUseTint: { calue: fx.useTint ? 1.0 : 0.0 },
        uViewMatrix: { value: new THREE.Matrix4() },
        uProjectionMatrix: { value: new THREE.Matrix4() },
        uCenterView: { value: new THREE.Vector2(0, 0) },
      },
      vertexShader: `
        precision highp float;
        uniform float uPointSize;
        uniform float uDensity;
        uniform float uFill;
        uniform mat4  uViewMatrix;
        uniform mat4  uProjectionMatrix;
        uniform vec2  uCenterView;
        varying vec3 vColor;
        varying float vMask;


        float hash1(float n){ return fract(sin(n)*43758.5453123); }

        void main() {
          vColor = color; // use built in attribute
          vec4 viewPos = uViewMatrix * vec4(position, 1.0);
          vec4 clipPos = uProjectionMatrix * viewPos;

          vec2 ndc = clipPos.xy / max(clipPos.w, 1e-6);
          float r = length(ndc - uCenterView);

          float radialKeep = smoothstep(uFill + 0.02, uFill - 0.02, r);
          float id = float(gl_VertexID);
          float keep = step(hash1(id), uDensity);

          vMask = radialKeep * keep;
          gl_Position = clipPos;
          gl_PointSize = uPointSize / max(0.5, clipPos.w);
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform vec3  uTint;
        uniform float uAlpha;
        uniform float uUseTint; // uniform toggle
        varying vec3  vColor;
        varying float vMask;

        void main() {
          vec2 c = gl_PointCoord * 2.0 - 1.0;
          float m = 1.0 - dot(c, c);
          if (m <= 0.0 || vMask <= 0.0) discard;

          vec3 finalColor = mix(vColor, vColor * uTint, uUseTint);
          float alpha = uAlpha * clamp(m, 0.0, 1.0) * vMask;
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
    });
    return mat;
  }, []);

  // -----------------------------
  // Live updates
  // -----------------------------
  useFrame(() => {
    if (!matRef.current) return;
    const m = matRef.current.uniforms;
    m.uPointSize.value = fx.pointSize;
    m.uDensity.value = fx.pointDensity;
    m.uFill.value = fx.fill;
    m.uTint.value.set(fx.hue);
    m.uAlpha.value = fx.transparency;
    m.uUseTint.calue = fx.useTint ? 1.0 : 0.0;
    m.uViewMatrix.value.copy(camera.matrixWorldInverse);
    m.uProjectionMatrix.value.copy(camera.projectionMatrix);
  });

  if (!geometry) return null;

  return (
    <points geometry={geometry} ref={geomRef}>
      <primitive object={material} ref={matRef} attach="material" />
    </points>
  );
}