"use client";
/**
 * PhotoFullscreen — Visor a pantalla completa con deslizamiento, contexto del día y eliminación.
 */
import { useEffect, useState, useCallback, useRef } from "react";
import { X, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { showToast } from "@/components/ui";
import { BADGE_ICON, type BadgeKind } from "./badges";
import { ConfirmDeleteSheet } from "./ConfirmDeleteSheet";
import type { PhotoCardPhoto } from "./PhotoCard";
import type { MonthGroup } from "./PhotoMonth";

interface DayEvent {
  kind: BadgeKind;
  label: string;
}

interface PhotoFullscreenProps {
  photo: PhotoCardPhoto;
  group: MonthGroup;
  petId: string;
  userId: string;
  petBirthDate?: string;
  onClose: () => void;
  onDeleted: (photoId: string) => void;
}

const navBtn =
  "absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-bg/15 text-bg backdrop-blur-sm active:scale-95 disabled:opacity-30";

export function PhotoFullscreen({ photo: initialPhoto, group, petId, userId, petBirthDate, onClose, onDeleted }: PhotoFullscreenProps) {
  const [currentIdx, setCurrentIdx] = useState(() => group.photos.findIndex((p) => p.id === initialPhoto.id));
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dayEvents, setDayEvents] = useState<DayEvent[]>([]);

  const touchStartX = useRef<number | null>(null);
  const currentPhoto = group.photos[currentIdx] ?? initialPhoto;

  useEffect(() => {
    async function loadDayEvents() {
      if (!currentPhoto.created_at) {
        setDayEvents([]);
        return;
      }
      const supabase = createClient();
      const dateStr = currentPhoto.created_at.split("T")[0];
      const events: DayEvent[] = [];

      const { data: vacs } = await supabase.from("vaccines").select("nombre").eq("pet_id", petId).eq("fecha_aplicacion", dateStr);
      if (vacs && vacs.length > 0) {
        events.push({ kind: "vacuna", label: `Vacuna: ${(vacs as { nombre: string }[]).map((v) => v.nombre).join(", ")}` });
      }

      const { data: clin } = await supabase.from("clinical_records").select("diagnosis").eq("pet_id", petId).eq("visit_date", dateStr);
      if (clin && clin.length > 0) {
        events.push({ kind: "vet", label: `Visita veterinaria: ${(clin as { diagnosis: string }[]).map((c) => c.diagnosis || "Consulta").join(", ")}` });
      }

      const { data: meds } = await supabase.from("medications").select("name").eq("pet_id", petId).eq("start_date", dateStr);
      if (meds && meds.length > 0) {
        events.push({ kind: "medicamento", label: `Medicamento: ${(meds as { name: string }[]).map((m) => m.name).join(", ")}` });
      }

      if (petBirthDate) {
        const birth = petBirthDate.slice(5, 10);
        if (birth === dateStr.slice(5, 10)) events.push({ kind: "cumple", label: "Cumpleaños" });
      }

      setDayEvents(events);
    }
    void loadDayEvents();
  }, [currentPhoto.id, currentPhoto.created_at, petId, petBirthDate]);

  const goTo = useCallback(
    (idx: number) => {
      const clamped = Math.max(0, Math.min(idx, group.photos.length - 1));
      setCurrentIdx(clamped);
    },
    [group.photos.length]
  );

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (showDeleteModal) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goTo(currentIdx - 1);
      if (e.key === "ArrowRight") goTo(currentIdx + 1);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentIdx, onClose, goTo, showDeleteModal]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) goTo(dx < 0 ? currentIdx + 1 : currentIdx - 1);
    touchStartX.current = null;
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const supabase = createClient();
      if (currentPhoto.storage_path) {
        await supabase.storage.from("paw-photos").remove([currentPhoto.storage_path]);
      }
      await supabase.from("pet_photos").delete().eq("id", currentPhoto.id).eq("user_id", userId);
      onDeleted(currentPhoto.id);
      onClose();
    } catch {
      setDeleting(false);
      setShowDeleteModal(false);
      showToast("No se pudo eliminar la foto", undefined, "error");
    }
  }

  const src = currentPhoto.signedUrl || currentPhoto.photo_url || "";
  const formattedDate = currentPhoto.created_at
    ? new Date(currentPhoto.created_at).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "Fecha desconocida";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Foto ${currentIdx + 1} de ${group.photos.length}`}
      className="fixed inset-0 z-[55] flex flex-col bg-on text-bg"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="z-10 flex items-center justify-between px-4 pt-[max(14px,env(safe-area-inset-top))] pb-3">
        <span className="text-[13px] font-semibold text-bg/70" aria-live="polite">
          {currentIdx + 1} / {group.photos.length}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            aria-label="Eliminar foto"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-danger-container text-danger active:scale-95"
          >
            <Trash2 size={18} />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-bg/15 text-bg active:scale-95"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-14">
        {src && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className="max-h-full max-w-full select-none rounded-card object-contain" draggable={false} />
        )}

        {group.photos.length > 1 && (
          <>
            <button type="button" onClick={() => goTo(currentIdx - 1)} disabled={currentIdx === 0} aria-label="Foto anterior" className={cn(navBtn, "left-2")}>
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              onClick={() => goTo(currentIdx + 1)}
              disabled={currentIdx === group.photos.length - 1}
              aria-label="Foto siguiente"
              className={cn(navBtn, "right-2")}
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}
      </div>

      <div className="px-5 pt-4 pb-[max(28px,env(safe-area-inset-bottom))]">
        <p className="mb-2.5 text-[13px] capitalize text-bg/70">{formattedDate}</p>
        {dayEvents.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {dayEvents.map((ev) => {
              const Icon = BADGE_ICON[ev.kind];
              return (
                <li key={ev.kind} className="flex items-center gap-2 rounded-control bg-bg/10 px-3 py-2">
                  <Icon size={16} className="shrink-0" aria-hidden="true" />
                  <span className="text-[13px] text-bg/90">{ev.label}</span>
                </li>
              );
            })}
          </ul>
        )}

        {group.photos.length > 1 && group.photos.length <= 20 && (
          <div className="mt-3.5 flex justify-center gap-1.5" role="tablist" aria-label="Fotos del mes">
            {group.photos.map((p, i) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={currentIdx === i}
                aria-label={`Foto ${i + 1}`}
                onClick={() => goTo(i)}
                className={cn("h-1.5 rounded-full transition-all duration-200", currentIdx === i ? "w-[18px] bg-bg" : "w-1.5 bg-bg/30")}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmDeleteSheet
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => void handleDelete()}
        deleting={deleting}
        title="¿Eliminar esta foto?"
        confirmLabel="Eliminar foto"
      />
    </div>
  );
}
