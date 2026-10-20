"use client";
/**
 * PetPhotos — fotos de la mascota desde Supabase Storage (URLs firmadas vía usePetPhotos).
 * Las subidas nuevas van directo a Storage, nunca en base64.
 */

import { useRef, useState } from "react";
import { Camera, X, ChevronLeft, ChevronRight, Trash2, ImagePlus, ImageOff } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { usePetPhotos } from "@/hooks/usePetPhotos";
import { uploadPetPhoto } from "@/lib/storage/uploadPhoto";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { PawDotsLoader, Skeleton, showToast } from "@/components/ui";

const MAX_PHOTOS = 20;

function BrokenTile() {
  return (
    <div className="flex aspect-square items-center justify-center rounded-md bg-surface-elevated text-text-secondary" role="img" aria-label="Foto no disponible">
      <ImageOff size={22} />
    </div>
  );
}

interface PetPhotosProps {
  petId: string;
  /** Fotos base64 heredadas del store, visibles mientras no corra la migración */
  legacyPhotos?: string[];
  /** @deprecated los colores salen de los tokens */
  accentColor?: string;
  canEdit: boolean;
}

export function PetPhotos({ petId, legacyPhotos = [], canEdit }: PetPhotosProps) {
  const { user } = useAuthContext();
  const { photos, loading, refetch } = usePetPhotos(petId);
  const inputRef = useRef<HTMLInputElement>(null);
  const [viewer, setViewer] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || !user) return;
    setUploading(true);
    setUploadError(null);
    for (const file of Array.from(files)) {
      if (photos.length >= MAX_PHOTOS) break;
      try {
        await uploadPetPhoto(file, petId, user.id);
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "No se pudo subir la foto");
        break;
      }
    }
    await refetch();
    setUploading(false);
  }

  async function handleDelete(photoId: string, storagePath: string) {
    const supabase = createClient();
    if (storagePath) await supabase.storage.from("paw-photos").remove([storagePath]);
    const { error } = await supabase.from("pet_photos").delete().eq("id", photoId);
    if (error) showToast("No se pudo eliminar la foto", undefined, "error");
    await refetch();
    if (photos.length <= 1) setViewer(null);
    else if (viewer !== null) setViewer(Math.min(viewer, photos.length - 2));
  }

  const hasSupabasePhotos = photos.length > 0;
  const displayPhotos = hasSupabasePhotos
    ? photos
    : legacyPhotos.map((url, i) => ({ id: `legacy-${i}`, storagePath: "", signedUrl: url, migrationFailed: false }));

  function prev() {
    setViewer((v) => (v !== null && v > 0 ? v - 1 : displayPhotos.length - 1));
  }
  function next() {
    setViewer((v) => (v !== null && v < displayPhotos.length - 1 ? v + 1 : 0));
  }

  const current = viewer !== null ? displayPhotos[viewer] : null;

  return (
    <>
      <div className="grid grid-cols-3 gap-1">
        {loading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={`skel-${i}`} className="aspect-square rounded-md" />)}

        {!loading &&
          displayPhotos.map((photo, i) => (
            <div key={photo.id} className="relative aspect-square overflow-hidden rounded-md bg-surface-elevated">
              {photo.migrationFailed || !photo.signedUrl ? (
                <BrokenTile />
              ) : (
                <button type="button" onClick={() => setViewer(i)} aria-label={`Ver foto ${i + 1}`} className="block h-full w-full focus-visible:outline-2 focus-visible:outline-primary">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.signedUrl}
                    alt=""
                    loading="lazy"
                    className="block h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </button>
              )}
              {canEdit && hasSupabasePhotos && (
                <button
                  type="button"
                  onClick={() => void handleDelete(photo.id, photo.storagePath)}
                  aria-label={`Eliminar foto ${i + 1}`}
                  className="absolute top-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-text/70 text-bg after:absolute after:-inset-2 after:content-[''] active:scale-95"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}

        {canEdit && !loading && displayPhotos.length > 0 && displayPhotos.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            aria-busy={uploading || undefined}
            className="flex aspect-square flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border bg-surface-elevated text-primary-text disabled:opacity-50"
          >
            {uploading ? <PawDotsLoader size={20} label="Subiendo fotos" /> : <ImagePlus size={22} aria-hidden="true" />}
            <span className="text-label font-semibold text-text-secondary">{uploading ? "Subiendo" : "Agregar"}</span>
          </button>
        )}
      </div>

      {uploadError && (
        <p className="mt-2 text-small font-semibold text-overdue-text" role="alert">
          {uploadError}
        </p>
      )}

      {!loading && displayPhotos.length === 0 && canEdit && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex w-full flex-col items-center gap-3 rounded-md border-2 border-dashed border-border bg-surface-elevated px-6 py-8 disabled:opacity-50"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary-text">
            <Camera size={24} aria-hidden="true" />
          </span>
          <span className="text-subtitle font-semibold text-text">{uploading ? "Subiendo fotos" : "Agregar fotos"}</span>
          <span className="text-small text-text-secondary">Toca para elegir desde tu galería</span>
        </button>
      )}

      {!loading && displayPhotos.length === 0 && !canEdit && <p className="py-8 text-center text-body text-text-secondary">Sin fotos aún</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => void handleFiles(e.target.files)}
        onClick={(e) => {
          (e.target as HTMLInputElement).value = "";
        }}
      />

      {viewer !== null && current && (
        <div role="dialog" aria-modal="true" aria-label={`Foto ${viewer + 1} de ${displayPhotos.length}`} className="fixed inset-0 z-[55] flex flex-col items-center justify-center bg-text text-bg" onClick={() => setViewer(null)}>
          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-[max(16px,env(safe-area-inset-top))] pb-3" onClick={(e) => e.stopPropagation()}>
            <span className="text-small font-semibold text-bg/70">
              {viewer + 1} / {displayPhotos.length}
            </span>
            <div className="flex gap-2">
              {canEdit && hasSupabasePhotos && (
                <button type="button" onClick={() => void handleDelete(current.id, current.storagePath)} aria-label="Eliminar foto" className="flex h-11 w-11 items-center justify-center rounded-full bg-danger-soft text-danger-text active:scale-95">
                  <Trash2 size={18} />
                </button>
              )}
              <button type="button" onClick={() => setViewer(null)} aria-label="Cerrar" className="flex h-11 w-11 items-center justify-center rounded-full bg-bg/15 text-bg active:scale-95">
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="max-h-[80dvh] max-w-full px-14" onClick={(e) => e.stopPropagation()}>
            {current.migrationFailed || !current.signedUrl ? (
              <div className="flex flex-col items-center gap-3 text-bg/70">
                <ImageOff size={48} aria-hidden="true" />
                <p className="text-body">No se pudo cargar la foto</p>
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={current.signedUrl} alt="" className="max-h-[80dvh] max-w-full rounded-md object-contain" draggable={false} />
            )}
          </div>

          {displayPhotos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                aria-label="Foto anterior"
                className="absolute top-1/2 left-2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-bg/15 text-bg active:scale-95"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                aria-label="Foto siguiente"
                className="absolute top-1/2 right-2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-bg/15 text-bg active:scale-95"
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}

          {displayPhotos.length > 1 && displayPhotos.length <= 12 && (
            <div className="absolute bottom-[max(24px,env(safe-area-inset-bottom))] flex gap-2" role="tablist" aria-label="Fotos">
              {displayPhotos.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  role="tab"
                  aria-selected={viewer === i}
                  aria-label={`Foto ${i + 1}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewer(i);
                  }}
                  className={cn("relative h-2 rounded-full transition-opacity duration-200 after:absolute after:-inset-x-1 after:-inset-y-4 after:content-['']", viewer === i ? "w-4 bg-bg" : "w-2 bg-bg/30")}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
