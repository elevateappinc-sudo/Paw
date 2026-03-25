"use client";
import { useState } from "react";
import { useStore } from "@/store";
import { today } from "@/lib/utils";
import { X, Plus, Check, ChevronDown } from "lucide-react";
import type { Gasto } from "@/types";

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";

const inputS: React.CSSProperties = {
  width: "100%", padding: "14px 16px", fontSize: 16, color: "#fff",
  background: "transparent", border: "none", outline: "none",
  fontFamily: FONT, boxSizing: "border-box", colorScheme: "dark" as React.CSSProperties["colorScheme"],
};

// Simple inline select row — shows current value + chevron, expands options below
function SelectRow({
  options, value, onChange, onAddOption, placeholder,
}: {
  options: string[]; value: string; onChange: (v: string) => void;
  onAddOption?: (v: string) => void; placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [newVal, setNewVal] = useState("");

  return (
    <div>
      <button type="button" onClick={() => setOpen((o) => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "transparent", border: "none", cursor: "pointer", fontFamily: FONT }}>
        <span style={{ fontSize: 16, color: value ? "#fff" : "rgba(235,235,245,0.3)" }}>
          {value || placeholder}
        </span>
        <ChevronDown size={16} color="rgba(235,235,245,0.3)" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
      </button>
      {open && (
        <div style={{ borderTop: "1px solid rgba(84,84,88,0.65)" }}>
          {options.map((opt) => (
            <button key={opt} type="button"
              onClick={() => { onChange(opt); setOpen(false); }}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", background: "transparent", border: "none", cursor: "pointer", fontFamily: FONT, borderTop: "1px solid rgba(84,84,88,0.35)" }}>
              <span style={{ fontSize: 15, color: value === opt ? "#0a84ff" : "#fff" }}>{opt}</span>
              {value === opt && <Check size={16} color="#0a84ff" />}
            </button>
          ))}
          {onAddOption && (
            <div style={{ display: "flex", gap: 8, padding: "10px 16px", borderTop: "1px solid rgba(84,84,88,0.35)" }}>
              <input type="text" value={newVal} onChange={(e) => setNewVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const t = newVal.trim();
                    if (t) { onAddOption(t); onChange(t); setNewVal(""); setOpen(false); }
                  }
                }}
                placeholder="Agregar nuevo..."
                style={{ flex: 1, padding: "8px 12px", fontSize: 14, color: "#fff", background: "#3a3a3c", border: "none", outline: "none", borderRadius: 8, fontFamily: FONT }} />
              <button type="button"
                onClick={() => { const t = newVal.trim(); if (t) { onAddOption(t); onChange(t); setNewVal(""); setOpen(false); } }}
                style={{ width: 32, height: 32, borderRadius: 8, background: "#0a84ff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Plus size={15} color="#fff" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface GastoFormProps { onClose: () => void; editGasto?: Gasto; accentColor?: string; }

export function GastoForm({ onClose, editGasto, accentColor = "#0a84ff" }: GastoFormProps) {
  const { conceptos, personas, addGasto, updateGasto, addConcepto, addPersona } = useStore();
  const [concepto, setConcepto] = useState(editGasto?.concepto ?? "");
  const [monto, setMonto] = useState(editGasto?.monto?.toString() ?? "");
  const [fecha, setFecha] = useState(editGasto?.fecha ?? today());
  const [quien, setQuien] = useState(editGasto?.quien ?? "");
  const [notas, setNotas] = useState(editGasto?.notas ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!concepto || !monto || !fecha || !quien) return;
    const data = { concepto, monto: parseFloat(monto), fecha, quien, notas: notas.trim() };
    if (editGasto) void updateGasto(editGasto.id, data);
    else void addGasto(data);
    onClose();
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "flex-end", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
      <div style={{ width: "100%", maxHeight: "90dvh", overflowY: "auto", background: "#1c1c1e", borderRadius: "20px 20px 0 0", fontFamily: FONT }}>
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)" }} />
        </div>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px 16px" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: 0 }}>{editGasto ? "Editar gasto" : "Nuevo gasto"}</h2>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={15} color="rgba(235,235,245,0.6)" />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "0 20px 40px" }}>
          {/* Amount — prominent */}
          <div style={{ background: "#2c2c2e", borderRadius: 13, overflow: "hidden", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", padding: "0 16px" }}>
              <span style={{ fontSize: 28, fontWeight: 300, color: "rgba(235,235,245,0.4)", marginRight: 4 }}>$</span>
              <input
                type="number" value={monto} onChange={(e) => setMonto(e.target.value)}
                placeholder="0" min="0" step="0.01" required
                style={{ ...inputS, fontSize: 28, fontWeight: 300, flex: 1 }}
              />
            </div>
          </div>

          {/* Grouped fields */}
          <div style={{ background: "#2c2c2e", borderRadius: 13, overflow: "hidden", marginBottom: 12 }}>
            {/* Concepto */}
            <SelectRow options={conceptos} value={concepto} onChange={setConcepto} onAddOption={addConcepto} placeholder="Concepto" />
            <div style={{ height: 1, background: "rgba(84,84,88,0.65)", marginLeft: 16 }} />
            {/* Fecha */}
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required
              style={{ ...inputS }} />
            <div style={{ height: 1, background: "rgba(84,84,88,0.65)", marginLeft: 16 }} />
            {/* Quien */}
            <SelectRow options={personas} value={quien} onChange={setQuien} onAddOption={addPersona} placeholder="Quién pagó" />
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
              {editGasto ? "Guardar" : "Agregar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
