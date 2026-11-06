"use client";
import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Pencil, Trash2, ChevronDown, Video, Upload } from "lucide-react";
import { PetTraining } from "@/components/icons/pet";
import { useStore } from "@/store";
import { useAuthContext } from "@/contexts/AuthContext";
import { cn, formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button, ProgressBar, showToast } from "@/components/ui";
import { TareaItem } from "./TareaItem";
import { ClaseForm } from "./ClaseForm";
import { VideoFullscreen } from "@/components/gallery/VideoFullscreen";
import { useVideoUpload, type VideoEntry } from "@/hooks/useVideoUpload";
import type { ClaseEntrenamiento } from "@/types";

interface ClaseCardProps {
  clase: ClaseEntrenamiento;
  /** @deprecated los colores salen de los tokens */
  accentColor?: string;
  isFirst?: boolean;
  isLast?: boolean;
}

function DetailBlock({ label, tone, children }: { label: string; tone: "warn" | "ok" | "primary"; children: React.ReactNode }) {
  const toneClass = { warn: "text-warning-text", ok: "text-success-text", primary: "text-primary-text" }[tone];
  return (
    <div>
      <p className={cn("mb-1 text-label font-semibold", toneClass)}>{label}</p>
      {children}
    </div>
  );
}

export function ClaseCard({ clase }: ClaseCardProps) {
  const { deleteClass } = useStore();
  const { user } = useAuthContext();
  const reduce = useReducedMotion();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [sessionVideo, setSessionVideo] = useState<VideoEntry | null>(null);
  const [showVideoFullscreen, setShowVideoFullscreen] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { upload: uploadVideo, progress: videoProgress, isUploading: videoUploading } = useVideoUpload();

  const completedTareas = clase.tareas.filter((t) => t.estado === "completado").length;
  const progress = clase.tareas.length > 0 ? completedTareas / clase.tareas.length : 0;

  async function handleDelete() {
    try {
      await deleteClass(clase.id);
    } catch {
      showToast("No se pudo eliminar la clase", () => void handleDelete(), "error");
    }
  }

  return (
    <>
      <div>
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            aria-expanded={expanded}
            className="flex min-h-11 min-w-0 flex-1 items-center gap-3 text-left"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-primary-soft text-primary-text">
              <PetTraining size={20} aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-subtitle font-semibold text-text">{clase.temas}</p>
              <p className="text-small text-text-secondary">
                {formatDate(clase.fecha)}
                {clase.entrenador ? ` · ${clase.entrenador}` : ""}
              </p>
              {clase.tareas.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <ProgressBar value={progress} tone={progress === 1 ? "ok" : "primary"} className="h-1" />
                  <span className="shrink-0 text-label font-semibold text-text-secondary">
                    {completedTareas}/{clase.tareas.length}
                  </span>
                </div>
              )}
            </div>
            <ChevronDown size={18} className={cn("shrink-0 text-text-secondary transition-transform duration-200", expanded && "rotate-180")} aria-hidden="true" />
          </button>
          <div className="flex shrink-0 items-center gap-1">
            <Button variant="secondary" size="icon" aria-label="Editar clase" onClick={() => setEditing(true)}>
              <Pencil size={15} />
            </Button>
            <Button variant="dangerTonal" size="icon" aria-label="Eliminar clase" onClick={() => void handleDelete()} className="border-transparent">
              <Trash2 size={15} />
            </Button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={reduce ? false : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-4 border-t border-border px-4 pt-4 pb-5">
                {clase.ejercicios && (
                  <DetailBlock label="Ejercicios" tone="warn">
                    <p className="whitespace-pre-line text-body text-text">{clase.ejercicios}</p>
                  </DetailBlock>
                )}
                {clase.avances && (
                  <DetailBlock label="Avances" tone="ok">
                    <p className="whitespace-pre-line text-body text-text">{clase.avances}</p>
                  </DetailBlock>
                )}
                {clase.tareas.length > 0 && (
                  <DetailBlock label={`Tareas (${completedTareas}/${clase.tareas.length})`} tone="primary">
                    <ul className="overflow-hidden rounded-md bg-surface-elevated">
                      {clase.tareas.map((t, i) => (
                        <li key={t.id} className={i > 0 ? "border-t border-border" : undefined}>
                          <TareaItem tarea={t} claseId={clase.id} />
                        </li>
                      ))}
                    </ul>
                  </DetailBlock>
                )}

                <div>
                  <p className="mb-2 text-label font-semibold text-text-secondary">Video de sesión</p>
                  {videoUploading && <ProgressBar value={videoProgress / 100} className="mb-2" />}
                  {sessionVideo ? (
                    <Button variant="secondary" full leading={<Video size={16} />} onClick={() => setShowVideoFullscreen(true)}>
                      Ver video
                      {sessionVideo.durationSeconds !== undefined && sessionVideo.durationSeconds !== null
                        ? ` · ${Math.floor(sessionVideo.durationSeconds / 60)}:${String(sessionVideo.durationSeconds % 60).padStart(2, "0")}`
                        : ""}
                    </Button>
                  ) : (
                    <Button variant="secondary" full leading={<Upload size={16} />} onClick={() => videoInputRef.current?.click()} loading={videoUploading}>
                      {videoUploading ? `Subiendo ${videoProgress}%` : "Adjuntar video (MP4)"}
                    </Button>
                  )}
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/mp4"
                    className="hidden"
                    aria-hidden="true"
                    tabIndex={-1}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.currentTarget.value = "";
                      if (!file || !user) return;
                      const result = await uploadVideo(file, {
                        petId: clase.petId,
                        userId: user.id,
                        onWarning: (msg) => showToast(msg),
                      });
                      if (result) {
                        const supabase = createClient();
                        await supabase.from("training_sessions").update({ video_url: result.videoUrl, video_storage_path: result.storagePath }).eq("id", clase.id);
                        setSessionVideo(result);
                        showToast("Video adjuntado", undefined, "success");
                      } else {
                        showToast("No se pudo subir el video", undefined, "error");
                      }
                    }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {sessionVideo && showVideoFullscreen && (
          <VideoFullscreen
            video={sessionVideo}
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

      {editing && <ClaseForm open editClase={clase} onClose={() => setEditing(false)} />}
    </>
  );
}
