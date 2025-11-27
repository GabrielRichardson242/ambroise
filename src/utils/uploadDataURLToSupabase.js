import { supabase } from "../lib/supabaseClient";
import { dataURLToFile } from "./screenshot";

export async function uploadThumbnail(dataURL, roomId) {
  console.log("[uploadThumbnail] start", { roomId });

  if (!dataURL) {
    console.error("[uploadThumbnail] No dataURL");
    return null;
  }

  const file = dataURLToFile(dataURL, `${crypto.randomUUID()}.png`);
  const filePath = `${roomId}/${file.name}`;

  console.log("[uploadThumbnail] uploading to", filePath);

  const { error } = await supabase
    .storage
    .from("thumbnails")
    .upload(filePath, file, {
      contentType: "image/png",
      upsert: true,
    });

  if (error) {
    console.error("[uploadThumbnail] FAILED:", error);
    return null;
  }

  const { data } = supabase
    .storage
    .from("thumbnails")
    .getPublicUrl(filePath);

  console.log("[uploadThumbnail] success. URL:", data.publicUrl);
  return data.publicUrl;
}