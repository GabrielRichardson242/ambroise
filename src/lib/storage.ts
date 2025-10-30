import { supabase } from './supabaseClient';

// Generic uploader
export async function uploadArrayBufferToScans(path: string, buffer: ArrayBuffer, contentType: string): Promise<string> {
  const { error } = await supabase.storage
    .from('scans')
    .upload(path, new Blob([buffer]), { contentType, upsert: true });
  if (error) throw error;

  const { data: pub } = supabase.storage.from('scans').getPublicUrl(path);
  return pub.publicUrl;
}

// Upload raw + compressed variants
export async function uploadRawAndCompressed(roomId: string, rawFile: File, compressedBuffer: ArrayBuffer) {
  const rawPath = `scans/${roomId}/raw/original.glb`;
  const dracoPath = `scans/${roomId}/compressed_draco.glb`;

  const [rawUrl, dracoUrl] = await Promise.all([
    // Raw likely private, but Supabase will still return a URL
    uploadArrayBufferToScans(rawPath, await rawFile.arrayBuffer(), 'model/gltf-binary'),
    uploadArrayBufferToScans(dracoPath, compressedBuffer, 'model/gltf-binary'),
  ]);

  return { rawUrl, dracoUrl };
}