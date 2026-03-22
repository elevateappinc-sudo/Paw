"use client";
/**
 * F1c — Background migration of base64 pet photos → Supabase Storage.
 *
 * Flow:
 *  1. Check users.migration_completed — if true, no-op.
 *  2. Read localStorage paw-store-v3 and collect base64 photos.
 *  3. Per photo: decode → Blob, validate ≤ 25 MB, upload to Storage,
 *     insert row in pet_photos.
 *  4. On full success → mark migration_completed = true.
 *  5. On any failure → keep base64 as fallback, migration_completed stays false.
 */

import { createClient } from "@/lib/supabase/client";
import { v4 as uuidv4 } from "uuid";

const STORE_KEY = "paw-store-v3";
const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

/** Decode a base64 data URL into a Blob + extension */
function dataUrlToBlob(dataUrl: string): { blob: Blob; ext: string } | null {
  try {
    const [header, b64] = dataUrl.split(",");
    if (!b64) return null;
    const mime = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";
    const ext = mime.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return { blob: new Blob([bytes], { type: mime }), ext };
  } catch {
    return null;
  }
}

export async function runPhotoMigration(userId: string): Promise<void> {
  const supabase = createClient();

  // 1 — Check migration flag
  const { data: userRow } = await supabase
    .from("users")
    .select("migration_completed")
    .eq("id", userId)
    .single();

  if (userRow?.migration_completed === true) return;

  // 2 — Read localStorage
  let storeRaw: string | null = null;
  try {
    storeRaw = localStorage.getItem(STORE_KEY);
  } catch {
    return; // no localStorage (SSR guard)
  }
  if (!storeRaw) {
    // Nothing to migrate — mark done
    await supabase.from("users").update({ migration_completed: true }).eq("id", userId);
    return;
  }

  let store: { state?: { pets?: Array<{ id: string; photos?: string[] }> } };
  try {
    store = JSON.parse(storeRaw);
  } catch {
    return;
  }

  const pets = store?.state?.pets ?? [];
  let allSucceeded = true;

  for (const pet of pets) {
    const photos = pet.photos ?? [];
    for (const photo of photos) {
      if (!photo.startsWith("data:image/")) continue; // skip non-base64

      const parsed = dataUrlToBlob(photo);
      if (!parsed) { allSucceeded = false; continue; }

      const { blob, ext } = parsed;

      // Validate size
      if (blob.size > MAX_BYTES) {
        // Mark failed — insert row with failure flag
        await supabase.from("pet_photos").insert({
          pet_id: pet.id,
          user_id: userId,
          storage_path: "",
          photo_url: "",
          photo_migration_failed: true,
          original_filename: `oversized.${ext}`,
        });
        allSucceeded = false;
        continue;
      }

      const photoId = uuidv4();
      const storagePath = `${userId}/${pet.id}/${photoId}.${ext}`;

      // Upload to Storage
      const { error: uploadErr } = await supabase.storage
        .from("paw-photos")
        .upload(storagePath, blob, { contentType: blob.type, upsert: false });

      if (uploadErr) {
        allSucceeded = false;
        continue;
      }

      // Get signed URL (1h) for initial storage
      const { data: signedData } = await supabase.storage
        .from("paw-photos")
        .createSignedUrl(storagePath, 3600);

      // Insert pet_photos row
      const { error: insertErr } = await supabase.from("pet_photos").insert({
        id: photoId,
        pet_id: pet.id,
        user_id: userId,
        storage_path: storagePath,
        photo_url: signedData?.signedUrl ?? storagePath,
        photo_migration_failed: false,
      });

      if (insertErr) {
        // Rollback storage upload on DB failure
        await supabase.storage.from("paw-photos").remove([storagePath]);
        allSucceeded = false;
      }
    }
  }

  // 5 — Mark migration complete only if all photos succeeded
  if (allSucceeded) {
    await supabase.from("users").update({ migration_completed: true }).eq("id", userId);
  }
}
