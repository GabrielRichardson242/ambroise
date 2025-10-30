import * as THREE from "three";

// Barycentric weights of a point P in UV-space wrt triangle (uvA, uvB, uvC)
export function barycentricFromUV(uvP, uvA, uvB, uvC) {
  const v0 = new THREE.Vector2().subVectors(uvB, uvA); // B - A
  const v1 = new THREE.Vector2().subVectors(uvC, uvA); // C - A
  const v2 = new THREE.Vector2().subVectors(uvP, uvA); // P - A

  const d00 = v0.dot(v0);
  const d01 = v0.dot(v1);
  const d11 = v1.dot(v1);
  const d20 = v2.dot(v0);
  const d21 = v2.dot(v1);

  const denom = d00 * d11 - d01 * d01;
  if (Math.abs(denom) < 1e-12) return { wA: 1, wB: 0, wC: 0 }; // degenerate

  const wB = (d11 * d20 - d01 * d21) / denom;
  const wC = (d00 * d21 - d01 * d20) / denom;
  const wA = 1 - wB - wC;
  return { wA, wB, wC };
}

// World point from barycentric weights
export function worldFromBary({ wA, wB, wC }, pA, pB, pC) {
  const out = new THREE.Vector3();
  out.addScaledVector(pA, wA);
  out.addScaledVector(pB, wB);
  out.addScaledVector(pC, wC);
  return out;
}

// Compute ∂P/∂u and ∂P/∂v (Jacobian) for uv→world mapping on one triangle
export function jacobianUVtoWorld(uvA, uvB, uvC, pA, pB, pC) {
  // U = [uvB-uvA, uvC-uvA]  (2x2), W = [pB-pA, pC-pA] (3x2)
  const U = new THREE.Matrix3(); // we’ll store as scalars
  const u0 = new THREE.Vector2().subVectors(uvB, uvA);
  const u1 = new THREE.Vector2().subVectors(uvC, uvA);

  const det = u0.x * u1.y - u0.y * u1.x;
  if (Math.abs(det) < 1e-12) {
    // degenerate UVs → fall back to identity-ish basis
    return { Pu: new THREE.Vector3(1,0,0), Pv: new THREE.Vector3(0,1,0) };
  }

  const inv00 =  u1.y / det;   // entries of U^{-1}
  const inv01 = -u0.y / det;
  const inv10 = -u1.x / det;
  const inv11 =  u0.x / det;

  const e0 = new THREE.Vector3().subVectors(pB, pA); // world edge for uvB-uvA
  const e1 = new THREE.Vector3().subVectors(pC, pA); // world edge for uvC-uvA

  // [Pu Pv] = [e0 e1] * U^{-1}
  const Pu = new THREE.Vector3().copy(e0).multiplyScalar(inv00).addScaledVector(e1, inv10);
  const Pv = new THREE.Vector3().copy(e0).multiplyScalar(inv01).addScaledVector(e1, inv11);
  return { Pu, Pv };
}