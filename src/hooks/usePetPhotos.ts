"use client";
/**
 * F1c — Hook that fetches signed URLs for a pet's photos from Supabase.
 * Regenerates signed URLs on each mount (TTL: 1 hour).
 */

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface PetPhotoEntry {
  id: string;
  storagePath: string;
  signedUrl: string;
  migrationFailed: boolean;
}

export function usePetPhotos(petId: string | null) {
  const [photos, setPhotos] = useState<PetPhotoEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPhotos = useCallback(async () => {
    if (!petId) { setPhotos([]); return; }

    setLoading(true);
    setError(null);

    const supabase = createClient();

    // Fetch rows from pet_photos
    const { data: rows, error: fetchErr } = await supabase
      .from("pet_photos")
      .select("id, storage_path, photo_migration_failed")
      .eq("pet_id", petId)
      .order("created_at", { ascending: true });

    if (fetchErr) {
      setError(fetchErr.message);
      setLoading(false);
      return;
    }

    if (!rows || rows.length === 0) {
      setPhotos([]);
      setLoading(false);
      return;
    }

    // Generate signed URLs for non-failed photos
    const results: PetPhotoEntry[] = [];

    for (const row of rows) {
      if (row.photo_migration_failed || !row.storage_path) {
        results.push({
          id: row.id,
          storagePath: row.storage_path ?? "",
          signedUrl: "",
          migrationFailed: true,
        });
        continue;
      }

      const { data: signed, error: signErr } = await supabase.storage
        .from("paw-photos")
        .createSignedUrl(row.storage_path, 3600);

      results.push({
        id: row.id,
        storagePath: row.storage_path,
        signedUrl: signErr || !signed ? "" : signed.signedUrl,
        migrationFailed: !!signErr,
      });
    }

    setPhotos(results);
    setLoading(false);
  }, [petId]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  return { photos, loading, error, refetch: fetchPhotos };
}
