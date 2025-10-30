import { WebIO } from '@gltf-transform/core';
import { draco } from '@gltf-transform/functions';

// Quantisation parameters tuned for stable geometry and consistent poster alignment
const DRACO_OPTIONS = {
  encodeSpeed: 5,
  decodeSpeed: 5,
  quantizePosition: 14,
  quantizeNormal: 10,
  quantizeTexcoord: 12,
  quantizeColor: 8,
  quantizeGeneric: 12,
};

/**
 * Compress a GLB file in-memory using Draco.
 * @param arrayBuffer - Raw GLB bytes.
 * @returns Uint8Array containing the compressed GLB.
 */
export async function compressGlbToDraco(arrayBuffer: ArrayBuffer): Promise<Uint8Array> {
  const io = new WebIO({ credentials: 'include' });

  // Read original GLB into document
  const doc = await io.readBinary(new Uint8Array(arrayBuffer));

  // Apply Draco compression (v4 registers extension internally)
  await doc.transform(draco(DRACO_OPTIONS));

  // Write back to binary GLB
  const out = io.writeBinary(doc); // returns Uint8Array
  return out;
}