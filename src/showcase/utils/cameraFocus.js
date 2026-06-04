import * as THREE from "three";

export function getFocusCameraPose(
  mesh,
  camera,
  distance = 1.6,
  yOffset = 0.15,
  targetYOffset = 0
) {
  const worldPosition = new THREE.Vector3();
  const worldQuaternion = new THREE.Quaternion();
  const worldScale = new THREE.Vector3();

  mesh.updateMatrixWorld(true);
  mesh.matrixWorld.decompose(worldPosition, worldQuaternion, worldScale);

  const normal = new THREE.Vector3(0, 0, 1)
    .applyQuaternion(worldQuaternion)
    .normalize();

  const target = worldPosition.clone();
  target.y += targetYOffset;

  const cameraPosition = worldPosition
    .clone()
    .add(normal.multiplyScalar(distance));

  cameraPosition.y += yOffset;

  return {
    position: cameraPosition.toArray(),
    target: target.toArray(),
  };
}