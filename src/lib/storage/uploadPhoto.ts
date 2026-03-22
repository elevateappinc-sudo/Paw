"use client";
/**
 * F1c — Upload a new pet photo directly to Supabase Storage.
 * Never stores base64. Validates size and MIME type.
 */

import { createClient } from "@/lib/supabase/client";
import { v4 as uuidv4 } from "uuid";

const MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export interface UploadPhotoResult {
  id: string;
  storagePath: string;
  signedUrl: string;
}

export async function uploadPetPhoto(
  file: File,
  petId: string,
  userId: string
): Promise<UploadPhotoResult> {
  // Validate
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Formato no permitido: ${file.type}. Use jpg, png o webp.`);
  }
  if (file.size > MAX_BYTES) {
    throw new Error("La foto supera el límite de 25 MB.");
  }

  const supabase = createClient();
  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const photoId = uuidv4();
  const storagePath = `${userId}/${petId}/${photoId}.${ext}`;

  // Upload
  const { error: uploadErr } = await supabase.storage
    .from("paw-photos")
    .upload(storagePath, file, { contentType: file.type, upsert: false });

  if (uploadErr) throw new Error(`Error al subir foto: ${uploadErr.message}`);

  // Signed URL (1h)
  const { data: signedData, error: signErr } = await supabase.storage
    .from("paw-photos")
    .createSignedUrl(storagePath, 3600);

  if (signErr || !signedData) throw new Error("No se pudo generar URL firmada.");

  // Insert DB row
  const { error: dbErr } = await supabase.from("pet_photos").insert({
    id: photoId,
    pet_id: petId,
    user_id: userId,
    storage_path: storagePath,
    photo_url: signedData.signedUrl,
    photo_migration_failed: false,
    original_filename: file.name,
  });

  if (dbErr) {
    // Rollback
    await supabase.storage.from("paw-photos").remove([storagePath]);
    throw new Error(`Error al guardar foto: ${dbErr.message}`);
  }

  return { id: photoId, storagePath, signedUrl: signedData.signedUrl };
}
