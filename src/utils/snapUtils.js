import * as THREE from 'three';

export async function generateSnapData(camera, lidarObject) {
  return new Promise((resolve) => {
    if (!camera) {
      console.error("❌ No camera passed to generateSnapData");
      resolve(null);
      return;
    }

    if (!lidarObject) {
      console.error("❌ No lidarObject passed to generateSnapData");
      resolve(null);
      return;
    }

    console.log("🔍 Running snap raycasts...");

    const raycaster = new THREE.Raycaster();
    const attempts = [
      [0, 0],
      [-0.1, 0], [0.1, 0], [0, -0.1], [0, 0.1],
      [-0.1, -0.1], [0.1, 0.1], [-0.1, 0.1], [0.1, -0.1],
    ];

    let hit = null;

    for (let [x, y] of attempts) {
      const mouse = new THREE.Vector2(x, y);
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(lidarObject, true);

      console.log(`🔸 Raycast at (${x}, ${y}) hit count:`, intersects.length);

      if (intersects.length > 0) {
        hit = intersects[0];
        break;
      }
    }

    if (!hit) {
      console.warn("⚠️ No mesh hit after multiple raycasts — placing at origin.");
      resolve(null);
      return;
    }

    // Convert local normal to world normal
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld);
    const worldNormal = hit.face?.normal?.clone()?.applyMatrix3(normalMatrix).normalize();

    if (!worldNormal) {
      console.warn("⚠️ Could not compute world normal, falling back to Z+");
    }

    const snapData = {
      point: hit.point.clone(),
      normal: worldNormal ?? new THREE.Vector3(0, 0, 1),
      object: hit.object,
    };

    console.log("✅ Snap data generated:", snapData);
    resolve(snapData);
  });
}