"use client";
/**
 * PhotoFullscreen — Lightbox con swipe, contexto del día y eliminación.
 */
import { useEffect, useState, useCallback, useRef } from "react";
import { X, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { PhotoCardPhoto, ContextualBadge } from "./PhotoCard";
import type { MonthGroup } from "./PhotoMonth";

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";

interface DayEvent {
  icon: string;
  label: string;
}

interface PhotoFullscreenProps {
  photo: PhotoCardPhoto;
  group: MonthGroup;
  petId: string;
  userId: string;
  petBirthDate?: string;
  accentColor: string;
  onClose: () => void;
  onDeleted: (photoId: string) => void;
}

export function PhotoFullscreen({
  photo: initialPhoto,
  group,
  petId,
  userId,
  petBirthDate,
  accentColor,
  onClose,
  onDeleted,
}: PhotoFullscreenProps) {
  const [currentIdx, setCurrentIdx] = useState(() =>
    group.photos.findIndex((p) => p.id === initialPhoto.id)
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dayEvents, setDayEvents] = useState<DayEvent[]>([]);

  const touchStartX = useRef<number | null>(null);
  const currentPhoto = group.photos[currentIdx] ?? initialPhoto;

  // Load contextual day events when photo changes
  useEffect(() => {
    async function loadDayEvents() {
      if (!currentPhoto.created_at) { setDayEvents([]); return; }

      const supabase = createClient();
      const dateStr = currentPhoto.created_at.split("T")[0];
      const events: DayEvent[] = [];

      // Vaccines
      const { data: vacs } = await supabase
        .from("vaccines")
        .select("nombre")
        .eq("pet_id", petId)
        .eq("fecha_aplicacion", dateStr);
      if (vacs && vacs.length > 0) {
        events.push({ icon: "💉", label: `Vacuna: ${(vacs as {nombre:string}[]).map((v) => v.nombre).join(", ")}` });
      }

      // Clinical records
      const { data: clin } = await supabase
        .from("clinical_records")
        .select("diagnosis")
        .eq("pet_id", petId)
        .eq("visit_date", dateStr);
      if (clin && clin.length > 0) {
        events.push({ icon: "🏥", label: `Visita veterinaria: ${(clin as {diagnosis:string}[]).map((c) => c.diagnosis || "Consulta").join(", ")}` });
      }

      // Medications
      const { data: meds } = await supabase
        .from("medications")
        .select("name")
        .eq("pet_id", petId)
        .eq("start_date", dateStr);
      if (meds && meds.length > 0) {
        events.push({ icon: "💊", label: `Medicamento: ${(meds as {name:string}[]).map((m) => m.name).join(", ")}` });
      }

      // Birthday (same month/day)
      if (petBirthDate) {
        const birth = petBirthDate.slice(5, 10); // MM-DD
        const photoDay = dateStr.slice(5, 10);
        if (birth === photoDay) {
          events.push({ icon: "🎂", label: "¡Cumpleaños!" });
        }
      }

      setDayEvents(events);
    }

    void loadDayEvents();
  }, [currentPhoto.id, currentPhoto.created_at, petId, petBirthDate]);

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goTo(currentIdx - 1);
      if (e.key === "ArrowRight") goTo(currentIdx + 1);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentIdx, onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const goTo = useCallback((idx: number) => {
    const clamped = Math.max(0, Math.min(idx, group.photos.length - 1));
    setCurrentIdx(clamped);
  }, [group.photos.length]);

  // Touch swipe
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      goTo(dx < 0 ? currentIdx + 1 : currentIdx - 1);
    }
    touchStartX.current = null;
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const supabase = createClient();

      // Delete from storage
      if (currentPhoto.storage_path) {
        await supabase.storage.from("paw-photos").remove([currentPhoto.storage_path]);
      }

      // Delete from DB
      await supabase.from("pet_photos").delete().eq("id", currentPhoto.id).eq("user_id", userId);

      onDeleted(currentPhoto.id);
      onClose();
    } catch {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  }

  const src = currentPhoto.signedUrl || currentPhoto.photo_url || "";
  const formattedDate = currentPhoto.created_at
    ? new Date(currentPhoto.created_at).toLocaleDateString("es-ES", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      })
    : "Fecha desconocida";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(0,0,0,0.97)",
        display: "flex",
        flexDirection: "column",
        fontFamily: FONT,
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          background: "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)",
          zIndex: 10,
        }}
      >
        <div>
          <span style={{ fontSize: 12, color: "rgba(235,235,245,0.5)" }}>
            {currentIdx + 1} / {group.photos.length}
          </span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => setShowDeleteModal(true)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(255,69,58,0.18)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Trash2 size={16} color="#ff453a" />
          </button>
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.1)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} color="#fff" />
          </button>
        </div>
      </div>

      {/* Image area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          padding: "0 60px",
          overflow: "hidden",
        }}
      >
        {src && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              borderRadius: 12,
              userSelect: "none",
              WebkitUserSelect: "none",
            }}
          />
        )}

        {/* Prev / Next buttons */}
        {group.photos.length > 1 && (
          <>
            <button
              onClick={() => goTo(currentIdx - 1)}
              disabled={currentIdx === 0}
              style={{
                position: "absolute",
                left: 8,
                top: "50%",
                transform: "translateY(-50%)",
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.1)",
                border: "none",
                cursor: currentIdx === 0 ? "not-allowed" : "pointer",
                opacity: currentIdx === 0 ? 0.3 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ChevronLeft size={22} color="#fff" />
            </button>
            <button
              onClick={() => goTo(currentIdx + 1)}
              disabled={currentIdx === group.photos.length - 1}
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.1)",
                border: "none",
                cursor: currentIdx === group.photos.length - 1 ? "not-allowed" : "pointer",
                opacity: currentIdx === group.photos.length - 1 ? 0.3 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ChevronRight size={22} color="#fff" />
            </button>
          </>
        )}
      </div>

      {/* Bottom panel: date + events */}
      <div
        style={{
          padding: "16px 20px 32px",
          background: "linear-gradient(to top, rgba(0,0,0,0.9), transparent)",
        }}
      >
        <p style={{ margin: "0 0 10px", fontSize: 13, color: "rgba(235,235,245,0.5)", textTransform: "capitalize" }}>
          {formattedDate}
        </p>
        {dayEvents.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {dayEvents.map((ev, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "rgba(255,255,255,0.07)",
                  borderRadius: 10,
                  padding: "8px 12px",
                }}
              >
                <span style={{ fontSize: 16 }}>{ev.icon}</span>
                <span style={{ fontSize: 13, color: "rgba(235,235,245,0.85)", fontFamily: FONT }}>
                  {ev.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Dot indicators */}
        {group.photos.length > 1 && group.photos.length <= 20 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 14 }}>
            {group.photos.map((_, i) => (
              <div
                key={i}
                onClick={() => goTo(i)}
                style={{
                  width: currentIdx === i ? 18 : 6,
                  height: 6,
                  borderRadius: 999,
                  background: currentIdx === i ? "#fff" : "rgba(255,255,255,0.25)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 300,
            display: "flex",
            alignItems: "flex-end",
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(8px)",
          }}
          onClick={() => !deleting && setShowDeleteModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              background: "#1c1c1e",
              borderRadius: "20px 20px 0 0",
              padding: "20px 20px 40px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)" }} />
            </div>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: "rgba(255,69,58,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 14px",
              }}
            >
              <Trash2 size={22} color="#ff453a" />
            </div>
            <h3 style={{ textAlign: "center", fontSize: 17, fontWeight: 700, color: "#fff", margin: "0 0 8px", fontFamily: FONT }}>
              ¿Eliminar esta foto?
            </h3>
            <p style={{ textAlign: "center", fontSize: 14, color: "rgba(235,235,245,0.5)", margin: "0 0 24px", fontFamily: FONT }}>
              Esta acción no se puede deshacer.
            </p>
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                width: "100%",
                padding: "15px",
                borderRadius: 13,
                background: "#ff453a",
                border: "none",
                cursor: deleting ? "not-allowed" : "pointer",
                fontSize: 15,
                fontWeight: 700,
                color: "#fff",
                fontFamily: FONT,
                opacity: deleting ? 0.6 : 1,
                marginBottom: 10,
              }}
            >
              {deleting ? "Eliminando..." : "Eliminar foto"}
            </button>
            <button
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
              style={{
                width: "100%",
                padding: "15px",
                borderRadius: 13,
                background: "rgba(255,255,255,0.07)",
                border: "none",
                cursor: "pointer",
                fontSize: 15,
                fontWeight: 600,
                color: "#fff",
                fontFamily: FONT,
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
