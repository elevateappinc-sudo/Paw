"use client";
import { useState, useEffect, useCallback } from "react";
import { useStore } from "@/store";
import { Plus, Syringe, Pencil, Trash2, X } from "lucide-react";
import { formatDate, today } from "@/lib/utils";
import type { Vacuna } from "@/types";

function VacunaForm({ onClose, editVacuna }: { onClose: () => void; editVacuna?: Vacuna }) {
  const { addVacuna, updateVacuna } = useStore();
  const [nombre, setNombre] = useState(editVacuna?.nombre ?? "");
  const [fecha, setFecha] = useState(editVacuna?.fecha ?? today());
  const [proximaFecha, setProximaFecha] = useState(editVacuna?.proximaFecha ?? "");
  const [veterinario, setVeterinario] = useState(editVacuna?.veterinario ?? "");
  const [notas, setNotas] = useState(editVacuna?.notas ?? "");

  const inputS: React.CSSProperties = {
    width: "100%", padding: "14px 16px", fontSize: 16, color: "#fff",
    background: "transparent", border: "none", outline: "none", fontFamily: "inherit",
    boxSizing: "border-box",
  };
  const labelS: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em",
    color: "rgba(235,235,245,0.5)", marginBottom: 6, display: "block",
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return;
    const data = { nombre: nombre.trim(), fecha, proximaFecha, veterinario, notas };
    if (editVacuna) updateVacuna(editVacuna.id, data);
    else addVacuna(data);
    onClose();
  }

  const fields = [
    { label: "Vacuna *", value: nombre, set: setNombre, type: "text", placeholder: "Ej: Rabia, Parvovirus..." },
    { label: "Fecha aplicada", value: fecha, set: setFecha, type: "date", placeholder: "" },
    { label: "Próxima dosis", value: proximaFecha, set: setProximaFecha, type: "date", placeholder: "" },
    { label: "Veterinario", value: veterinario, set: setVeterinario, type: "text", placeholder: "Nombre del veterinario" },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "flex-end", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
      <div style={{ width: "100%", maxHeight: "85dvh", overflowY: "auto", background: "#1c1c1e", borderRadius: "20px 20px 0 0", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px 16px" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: 0 }}>{editVacuna ? "Editar vacuna" : "Nueva vacuna"}</h2>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={15} color="rgba(235,235,245,0.6)" />
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: "0 20px 40px" }}>
          <div style={{ background: "#2c2c2e", borderRadius: 13, overflow: "hidden", marginBottom: 12 }}>
            {fields.map((f, i) => (
              <div key={f.label}>
                {i > 0 && <div style={{ height: 1, background: "rgba(84,84,88,0.65)", marginLeft: 16 }} />}
                <input
                  type={f.type}
                  value={f.value}
                  onChange={(e) => f.set(e.target.value)}
                  placeholder={f.placeholder}
                  style={{ ...inputS, colorScheme: "dark" } as React.CSSProperties}
                />
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelS}>Notas</label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Observaciones..."
              rows={2}
              style={{ ...inputS, background: "#2c2c2e", borderRadius: 13, resize: "none" }}
            />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: "15px", borderRadius: 13, background: "rgba(255,255,255,0.08)", border: "none", cursor: "pointer", fontSize: 16, fontWeight: 600, color: "rgba(235,235,245,0.6)", fontFamily: "inherit" }}>
              Cancelar
            </button>
            <button type="submit"
              style={{ flex: 2, padding: "15px", borderRadius: 13, background: "#0a84ff", border: "none", cursor: "pointer", fontSize: 16, fontWeight: 600, color: "#fff", fontFamily: "inherit" }}>
              {editVacuna ? "Guardar" : "Agregar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function VacunasModule() {
  const { vacunas, deleteVacuna, selectedPetId, pets, fetchVacunas } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editVacuna, setEditVacuna] = useState<Vacuna | null>(null);

  const fetchData = useCallback(async () => {
    if (!selectedPetId) return;
    await fetchVacunas();
  }, [selectedPetId, fetchVacunas]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);
  const pet = pets.find((p) => p.id === selectedPetId);
  const petVacunas = vacunas.filter((v) => v.petId === selectedPetId).sort((a, b) => b.fecha.localeCompare(a.fecha));

  const accentColor = pet?.color ?? "#0a84ff";
  const todayStr = today();

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* Hero */}
      <div style={{ padding: "56px 24px 48px" }}>
        <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(235,235,245,0.4)", margin: "0 0 8px" }}>
          {pet?.name ?? "Mascota"}
        </p>
        <h1 style={{ fontSize: 34, fontWeight: 700, color: "#fff", margin: 0, letterSpacing: -0.5 }}>Vacunas</h1>
        <p style={{ fontSize: 15, color: "rgba(235,235,245,0.4)", marginTop: 6 }}>Historial de vacunación</p>
      </div>

      <div style={{ padding: "0 16px" }}>
        {petVacunas.length > 0 ? (
          <>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(235,235,245,0.4)", marginBottom: 10 }}>
              {petVacunas.length} vacuna{petVacunas.length !== 1 ? "s" : ""} registrada{petVacunas.length !== 1 ? "s" : ""}
            </p>
            <div style={{ background: "#1c1c1e", borderRadius: 16, overflow: "hidden", marginBottom: 20 }}>
              {petVacunas.map((v, i) => {
                const isOverdue = v.proximaFecha && v.proximaFecha < todayStr;
                const isUpcoming = v.proximaFecha && v.proximaFecha >= todayStr;
                return (
                  <div key={v.id}>
                    {i > 0 && <div style={{ height: 1, background: "rgba(84,84,88,0.65)", marginLeft: 60 }} />}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                        background: `${accentColor}18`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Syringe size={20} color={accentColor} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: 0 }}>{v.nombre}</p>
                        <p style={{ fontSize: 13, color: "rgba(235,235,245,0.5)", margin: "2px 0 0" }}>
                          {formatDate(v.fecha)}
                          {v.veterinario && ` · ${v.veterinario}`}
                        </p>
                        {v.proximaFecha && (
                          <p style={{ fontSize: 12, margin: "4px 0 0", color: isOverdue ? "#ff453a" : isUpcoming ? "#30d158" : "rgba(235,235,245,0.4)" }}>
                            Próxima: {formatDate(v.proximaFecha)} {isOverdue ? "⚠️ Vencida" : ""}
                          </p>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <button onClick={() => setEditVacuna(v)}
                          style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Pencil size={13} color="rgba(235,235,245,0.5)" />
                        </button>
                        <button onClick={() => deleteVacuna(v.id)}
                          style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,69,58,0.1)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Trash2 size={13} color="#ff453a" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "48px 24px", background: "#1c1c1e", borderRadius: 20, marginBottom: 20 }}>
            <div style={{ marginBottom: 14, display: "flex", justifyContent: "center" }}>
              <Syringe size={40} color="rgba(235,235,245,0.2)" />
            </div>
            <p style={{ fontSize: 17, fontWeight: 600, color: "#fff", margin: 0 }}>Sin vacunas registradas</p>
            <p style={{ fontSize: 15, color: "rgba(235,235,245,0.4)", marginTop: 8 }}>Registra la primera vacuna</p>
          </div>
        )}

        <button onClick={() => setShowForm(true)} style={{
          width: "100%", padding: "16px", borderRadius: 13, border: "none",
          background: accentColor, color: "#fff", fontSize: 17, fontWeight: 600, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
        }}>
          <Plus size={20} /> Agregar vacuna
        </button>
      </div>

      {showForm && <VacunaForm onClose={() => setShowForm(false)} />}
      {editVacuna && <VacunaForm onClose={() => setEditVacuna(null)} editVacuna={editVacuna} />}
    </div>
  );
}
