import { supabase } from "./supabaseClient";


export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadFile(
  bucket: string,
  path: string,
  file: File | Blob,
  options: {
    cacheControl?: string;
    upsert?: boolean;
    contentType?: string;
  } = {}
): Promise<void> {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: options.cacheControl ?? "3600",
    upsert: options.upsert ?? false,
    contentType: options.contentType ?? file.type,
  });

  if (error) throw error;
}

export async function uploadArrayBufferToScans(
  path: string,
  buffer: ArrayBuffer,
  contentType: string
): Promise<string> {
  const { error } = await supabase.storage
    .from("scans")
    .upload(path, new Blob([buffer]), { contentType, upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from("scans").getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadRawAndCompressed(
  roomId: string,
  rawFile: File,
  compressedBuffer: ArrayBuffer
) {
  const rawPath = `scans/${roomId}/raw/original.glb`;
  const dracoPath = `scans/${roomId}/compressed_draco.glb`;

  const [rawUrl, dracoUrl] = await Promise.all([
    uploadArrayBufferToScans(
      rawPath,
      await rawFile.arrayBuffer(),
      "model/gltf-binary"
    ),
    uploadArrayBufferToScans(
      dracoPath,
      compressedBuffer,
      "model/gltf-binary"
    ),
  ]);

  return { rawUrl, dracoUrl };
}