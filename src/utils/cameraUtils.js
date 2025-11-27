import * as THREE from "three";

export function frameRoomCamera(camera, mesh, factor = 1.2) {
  if (!camera || !mesh) return;

  const bbox = new THREE.Box3().setFromObject(mesh);
  const center = bbox.getCenter(new THREE.Vector3());
  const size = bbox.getSize(new THREE.Vector3());
  const diag = size.length();

  const yaw = Math.PI / 4; 
  const pitch = THREE.MathUtils.degToRad(25);

  const distance = diag * factor;

  const x = center.x + distance * Math.cos(pitch) * Math.cos(yaw);
  const y = center.y + distance * Math.sin(pitch);
  const z = center.z + distance * Math.cos(pitch) * Math.sin(yaw);

  camera.position.set(x, y, z);
  camera.lookAt(center);
  camera.updateProjectionMatrix();

  return { center, distance, size };
}