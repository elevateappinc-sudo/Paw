"use client";
import { useState } from "react";
import { useStore } from "@/store";
import { today } from "@/lib/utils";
import { Plus, Trash2, X } from "lucide-react";
import type { ClaseEntrenamiento, TareaEntrenamiento } from "@/types";

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";

const inputS: React.CSSProperties = {
  width: "100%", padding: "14px 16px", fontSize: 16, color: "#fff",
  background: "transparent", border: "none", outline: "none",
  fontFamily: FONT, boxSizing: "border-box",
  colorScheme: "dark" as React.CSSProperties["colorScheme"],
};

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

interface ClaseFormProps {
  onClose: () => void;
  editClase?: ClaseEntrenamiento;
  accentColor?: string;
}

export function ClaseForm({ onClose, editClase, accentColor = "#0a84ff" }: ClaseFormProps) {
  const { addClass, updateClass } = useStore();
  const [fecha, setFecha] = useState(editClase?.fecha ?? today());
  const [entrenador, setEntrenador] = useState(editClase?.entrenador ?? "");
  const [temas, setTemas] = useState(editClase?.temas ?? "");
  const [ejercicios, setEjercicios] = useState(editClase?.ejercicios ?? "");
  const [avances, setAvances] = useState(editClase?.avances ?? "");
  const [tareas, setTareas] = useState<TareaEntrenamiento[]>(editClase?.tareas ?? []);
  const [newTarea, setNewTarea] = useState("");

  function addTarea() {
    const t = newTarea.trim();
    if (!t) return;
    setTareas((prev) => [...prev, { id: uid(), descripcion: t, estado: "pendiente" }]);
    setNewTarea("");
  }
  function removeTarea(id: string) { setTareas((prev) => prev.filter((t) => t.id !== id)); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fecha || !temas) return;
    const data = { fecha, entrenador, temas, ejercicios, avances, tareas };
    if (editClase) updateClass(editClase.id, data);
    else addClass(data);
    onClose();
  }

  const sep = <div style={{ height: 1, background: "rgba(84,84,88,0.65)", marginLeft: 16 }} />;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "flex-end", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
      <div style={{ width: "100%", maxHeight: "90dvh", overflowY: "auto", background: "#1c1c1e", borderRadius: "20px 20px 0 0", fontFamily: FONT }}>
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)" }} />
        </div>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px 16px" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: 0 }}>
            {editClase ? "Editar clase" : "Nueva clase"}
          </h2>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={15} color="rgba(235,235,245,0.6)" />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "0 20px 40px" }}>
          {/* Fecha + Entrenador */}
          <div style={{ background: "#2c2c2e", borderRadius: 13, overflow: "hidden", marginBottom: 12 }}>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required style={inputS} />
            {sep}
            <input type="text" value={entrenador} onChange={(e) => setEntrenador(e.target.value)}
              placeholder="Entrenador (opcional)" style={inputS} />
          </div>

          {/* Temas */}
          <div style={{ background: "#2c2c2e", borderRadius: 13, overflow: "hidden", marginBottom: 12 }}>
            <textarea value={temas} onChange={(e) => setTemas(e.target.value)}
              placeholder="Temas tratados *" rows={3} required
              style={{ ...inputS, resize: "none", fontSize: 15 }} />
          </div>

          {/* Ejercicios + Avances */}
          <div style={{ background: "#2c2c2e", borderRadius: 13, overflow: "hidden", marginBottom: 12 }}>
            <textarea value={ejercicios} onChange={(e) => setEjercicios(e.target.value)}
              placeholder="Ejercicios practicados" rows={2}
              style={{ ...inputS, resize: "none", fontSize: 15 }} />
            {sep}
            <textarea value={avances} onChange={(e) => setAvances(e.target.value)}
              placeholder="Avances observados" rows={2}
              style={{ ...inputS, resize: "none", fontSize: 15 }} />
          </div>

          {/* Tareas */}
          <div style={{ background: "#2c2c2e", borderRadius: 13, overflow: "hidden", marginBottom: 20 }}>
            {tareas.map((t, i) => (
              <div key={t.id}>
                {i > 0 && <div style={{ height: 1, background: "rgba(84,84,88,0.35)", marginLeft: 16 }} />}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: accentColor, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 14, color: "#fff" }}>{t.descripcion}</span>
                  <button type="button" onClick={() => removeTarea(t.id)}
                    style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,69,58,0.12)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Trash2 size={12} color="#ff453a" />
                  </button>
                </div>
              </div>
            ))}
            {tareas.length > 0 && <div style={{ height: 1, background: "rgba(84,84,88,0.35)", marginLeft: 16 }} />}
            <div style={{ display: "flex", gap: 8, padding: "10px 16px" }}>
              <input type="text" value={newTarea} onChange={(e) => setNewTarea(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTarea(); } }}
                placeholder="Agregar tarea..."
                style={{ flex: 1, padding: "8px 12px", fontSize: 14, color: "#fff", background: "rgba(255,255,255,0.06)", border: "none", outline: "none", borderRadius: 8, fontFamily: FONT }} />
              <button type="button" onClick={addTarea}
                style={{ width: 32, height: 32, borderRadius: 8, background: accentColor, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Plus size={15} color="#fff" />
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: "15px", borderRadius: 13, background: "rgba(255,255,255,0.08)", border: "none", cursor: "pointer", fontSize: 16, fontWeight: 600, color: "rgba(235,235,245,0.6)", fontFamily: FONT }}>
              Cancelar
            </button>
            <button type="submit"
              style={{ flex: 2, padding: "15px", borderRadius: 13, background: accentColor, border: "none", cursor: "pointer", fontSize: 16, fontWeight: 600, color: "#fff", fontFamily: FONT }}>
              {editClase ? "Guardar" : "Registrar clase"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
