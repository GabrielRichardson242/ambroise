import * as THREE from "three";
import { barycentricFromUV, worldFromBary, jacobianUVtoWorld } from "./barycentricUtils";

// Existing buildUvLookup stays as-is (unused for core runtime in this pass)
export function buildUvLookup(geometry) {
  const pos = geometry.attributes.position.array;
  const uv = geometry.attributes.uv?.array;
  if (!uv) return null;
  const map = [];
  for (let i = 0; i < uv.length; i += 2) {
    map.push({
      u: uv[i],
      v: uv[i + 1],
      x: pos[(i / 2) * 3],
      y: pos[(i / 2) * 3 + 1],
      z: pos[(i / 2) * 3 + 2],
    });
  }
  return map;
}

// Fetch triangle indices (a,b,c) and attributes
export function getTriangleData(geometry, triIndex) {
  const indexAttr = geometry.index;
  const posAttr = geometry.attributes.position;
  const uvAttr  = geometry.attributes.uv;

  if (!indexAttr || !uvAttr) return null;

  const a = indexAttr.getX(triIndex * 3 + 0);
  const b = indexAttr.getX(triIndex * 3 + 1);
  const c = indexAttr.getX(triIndex * 3 + 2);

  const pA = new THREE.Vector3().fromBufferAttribute(posAttr, a);
  const pB = new THREE.Vector3().fromBufferAttribute(posAttr, b);
  const pC = new THREE.Vector3().fromBufferAttribute(posAttr, c);

  const uvA = new THREE.Vector2().fromBufferAttribute(uvAttr, a);
  const uvB = new THREE.Vector2().fromBufferAttribute(uvAttr, b);
  const uvC = new THREE.Vector2().fromBufferAttribute(uvAttr, c);

  return { a, b, c, pA, pB, pC, uvA, uvB, uvC };
}

// UV → world on a specific triangle of a specific mesh (applies mesh.matrixWorld)
export function worldFromUVOnMesh(mesh, triIndex, uv) {
  const geom = mesh.geometry;
  const tri = getTriangleData(geom, triIndex);
  if (!tri) return null;

  const { wA, wB, wC } = barycentricFromUV(uv, tri.uvA, tri.uvB, tri.uvC);
  const localPos = worldFromBary({ wA, wB, wC }, tri.pA, tri.pB, tri.pC);

  const worldPos = localPos.clone().applyMatrix4(mesh.matrixWorld);

  // Normal from triangle (in world space)
  const e0 = new THREE.Vector3().subVectors(tri.pB, tri.pA);
  const e1 = new THREE.Vector3().subVectors(tri.pC, tri.pA);
  const localNormal = new THREE.Vector3().crossVectors(e0, e1).normalize();
  const worldNormal = localNormal.clone().transformDirection(mesh.matrixWorld).normalize();

  // Jacobian (for screen→UV scaling if desired)
  const { Pu, Pv } = jacobianUVtoWorld(tri.uvA, tri.uvB, tri.uvC, tri.pA, tri.pB, tri.pC);
  const worldPu = Pu.clone().applyMatrix3(new THREE.Matrix3().setFromMatrix4(mesh.matrixWorld));
  const worldPv = Pv.clone().applyMatrix3(new THREE.Matrix3().setFromMatrix4(mesh.matrixWorld));

  return { worldPos, worldNormal, worldPu, worldPv };
}