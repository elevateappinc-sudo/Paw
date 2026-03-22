"use client";
import { useState, useRef } from "react";
import { useStore } from "@/store";
import { useAuthContext } from "@/contexts/AuthContext";
import { formatDate } from "@/lib/utils";
import { TareaItem } from "./TareaItem";
import { ClaseForm } from "./ClaseForm";
import { VideoFullscreen } from "@/components/gallery/VideoFullscreen";
import { useVideoUpload, type VideoEntry } from "@/hooks/useVideoUpload";
import { Pencil, Trash2, ChevronDown, ChevronUp, Dumbbell, Video, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ClaseEntrenamiento } from "@/types";

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";

interface ClaseCardProps {
  clase: ClaseEntrenamiento;
  accentColor?: string;
  // kept for backwards compat, not used visually
  isFirst?: boolean;
  isLast?: boolean;
}

export function ClaseCard({ clase, accentColor = "#0a84ff" }: ClaseCardProps) {
  const { deleteClass } = useStore();
  const { user } = useAuthContext();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [sessionVideo, setSessionVideo] = useState<VideoEntry | null>(null);
  const [showVideoFullscreen, setShowVideoFullscreen] = useState(false);
  const [videoWarning, setVideoWarning] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { upload: uploadVideo, progress: videoProgress, isUploading: videoUploading, error: videoError } = useVideoUpload();

  const completedTareas = clase.tareas.filter((t) => t.estado === "completado").length;
  const progress = clase.tareas.length > 0 ? completedTareas / clase.tareas.length : 0;

  return (
    <>
      <div style={{ fontFamily: FONT }}>
        {/* Main row */}
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 12,
            padding: "14px 16px", background: "transparent", border: "none",
            cursor: "pointer", fontFamily: FONT, textAlign: "left",
          }}
        >
          {/* Icon */}
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: `${accentColor}18`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Dumbbell size={20} color={accentColor} />
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {clase.temas}
            </p>
            <p style={{ fontSize: 12, color: "rgba(235,235,245,0.5)", margin: "2px 0 0" }}>
              {formatDate(clase.fecha)}{clase.entrenador ? ` · ${clase.entrenador}` : ""}
            </p>
            {/* Progress bar */}
            {clase.tareas.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                <div style={{ flex: 1, height: 3, borderRadius: 999, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 999,
                    width: `${progress * 100}%`,
                    background: progress === 1 ? "#30d158" : accentColor,
                    transition: "width 0.3s",
                  }} />
                </div>
                <span style={{ fontSize: 11, color: "rgba(235,235,245,0.4)", flexShrink: 0 }}>
                  {completedTareas}/{clase.tareas.length}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setEditing(true); }}
              style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Pencil size={12} color="rgba(235,235,245,0.5)" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); deleteClass(clase.id); }}
              style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,69,58,0.12)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Trash2 size={12} color="#ff453a" />
            </button>
            {expanded
              ? <ChevronUp size={15} color="rgba(235,235,245,0.4)" />
              : <ChevronDown size={15} color="rgba(235,235,245,0.4)" />}
          </div>
        </button>

        {/* Expanded detail */}
        {expanded && (
          <div style={{ borderTop: "1px solid rgba(84,84,88,0.35)", padding: "16px 16px 20px" }}>
            {clase.ejercicios && (
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#ff9f0a", margin: "0 0 6px" }}>
                  Ejercicios
                </p>
                <p style={{ fontSize: 14, color: "rgba(235,235,245,0.75)", margin: 0, whiteSpace: "pre-line" }}>
                  {clase.ejercicios}
                </p>
              </div>
            )}
            {clase.avances && (
              <div style={{ marginBottom: clase.tareas.length > 0 ? 14 : 0 }}>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#30d158", margin: "0 0 6px" }}>
                  Avances
                </p>
                <p style={{ fontSize: 14, color: "rgba(235,235,245,0.75)", margin: 0, whiteSpace: "pre-line" }}>
                  {clase.avances}
                </p>
              </div>
            )}
            {clase.tareas.length > 0 && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: accentColor, margin: "0 0 8px" }}>
                  Tareas ({completedTareas}/{clase.tareas.length})
                </p>
                <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, overflow: "hidden" }}>
                  {clase.tareas.map((t, i) => (
                    <div key={t.id}>
                      {i > 0 && <div style={{ height: 1, background: "rgba(84,84,88,0.35)", marginLeft: 44 }} />}
                      <TareaItem tarea={t} claseId={clase.id} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Video Section ── */}
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(235,235,245,0.4)", margin: "0 0 8px" }}>
                Video de sesión
              </p>

              {videoError && (
                <div style={{ background: "rgba(255,69,58,0.12)", border: "1px solid rgba(255,69,58,0.25)", borderRadius: 8, padding: "8px 12px", marginBottom: 8, fontSize: 12, color: "#ff453a", fontFamily: FONT }}>
                  {videoError}
                </div>
              )}
              {videoWarning && (
                <div style={{ background: "rgba(255,159,10,0.12)", border: "1px solid rgba(255,159,10,0.25)", borderRadius: 8, padding: "8px 12px", marginBottom: 8, fontSize: 12, color: "#ff9f0a", fontFamily: FONT }}>
                  ⚠️ {videoWarning}
                </div>
              )}

              {videoUploading && (
                <div style={{ height: 3, borderRadius: 999, background: "rgba(255,255,255,0.08)", marginBottom: 8, overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 999, background: accentColor, width: `${videoProgress}%`, transition: "width 0.3s" }} />
                </div>
              )}

              {sessionVideo ? (
                <button
                  type="button"
                  onClick={() => setShowVideoFullscreen(true)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 14px", borderRadius: 10, width: "100%",
                    background: `${accentColor}18`, border: `1px solid ${accentColor}40`,
                    cursor: "pointer", fontFamily: FONT,
                  }}
                >
                  <Video size={16} color={accentColor} />
                  <span style={{ flex: 1, fontSize: 13, color: accentColor, fontWeight: 600, textAlign: "left" }}>
                    Ver video
                    {sessionVideo.durationSeconds !== undefined && sessionVideo.durationSeconds !== null
                      ? ` · ${Math.floor(sessionVideo.durationSeconds / 60)}:${String(sessionVideo.durationSeconds % 60).padStart(2, "0")}`
                      : ""}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={videoUploading}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 14px", borderRadius: 10, width: "100%",
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(84,84,88,0.5)",
                    cursor: videoUploading ? "not-allowed" : "pointer", fontFamily: FONT,
                  }}
                >
                  <Upload size={16} color="rgba(235,235,245,0.4)" />
                  <span style={{ fontSize: 13, color: "rgba(235,235,245,0.5)", fontWeight: 500 }}>
                    {videoUploading ? `Subiendo ${videoProgress}%` : "Adjuntar video (MP4)"}
                  </span>
                </button>
              )}

              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4"
                style={{ display: "none" }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.currentTarget.value = "";
                  if (!file || !user) return;
                  const result = await uploadVideo(file, {
                    petId: clase.petId,
                    userId: user.id,
                    onWarning: (msg) => { setVideoWarning(msg); setTimeout(() => setVideoWarning(null), 6000); },
                  });
                  if (result) {
                    // Also update training_sessions.video_url
                    const supabase = createClient();
                    await supabase.from("training_sessions").update({
                      video_url: result.videoUrl,
                      video_storage_path: result.storagePath,
                    }).eq("id", clase.id);
                    setSessionVideo(result);
                  }
                }}
              />
            </div>
          </div>
        )}

        {sessionVideo && showVideoFullscreen && (
          <VideoFullscreen
            video={sessionVideo}
            accentColor={accentColor}
            onClose={() => setShowVideoFullscreen(false)}
            onDeleted={() => {
              setSessionVideo(null);
              setShowVideoFullscreen(false);
              const supabase = createClient();
              void supabase.from("training_sessions").update({ video_url: null, video_storage_path: null }).eq("id", clase.id);
            }}
          />
        )}
      </div>

      {editing && (
        <ClaseForm editClase={clase} onClose={() => setEditing(false)} accentColor={accentColor} />
      )}
    </>
  );
}
