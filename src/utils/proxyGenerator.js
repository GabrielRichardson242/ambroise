import * as THREE from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { SimplifyModifier } from "three/examples/jsm/modifiers/SimplifyModifier.js";

/**
 * Create a simplified, smoothed, and slightly inflated proxy mesh
 * from a loaded GLTF/GLB scene.
 *
 * This proxy mesh is used for snapping, raycasting, and dragging posters
 * instead of the raw, complex LiDAR mesh.
 *
 * @param {THREE.Scene} scene - The imported GLTF/GLB scene.
 * @param {Object} [options]
 * @param {number} [options.simplifyRatio=0.05] - Fraction of vertices to keep.
 * @param {number} [options.inflateDistance=0.02] - How far to push vertices along normals (meters).
 * @returns {THREE.Mesh} - The proxy collider mesh.
 */
export function createProxyMeshFromScene(
  scene,
  { simplifyRatio = 0.05, inflateDistance = 0.02 } = {}
) {
  const geometries = [];

  // Collect all mesh geometries in the scene
  scene.traverse((o) => {
    if (o.isMesh && o.geometry) {
      const g = o.geometry.clone();
      g.applyMatrix4(o.matrixWorld); // bake transforms
      geometries.push(g);
    }
  });

  if (!geometries.length) throw new Error("No mesh geometry found in GLB scene.");

  // Merge into a single geometry (handles both old and new Three.js versions)
  const mergeFn =
    BufferGeometryUtils.mergeBufferGeometries ||
    BufferGeometryUtils.mergeGeometries;

  if (!mergeFn)
    throw new Error("mergeBufferGeometries not found in BufferGeometryUtils");

  const merged = mergeFn(geometries, true);

  // Simplify geometry to reduce vertex count
  const modifier = new SimplifyModifier();
  const targetCount = Math.max(
    1000,
    Math.floor(merged.attributes.position.count * simplifyRatio)
  );
  const simplified = modifier.modify(merged, targetCount);

  // Recalculate normals for inflation
  simplified.computeVertexNormals();

  // --- Inflate geometry along its vertex normals ---
  const pos = simplified.attributes.position;
  const norm = simplified.attributes.normal;
  for (let i = 0; i < pos.count; i++) {
    pos.setXYZ(
      i,
      pos.getX(i) + norm.getX(i) * inflateDistance,
      pos.getY(i) + norm.getY(i) * inflateDistance,
      pos.getZ(i) + norm.getZ(i) * inflateDistance
    );
  }
  pos.needsUpdate = true;
  simplified.computeBoundingBox();
  simplified.computeBoundingSphere();
  // ------------------------------------------------

  // Create invisible proxy mesh
  const proxy = new THREE.Mesh(
    simplified,
    new THREE.MeshNormalMaterial({
      wireframe: true,
      transparent: true,
      opacity: 0.4,
      depthTest: true,
    })
  );
  proxy.name = "ProxyCollider";

  return proxy;
}