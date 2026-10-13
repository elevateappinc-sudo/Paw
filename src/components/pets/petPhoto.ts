import { createClient } from "@/lib/supabase/client";

const BUCKET = "pet-photos";
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

/**
 * Sube la foto de perfil de la mascota al bucket público `pet-photos`
 * y devuelve la URL pública para guardar en `pets.photo_url`.
 * (uploadPetPhoto de lib/storage usa URLs firmadas de 1 h; no sirve para el perfil.)
 */
export async function uploadPetProfilePhoto(file: File, petId: string, userId: string): Promise<string> {
  if (!ALLOWED.includes(file.type)) throw new Error("Usa una imagen jpg, png o webp");
  if (file.size > MAX_BYTES) throw new Error("La foto supera los 10 MB");
  const supabase = createClient();
  const ext = (file.type.split("/")[1] ?? "jpg").replace("jpeg", "jpg");
  const path = `${userId}/${petId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
