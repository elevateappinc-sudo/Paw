"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useStore } from "@/store";
import { useAuthContext } from "@/contexts/AuthContext";
import { Plus, UtensilsCrossed, Footprints, Check, Pencil, Trash2, X, Clock } from "lucide-react";
import type { ItinerarioItem } from "@/types";

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";
const DIAS_LABEL = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function todayDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const inputS: React.CSSProperties = {
  width: "100%", padding: "14px 16px", fontSize: 16, color: "#fff",
  background: "transparent", border: "none", outline: "none",
  fontFamily: FONT, boxSizing: "border-box",
  colorScheme: "dark" as React.CSSProperties["colorScheme"],
};

// ── Item Form ────────────────────────────────────────────────────────────────
function ItemForm({
  onClose, editItem, accentColor = "#0a84ff",
}: { onClose: () => void; editItem?: ItinerarioItem; accentColor?: string }) {
  const { addItinerarioItem, updateItinerarioItem } = useStore();
  const [tipo,     setTipo]     = useState<"comida" | "salida">(editItem?.tipo ?? "comida");
  const [nombre,   setNombre]   = useState(editItem?.nombre ?? "");
  const [hora,     setHora]     = useState(editItem?.hora ?? "08:00");
  const [cantidad, setCantidad] = useState(editItem?.cantidad ?? "");
  const [dias,     setDias]     = useState<number[]>(editItem?.dias ?? [1,2,3,4,5,6,0]);
  const [notas,    setNotas]    = useState(editItem?.notas ?? "");

  function toggleDia(d: number) {
    setDias((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || dias.length === 0) return;
    const data = { tipo, nombre: nombre.trim(), hora, cantidad, dias, notas };
    if (editItem) updateItinerarioItem(editItem.id, data);
    else addItinerarioItem(data);
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
            {editItem ? "Editar" : "Nuevo"} {tipo === "comida" ? "comida" : "salida"}
          </h2>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={15} color="rgba(235,235,245,0.6)" />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "0 20px 40px" }}>
          {/* Tipo toggle */}
          <div style={{ display: "flex", background: "rgba(120,120,128,0.2)", borderRadius: 10, padding: 3, marginBottom: 16 }}>
            {(["comida", "salida"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setTipo(t)}
                style={{
                  flex: 1, padding: "10px", borderRadius: 8, border: "none", cursor: "pointer",
                  background: tipo === t ? accentColor : "transparent",
                  color: tipo === t ? "#fff" : "rgba(235,235,245,0.5)",
                  fontSize: 15, fontWeight: 600, fontFamily: FONT,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                }}>
                {t === "comida" ? <UtensilsCrossed size={15} /> : <Footprints size={15} />}
                {t === "comida" ? "Comida" : "Salida"}
              </button>
            ))}
          </div>

          {/* Nombre + Hora + Cantidad */}
          <div style={{ background: "#2c2c2e", borderRadius: 13, overflow: "hidden", marginBottom: 12 }}>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
              placeholder={tipo === "comida" ? "Ej: Desayuno, Almuerzo, Cena" : "Ej: Paseo mañana, Paseo tarde"}
              required style={inputS} />
            {sep}
            <input type="time" value={hora} onChange={(e) => setHora(e.target.value)}
              required style={inputS} />
            {sep}
            <input type="text" value={cantidad} onChange={(e) => setCantidad(e.target.value)}
              placeholder={tipo === "comida" ? "Cantidad (ej: 1 taza, 200g)" : "Duración (ej: 30 min)"}
              style={inputS} />
          </div>

          {/* Días */}
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(235,235,245,0.5)", marginBottom: 8 }}>
            Días de la semana
          </p>
          <div style={{ display: "flex", gap: 8, marginBottom: 12, justifyContent: "space-between" }}>
            {DIAS_LABEL.map((label, i) => (
              <button key={i} type="button" onClick={() => toggleDia(i)}
                style={{
                  flex: 1, height: 40, borderRadius: 10, border: "none", cursor: "pointer",
                  background: dias.includes(i) ? accentColor : "rgba(255,255,255,0.06)",
                  color: dias.includes(i) ? "#fff" : "rgba(235,235,245,0.4)",
                  fontSize: 11, fontWeight: 700, fontFamily: FONT,
                }}>
                {label.charAt(0)}
              </button>
            ))}
          </div>

          {/* Notas */}
          <div style={{ background: "#2c2c2e", borderRadius: 13, overflow: "hidden", marginBottom: 20 }}>
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)}
              placeholder="Notas (opcional)" rows={2}
              style={{ ...inputS, resize: "none", fontSize: 15 }} />
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: "15px", borderRadius: 13, background: "rgba(255,255,255,0.08)", border: "none", cursor: "pointer", fontSize: 16, fontWeight: 600, color: "rgba(235,235,245,0.6)", fontFamily: FONT }}>
              Cancelar
            </button>
            <button type="submit"
              style={{ flex: 2, padding: "15px", borderRadius: 13, background: accentColor, border: "none", cursor: "pointer", fontSize: 16, fontWeight: 600, color: "#fff", fontFamily: FONT }}>
              {editItem ? "Guardar" : "Agregar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Item Row ─────────────────────────────────────────────────────────────────
function ItemRow({
  item, done, onToggle, onEdit, onDelete, accentColor,
}: {
  item: ItinerarioItem; done: boolean; accentColor: string;
  onToggle: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const diasStr = item.dias.length === 7 ? "Todos los días"
    : item.dias.sort().map((d) => DIAS_LABEL[d]).join(", ");

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px" }}>
      {/* Toggle */}
      <button onClick={onToggle}
        style={{
          width: 30, height: 30, borderRadius: "50%", border: `2px solid ${done ? accentColor : "rgba(255,255,255,0.2)"}`,
          background: done ? accentColor : "transparent",
          cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
        {done && <Check size={14} color="#fff" strokeWidth={3} />}
      </button>

      {/* Icon */}
      <div style={{
        width: 40, height: 40, borderRadius: 11, flexShrink: 0,
        background: done ? "rgba(255,255,255,0.04)" : `${accentColor}18`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {item.tipo === "comida"
          ? <UtensilsCrossed size={18} color={done ? "rgba(235,235,245,0.2)" : accentColor} />
          : <Footprints size={18} color={done ? "rgba(235,235,245,0.2)" : accentColor} />}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 15, fontWeight: 600, margin: 0, color: done ? "rgba(235,235,245,0.3)" : "#fff", textDecoration: done ? "line-through" : "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {item.nombre}
        </p>
        <p style={{ fontSize: 12, color: "rgba(235,235,245,0.4)", margin: "2px 0 0" }}>
          {item.hora}{item.cantidad ? ` · ${item.cantidad}` : ""}{" · "}{diasStr}
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
        <button onClick={onEdit}
          style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Pencil size={12} color="rgba(235,235,245,0.5)" />
        </button>
        <button onClick={onDelete}
          style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,69,58,0.12)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Trash2 size={12} color="#ff453a" />
        </button>
      </div>
    </div>
  );
}

// ── Main Module ───────────────────────────────────────────────────────────────
export function ItinerarioModule() {
  const { itinerario, registros, toggleRegistro, deleteItinerarioItem, selectedPetId, pets, fetchItinerario } = useStore();
  const { user } = useAuthContext();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<ItinerarioItem | null>(null);

  const fetchData = useCallback(async () => {
    if (!selectedPetId) return;
    await fetchItinerario();
  }, [selectedPetId, fetchItinerario]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const pet = pets.find((p) => p.id === selectedPetId);
  const accentColor = pet?.color ?? "#0a84ff";
  const today = todayDate();
  const todayDow = new Date().getDay(); // 0=Sun

  const petItems = itinerario
    .filter((i) => i.petId === selectedPetId)
    .sort((a, b) => a.hora.localeCompare(b.hora));

  const todayItems = petItems.filter((i) => i.dias.includes(todayDow));

  const isItemDone = (itemId: string) => {
    const r = registros.find((r) => r.itemId === itemId && r.fecha === today);
    return r?.completado ?? false;
  };

  const { comidas, salidas } = useMemo(() => {
    const todayItemIds = new Set(todayItems.map((i) => i.id));
    return {
      comidas: petItems.filter((i) => i.tipo === "comida" && !todayItemIds.has(i.id)),
      salidas: petItems.filter((i) => i.tipo === "salida" && !todayItemIds.has(i.id)),
    };
  }, [petItems, todayItems]);

  const doneToday = todayItems.filter((i) => isItemDone(i.id)).length;
  const progress  = todayItems.length > 0 ? doneToday / todayItems.length : 0;

  const section = (label: string) => (
    <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(235,235,245,0.4)", marginBottom: 10 }}>
      {label}
    </p>
  );

  function renderList(items: ItinerarioItem[]) {
    return (
      <div style={{ background: "#1c1c1e", borderRadius: 16, overflow: "hidden", marginBottom: 20 }}>
        {items.map((item, i) => (
          <div key={item.id}>
            {i > 0 && <div style={{ height: 1, background: "rgba(84,84,88,0.65)", marginLeft: 60 }} />}
            <ItemRow
              item={item}
              done={isItemDone(item.id)}
              accentColor={accentColor}
              onToggle={() => toggleRegistro(item.id, today, user?.id ?? "")}
              onEdit={() => setEditItem(item)}
              onDelete={() => deleteItinerarioItem(item.id)}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 24, fontFamily: FONT }}>

      {/* Hero */}
      <div style={{ padding: "56px 24px 48px", position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: -40, right: -40, width: 220, height: 220, borderRadius: "50%",
          background: `radial-gradient(circle, ${accentColor}20 0%, transparent 70%)`, pointerEvents: "none",
        }} />
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Clock size={15} color={`${accentColor}cc`} />
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>
              {pet?.name ?? "Mascota"}
            </span>
          </div>
          <h1 style={{ fontSize: 34, fontWeight: 700, color: "#fff", margin: 0, letterSpacing: -0.5 }}>Itinerario</h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>Comidas y salidas diarias</p>
        </div>
      </div>

      {/* Today progress */}
      {todayItems.length > 0 && (
        <div style={{ padding: "0 16px", marginTop: -16, position: "relative", zIndex: 10 }}>
          <div style={{ background: "#1c1c1e", borderRadius: 20, padding: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.5)", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: 0 }}>Progreso de hoy</p>
              <span style={{ fontSize: 14, fontWeight: 700, color: progress === 1 ? "#30d158" : accentColor }}>
                {doneToday}/{todayItems.length}
              </span>
            </div>
            <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 999,
                width: `${progress * 100}%`,
                background: progress === 1 ? "#30d158" : accentColor,
                transition: "width 0.4s ease",
              }} />
            </div>
            {progress === 1 && (
              <p style={{ fontSize: 13, color: "#30d158", margin: "10px 0 0", textAlign: "center" }}>
                ✓ ¡Todo completado hoy!
              </p>
            )}
          </div>
        </div>
      )}

      <div style={{ padding: "0 16px" }}>
        {/* Today's items */}
        {todayItems.length > 0 && (
          <>
            {section("Hoy")}
            {renderList(todayItems)}
          </>
        )}

        {/* Comidas */}
        {comidas.length > 0 && (
          <>
            {section(`Comidas (${comidas.length})`)}
            {renderList(comidas)}
          </>
        )}

        {/* Salidas */}
        {salidas.length > 0 && (
          <>
            {section(`Salidas (${salidas.length})`)}
            {renderList(salidas)}
          </>
        )}

        {/* Empty state */}
        {petItems.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 24px", background: "#1c1c1e", borderRadius: 20, marginBottom: 20 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, margin: "0 auto 14px", background: `${accentColor}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Clock size={24} color={accentColor} />
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0 }}>Sin itinerario aún</p>
            <p style={{ fontSize: 13, color: "rgba(235,235,245,0.5)", marginTop: 6, marginBottom: 20 }}>
              Agrega las comidas y salidas de {pet?.name}
            </p>
            <button onClick={() => setShowForm(true)}
              style={{ width: "100%", padding: 14, borderRadius: 13, background: accentColor, border: "none", cursor: "pointer", fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: FONT }}>
              Crear primer ítem
            </button>
          </div>
        )}

        {/* CTA */}
        {petItems.length > 0 && (
          <button onClick={() => setShowForm(true)}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "16px", borderRadius: 13, background: accentColor, border: "none", cursor: "pointer", fontSize: 16, fontWeight: 700, color: "#fff", fontFamily: FONT }}>
            <Plus size={18} /> Agregar ítem
          </button>
        )}
      </div>

      {showForm && <ItemForm onClose={() => setShowForm(false)} accentColor={accentColor} />}
      {editItem && <ItemForm editItem={editItem} onClose={() => setEditItem(null)} accentColor={accentColor} />}
    </div>
  );
}
