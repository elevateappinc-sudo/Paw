"use client";
/**
 * F1c — PetPhotos component.
 * Reads photos from Supabase Storage via signed URLs (usePetPhotos hook).
 * New uploads go directly to Storage — never base64.
 * Shows loading skeleton while signing, broken-image icon on error.
 */

import { useRef, useState } from "react";
import { Camera, X, ChevronLeft, ChevronRight, Trash2, ImagePlus, ImageOff } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { usePetPhotos } from "@/hooks/usePetPhotos";
import { uploadPetPhoto } from "@/lib/storage/uploadPhoto";
import { createClient } from "@/lib/supabase/client";

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";
const MAX_PHOTOS = 20;

/* ─── Skeleton tile ──────────────────────────────────────────────────────── */
function SkeletonTile() {
  return (
    <div style={{
      aspectRatio: "1", borderRadius: 10,
      background: "rgba(255,255,255,0.06)",
      animation: "pulse 1.4s ease-in-out infinite",
    }} />
  );
}

/* ─── Broken-image tile ──────────────────────────────────────────────────── */
function BrokenTile({ accentColor }: { accentColor: string }) {
  return (
    <div style={{
      aspectRatio: "1", borderRadius: 10,
      background: "rgba(255,69,58,0.08)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <ImageOff size={22} color="rgba(255,69,58,0.6)" />
    </div>
  );
}

/* ─── Props ──────────────────────────────────────────────────────────────── */
interface PetPhotosProps {
  petId: string;
  /** Legacy base64 photos still in store — shown while migration hasn't run yet */
  legacyPhotos?: string[];
  accentColor: string;
  canEdit: boolean;
}

/* ─── Component ──────────────────────────────────────────────────────────── */
export function PetPhotos({ petId, legacyPhotos = [], accentColor, canEdit }: PetPhotosProps) {
  const { user } = useAuthContext();
  const { photos, loading, refetch } = usePetPhotos(petId);
  const inputRef = useRef<HTMLInputElement>(null);
  const [viewer, setViewer] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // ── Upload handler ────────────────────────────────────────────────────────
  async function handleFiles(files: FileList | null) {
    if (!files || !user) return;
    setUploading(true);
    setUploadError(null);

    for (const file of Array.from(files)) {
      if (photos.length >= MAX_PHOTOS) break;
      try {
        await uploadPetPhoto(file, petId, user.id);
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Error al subir foto");
        break;
      }
    }

    await refetch();
    setUploading(false);
  }

  // ── Delete handler ────────────────────────────────────────────────────────
  async function handleDelete(photoId: string, storagePath: string) {
    const supabase = createClient();
    // Remove from storage
    if (storagePath) {
      await supabase.storage.from("paw-photos").remove([storagePath]);
    }
    // Remove DB row
    await supabase.from("pet_photos").delete().eq("id", photoId);
    await refetch();
    // Close viewer if it was last photo
    if (photos.length <= 1) setViewer(null);
    else if (viewer !== null) setViewer(Math.min(viewer, photos.length - 2));
  }

  // ── Decide which photo list to render ────────────────────────────────────
  // If Supabase photos exist, use them. Fallback to legacy base64 for migration period.
  const hasSupabasePhotos = photos.length > 0;
  const displayPhotos = hasSupabasePhotos ? photos : legacyPhotos.map((url, i) => ({
    id: `legacy-${i}`,
    storagePath: "",
    signedUrl: url,
    migrationFailed: false,
  }));

  function prev() { setViewer((v) => (v !== null && v > 0 ? v - 1 : displayPhotos.length - 1)); }
  function next() { setViewer((v) => (v !== null && v < displayPhotos.length - 1 ? v + 1 : 0)); }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>

      {/* ── Grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 3 }}>

        {/* Loading skeletons */}
        {loading && Array.from({ length: 3 }).map((_, i) => <SkeletonTile key={`skel-${i}`} />)}

        {/* Photo tiles */}
        {!loading && displayPhotos.map((photo, i) => (
          <div
            key={photo.id}
            style={{ position: "relative", aspectRatio: "1", overflow: "hidden", borderRadius: 10, cursor: "pointer" }}
            onClick={() => !photo.migrationFailed && setViewer(i)}
          >
            {photo.migrationFailed || !photo.signedUrl ? (
              <BrokenTile accentColor={accentColor} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo.signedUrl}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            )}

            {canEdit && hasSupabasePhotos && (
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(photo.id, photo.storagePath); }}
                style={{
                  position: "absolute", top: 5, right: 5,
                  width: 22, height: 22, borderRadius: "50%",
                  background: "rgba(0,0,0,0.6)", border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                <X size={12} color="#fff" />
              </button>
            )}
          </div>
        ))}

        {/* Add button */}
        {canEdit && !loading && displayPhotos.length < MAX_PHOTOS && (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            style={{
              aspectRatio: "1", borderRadius: 10, border: `2px dashed rgba(255,255,255,0.15)`,
              background: "rgba(255,255,255,0.04)", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
              opacity: uploading ? 0.5 : 1,
            }}>
            {uploading
              ? <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${accentColor}`, borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
              : <ImagePlus size={22} color={accentColor} />}
            <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(235,235,245,0.4)", fontFamily: FONT }}>
              {uploading ? "..." : "Agregar"}
            </span>
          </button>
        )}
      </div>

      {/* Upload error */}
      {uploadError && (
        <p style={{ fontSize: 13, color: "#ff453a", marginTop: 8, fontFamily: FONT }}>{uploadError}</p>
      )}

      {/* Empty state */}
      {!loading && displayPhotos.length === 0 && canEdit && (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{
            width: "100%", padding: "32px 20px", borderRadius: 14,
            border: `2px dashed rgba(255,255,255,0.1)`, background: "rgba(255,255,255,0.03)",
            cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
          }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: `${accentColor}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Camera size={24} color={accentColor} />
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: 0, fontFamily: FONT }}>Agregar fotos</p>
            <p style={{ fontSize: 13, color: "rgba(235,235,245,0.4)", margin: "4px 0 0", fontFamily: FONT }}>
              Toca para seleccionar desde tu galería
            </p>
          </div>
        </button>
      )}

      {!loading && displayPhotos.length === 0 && !canEdit && (
        <p style={{ textAlign: "center", padding: "32px 0", fontSize: 14, color: "rgba(235,235,245,0.3)", fontFamily: FONT }}>
          Sin fotos aún
        </p>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
        onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
      />

      {/* ── Fullscreen viewer ── */}
      {viewer !== null && displayPhotos[viewer] && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.95)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
          onClick={() => setViewer(null)}>

          {/* Header */}
          <div
            style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)" }}
            onClick={(e) => e.stopPropagation()}>
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", fontFamily: FONT }}>
              {viewer + 1} / {displayPhotos.length}
            </span>
            <div style={{ display: "flex", gap: 10 }}>
              {canEdit && hasSupabasePhotos && (
                <button
                  onClick={() => handleDelete(displayPhotos[viewer].id, displayPhotos[viewer].storagePath)}
                  style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,69,58,0.2)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Trash2 size={16} color="#ff453a" />
                </button>
              )}
              <button onClick={() => setViewer(null)}
                style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={18} color="#fff" />
              </button>
            </div>
          </div>

          {/* Image */}
          <div style={{ maxWidth: "100vw", maxHeight: "80dvh", padding: "0 60px" }} onClick={(e) => e.stopPropagation()}>
            {displayPhotos[viewer].migrationFailed || !displayPhotos[viewer].signedUrl ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <ImageOff size={48} color="rgba(255,69,58,0.5)" />
                <p style={{ color: "rgba(255,255,255,0.4)", fontFamily: FONT, fontSize: 14 }}>
                  No se pudo cargar la foto
                </p>
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayPhotos[viewer].signedUrl}
                alt=""
                style={{ maxWidth: "100%", maxHeight: "80dvh", objectFit: "contain", borderRadius: 12 }}
              />
            )}
          </div>

          {/* Prev/Next */}
          {displayPhotos.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); prev(); }}
                style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ChevronLeft size={22} color="#fff" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); next(); }}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ChevronRight size={22} color="#fff" />
              </button>
            </>
          )}

          {/* Dot indicators */}
          {displayPhotos.length > 1 && displayPhotos.length <= 12 && (
            <div style={{ position: "absolute", bottom: 24, display: "flex", gap: 6 }}>
              {displayPhotos.map((_, i) => (
                <div key={i} onClick={(e) => { e.stopPropagation(); setViewer(i); }}
                  style={{ width: viewer === i ? 18 : 7, height: 7, borderRadius: 999, background: viewer === i ? "#fff" : "rgba(255,255,255,0.3)", cursor: "pointer", transition: "all 0.2s" }} />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
