"use client";
/**
 * VideoFullscreen — Visor a pantalla completa para reproducir y eliminar videos.
 */
import { useEffect, useRef, useState } from "react";
import { X, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { showToast } from "@/components/ui";
import type { VideoEntry } from "@/hooks/useVideoUpload";
import { ConfirmDeleteSheet } from "./ConfirmDeleteSheet";

interface VideoFullscreenProps {
  video: VideoEntry;
  /** @deprecated ya no se usa: los colores salen de los tokens */
  accentColor?: string;
  onClose: () => void;
  onDeleted: (videoId: string) => void;
}

export function VideoFullscreen({ video, onClose, onDeleted }: VideoFullscreenProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showDeleteModal) setShowDeleteModal(false);
        else onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, showDeleteModal]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const supabase = createClient();
      await supabase.storage.from("pet-videos").remove([video.storagePath]);
      await supabase.from("pet_videos").delete().eq("id", video.id);
      const { data: usage } = await supabase.from("user_storage_usage").select("total_video_bytes").eq("user_id", video.userId).maybeSingle();
      if (usage) {
        const newBytes = Math.max(0, (usage as { total_video_bytes: number }).total_video_bytes - video.fileSizeBytes);
        await supabase
          .from("user_storage_usage")
          .upsert({ user_id: video.userId, total_video_bytes: newBytes, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
      }
      onDeleted(video.id);
    } catch {
      showToast("No se pudo eliminar el video", undefined, "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div
        ref={overlayRef}
        role="dialog"
        aria-modal="true"
        aria-label="Video"
        onClick={(e) => {
          if (e.target === overlayRef.current) onClose();
        }}
        className="fixed inset-0 z-[55] flex flex-col items-center justify-center bg-on text-bg"
      >
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-[max(14px,env(safe-area-inset-top))] pb-3">
          <button type="button" onClick={onClose} aria-label="Cerrar" className="flex h-11 w-11 items-center justify-center rounded-full bg-bg/15 text-bg active:scale-95">
            <X size={20} />
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            aria-label="Eliminar video"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-danger-container text-danger active:scale-95"
          >
            <Trash2 size={18} />
          </button>
        </div>

        <video src={video.videoUrl} controls autoPlay playsInline className="max-h-[80vh] max-w-full rounded-card shadow-3" />

        {video.durationSeconds !== undefined && video.durationSeconds !== null && (
          <p className="mt-3 text-[13px] text-bg/60">
            {Math.floor(video.durationSeconds / 60)}:{String(video.durationSeconds % 60).padStart(2, "0")} min
          </p>
        )}
      </div>

      <ConfirmDeleteSheet
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => void handleDelete()}
        deleting={deleting}
        title="¿Eliminar video?"
        confirmLabel="Eliminar video"
      />
    </>
  );
}
