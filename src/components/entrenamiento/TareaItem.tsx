"use client";
import { useStore } from "@/store";
import type { TareaEntrenamiento, TaskStatus } from "@/types";

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  pendiente:   { label: "Pendiente",   color: "#ff9f0a", bg: "rgba(255,159,10,0.12)" },
  en_progreso: { label: "En progreso", color: "#0a84ff", bg: "rgba(10,132,255,0.12)" },
  completado:  { label: "Completado",  color: "#30d158", bg: "rgba(48,209,88,0.12)"  },
};
const STATUS_ORDER: TaskStatus[] = ["pendiente", "en_progreso", "completado"];

interface TareaItemProps { tarea: TareaEntrenamiento; claseId: string; }

export function TareaItem({ tarea, claseId }: TareaItemProps) {
  const { updateTarea } = useStore();
  const cfg = STATUS_CONFIG[tarea.estado];

  function cycleStatus() {
    const idx = STATUS_ORDER.indexOf(tarea.estado);
    updateTarea(claseId, tarea.id, STATUS_ORDER[(idx + 1) % STATUS_ORDER.length]);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", fontFamily: FONT }}>
      <button
        onClick={cycleStatus}
        style={{
          width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
          border: `2px solid ${
            tarea.estado === "completado" ? "#30d158"
            : tarea.estado === "en_progreso" ? "#0a84ff"
            : "rgba(255,255,255,0.2)"
          }`,
          background: tarea.estado === "completado" ? "#30d158"
            : tarea.estado === "en_progreso" ? "rgba(10,132,255,0.2)"
            : "transparent",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        {tarea.estado === "completado" && (
          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
            <path d="M1 3.5L3.2 5.5L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        {tarea.estado === "en_progreso" && (
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#0a84ff" }} />
        )}
      </button>

      <span style={{
        flex: 1, fontSize: 14,
        color: tarea.estado === "completado" ? "rgba(235,235,245,0.3)" : "#fff",
        textDecoration: tarea.estado === "completado" ? "line-through" : "none",
      }}>
        {tarea.descripcion}
      </span>

      <span style={{
        fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 999,
        background: cfg.bg, color: cfg.color, flexShrink: 0,
      }}>
        {cfg.label}
      </span>
    </div>
  );
}
