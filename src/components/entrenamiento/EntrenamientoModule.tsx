"use client";
import { useState, useMemo } from "react";
import { useStore } from "@/store";
import { InfoCell } from "@/components/ui/Card";
import { ClaseForm } from "./ClaseForm";
import { ClaseCard } from "./ClaseCard";
import { Plus, Dumbbell } from "lucide-react";
import { formatDate } from "@/lib/utils";

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";

const section = (label: string) => (
  <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(235,235,245,0.4)", marginBottom: 10, fontFamily: FONT }}>
    {label}
  </p>
);

export function EntrenamientoModule() {
  const { clases, selectedPetId, pets } = useStore();
  const [showForm, setShowForm] = useState(false);

  const pet = pets.find((p) => p.id === selectedPetId);
  const accentColor = pet?.color ?? "#0a84ff";

  const petClases = clases.filter((c) => c.petId === selectedPetId);
  const sorted = [...petClases].sort((a, b) => b.fecha.localeCompare(a.fecha));

  const stats = useMemo(() => {
    const allTareas = petClases.flatMap((c) => c.tareas);
    const pending    = allTareas.filter((t) => t.estado === "pendiente").length;
    const inProgress = allTareas.filter((t) => t.estado === "en_progreso").length;
    const completed  = allTareas.filter((t) => t.estado === "completado").length;
    return { totalClases: petClases.length, pending, inProgress, completed };
  }, [petClases]);

  const pendingTareas = useMemo(() =>
    petClases.flatMap((c) =>
      c.tareas
        .filter((t) => t.estado !== "completado")
        .map((t) => ({ ...t, claseId: c.id, claseFecha: c.fecha }))
    ).slice(0, 5),
  [petClases]);

  return (
    <div style={{ paddingBottom: 24, fontFamily: FONT }}>

      {/* Hero */}
      <div style={{ padding: "56px 24px 48px", position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: -40, right: -40,
          width: 220, height: 220, borderRadius: "50%",
          background: `radial-gradient(circle, ${accentColor}20 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Dumbbell size={15} color={`${accentColor}cc`} />
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>
              {pet?.name ?? "Mascota"}
            </span>
          </div>
          <h1 style={{ fontSize: 34, fontWeight: 700, color: "#fff", margin: 0, letterSpacing: -0.5 }}>Entrenamiento</h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>Clases y seguimiento de tareas</p>
        </div>
      </div>

      {/* Stats panel */}
      <div style={{ padding: "0 16px", marginTop: -16, position: "relative", zIndex: 10 }}>
        <div style={{ background: "#1c1c1e", borderRadius: 20, padding: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
          {section("Resumen")}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <InfoCell label="Clases totales" value={String(stats.totalClases)} />
            <InfoCell label="Completadas"    value={String(stats.completed)} />
            <InfoCell label="En progreso"    value={String(stats.inProgress)} />
            <InfoCell label="Pendientes"     value={String(stats.pending)} />
          </div>
        </div>
      </div>

      {/* Pending tasks */}
      {pendingTareas.length > 0 && (
        <div style={{ padding: "24px 16px 0" }}>
          {section("Tareas pendientes")}
          <div style={{ background: "#1c1c1e", borderRadius: 16, overflow: "hidden" }}>
            {pendingTareas.map((t, i) => (
              <div key={t.id}>
                {i > 0 && <div style={{ height: 1, background: "rgba(84,84,88,0.65)", marginLeft: 28 }} />}
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px" }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                    background: t.estado === "en_progreso" ? accentColor : "#ff9f0a",
                  }} />
                  <p style={{ flex: 1, fontSize: 14, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.descripcion}
                  </p>
                  <span style={{ fontSize: 12, color: "rgba(235,235,245,0.4)", flexShrink: 0 }}>
                    {formatDate(t.claseFecha)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Classes list */}
      {sorted.length > 0 ? (
        <div style={{ padding: "24px 16px 0" }}>
          {section("Historial de clases")}
          <div style={{ background: "#1c1c1e", borderRadius: 16, overflow: "hidden" }}>
            {sorted.map((clase, i) => (
              <div key={clase.id}>
                {i > 0 && <div style={{ height: 1, background: "rgba(84,84,88,0.65)", marginLeft: 60 }} />}
                <ClaseCard clase={clase} accentColor={accentColor} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ padding: "20px 16px 0" }}>
          <div style={{ background: "#1c1c1e", borderRadius: 20, padding: "40px 24px", textAlign: "center" }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16, margin: "0 auto 14px",
              background: `${accentColor}18`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Dumbbell size={24} color={accentColor} />
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0 }}>Sin clases aún</p>
            <p style={{ fontSize: 13, color: "rgba(235,235,245,0.5)", marginTop: 6, marginBottom: 20 }}>
              Registra la primera clase de {pet?.name}
            </p>
            <button onClick={() => setShowForm(true)}
              style={{ width: "100%", padding: 14, borderRadius: 13, background: accentColor, border: "none", cursor: "pointer", fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: FONT }}>
              Registrar clase
            </button>
          </div>
        </div>
      )}

      {/* CTA */}
      {sorted.length > 0 && (
        <div style={{ padding: "20px 16px 0" }}>
          <button onClick={() => setShowForm(true)}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "16px", borderRadius: 13, background: accentColor, border: "none", cursor: "pointer",
              fontSize: 16, fontWeight: 700, color: "#fff", fontFamily: FONT,
            }}>
            <Plus size={18} /> Nueva clase
          </button>
        </div>
      )}

      {showForm && <ClaseForm onClose={() => setShowForm(false)} accentColor={accentColor} />}
    </div>
  );
}
