"use client";
/**
 * VideoFullscreen — Modal fullscreen para reproducir y eliminar videos de mascotas.
 */

import { useEffect, useRef, useState } from "react";
import { X, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { VideoEntry } from "@/hooks/useVideoUpload";

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";

interface VideoFullscreenProps {
  video: VideoEntry;
  accentColor?: string;
  onClose: () => void;
  onDeleted: (videoId: string) => void;
}

export function VideoFullscreen({ video, accentColor = "#0a84ff", onClose, onDeleted }: VideoFullscreenProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
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

  const handleDelete = async () => {
    setDeleting(true);
    const supabase = createClient();
    // Remove from storage
    await supabase.storage.from("pet-videos").remove([video.storagePath]);
    // Delete DB record
    await supabase.from("pet_videos").delete().eq("id", video.id);
    // Update usage (best effort)
    const { data: usage } = await supabase
      .from("user_storage_usage")
      .select("total_video_bytes")
      .eq("user_id", video.userId)
      .maybeSingle();
    if (usage) {
      const newBytes = Math.max(0, (usage as { total_video_bytes: number }).total_video_bytes - video.fileSizeBytes);
      await supabase.from("user_storage_usage").upsert(
        { user_id: video.userId, total_video_bytes: newBytes, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );
    }
    setDeleting(false);
    onDeleted(video.id);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        ref={overlayRef}
        onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
        style={{
          position: "fixed", inset: 0, zIndex: 9000,
          background: "rgba(0,0,0,0.96)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          fontFamily: FONT,
        }}
      >
        {/* Top bar */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0,
          padding: "16px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)",
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 36, height: 36, borderRadius: 18,
              background: "rgba(255,255,255,0.12)",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <X size={18} color="#fff" />
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            style={{
              width: 36, height: 36, borderRadius: 18,
              background: "rgba(255,69,58,0.2)",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Trash2 size={16} color="#ff453a" />
          </button>
        </div>

        {/* Video player */}
        <video
          src={video.videoUrl}
          controls
          autoPlay
          playsInline
          style={{
            maxWidth: "100%", maxHeight: "80vh",
            borderRadius: 12,
            boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
          }}
        />

        {/* Duration badge */}
        {video.durationSeconds !== undefined && video.durationSeconds !== null && (
          <p style={{
            marginTop: 12, fontSize: 13,
            color: "rgba(255,255,255,0.4)",
          }}>
            {Math.floor(video.durationSeconds / 60)}:{String(video.durationSeconds % 60).padStart(2, "0")} min
          </p>
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.7)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: FONT, padding: 24,
        }}>
          <div style={{
            background: "#1c1c1e", borderRadius: 20,
            padding: 28, maxWidth: 320, width: "100%",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          }}>
            <h3 style={{ color: "#fff", fontSize: 17, fontWeight: 700, margin: "0 0 8px" }}>
              ¿Eliminar video?
            </h3>
            <p style={{ color: "rgba(235,235,245,0.5)", fontSize: 14, margin: "0 0 24px" }}>
              Esta acción no se puede deshacer.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                style={{
                  flex: 1, padding: "12px 0", borderRadius: 12,
                  background: "rgba(255,255,255,0.08)",
                  border: "none", cursor: "pointer",
                  color: "#fff", fontSize: 15, fontWeight: 600,
                  fontFamily: FONT,
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  flex: 1, padding: "12px 0", borderRadius: 12,
                  background: "#ff453a",
                  border: "none", cursor: deleting ? "not-allowed" : "pointer",
                  color: "#fff", fontSize: 15, fontWeight: 600,
                  fontFamily: FONT, opacity: deleting ? 0.6 : 1,
                }}
              >
                {deleting ? "Eliminando…" : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
