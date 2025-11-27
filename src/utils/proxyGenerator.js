import * as THREE from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { SimplifyModifier } from "three/examples/jsm/modifiers/SimplifyModifier.js";

/**
 * @param {THREE.Scene} scene
 * @param {Object} [options]
 * @param {number} [options.simplifyRatio=0.05]
 * @param {number} [options.inflateDistance=0.02]
 * @returns {THREE.Mesh}
 */
export function createProxyMeshFromScene(
  scene,
  { simplifyRatio = 0.05, inflateDistance = 0.001 } = {}
) {
  const geometries = [];

  // Collect and bake transforms
  scene.traverse((o) => {
    if (o.isMesh && o.geometry) {
      const g = o.geometry.clone();
      g.applyMatrix4(o.matrixWorld);
      geometries.push(g);
    }
  });

  if (!geometries.length) throw new Error("No mesh geometry found in GLB scene.");

  const mergeFn =
    BufferGeometryUtils.mergeBufferGeometries ||
    BufferGeometryUtils.mergeGeometries;

  if (!mergeFn) throw new Error("mergeBufferGeometries not found.");

  const merged = mergeFn(geometries, true);

  // Simplify
  const modifier = new SimplifyModifier();
  const targetCount = Math.max(
    1000,
    Math.floor(merged.attributes.position.count * simplifyRatio)
  );
  const simplified = modifier.modify(merged, targetCount);
  simplified.computeVertexNormals();

  // Base inflation
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