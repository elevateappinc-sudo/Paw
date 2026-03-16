"use client";
import { useState } from "react";
import { useStore } from "@/store";
import { formatCurrency, formatDate, getMonthKey, getMonthLabel } from "@/lib/utils";
import { Pencil, Trash2, X, ChevronDown, ChevronUp } from "lucide-react";
import { GastoForm } from "./GastoForm";
import type { Gasto } from "@/types";

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";

interface MonthDetailProps {
  month: string;
  onClose: () => void;
}

export function MonthDetail({ month, onClose }: MonthDetailProps) {
  const { gastos, deleteGasto, selectedPetId, pets } = useStore();
  const [editGasto, setEditGasto] = useState<Gasto | null>(null);
  const [expandedConcepto, setExpandedConcepto] = useState<string | null>(null);

  const pet = pets.find((p) => p.id === selectedPetId);
  const accentColor = pet?.color ?? "#0a84ff";

  const petGastos = gastos.filter((g) => g.petId === selectedPetId);
  const monthGastos = petGastos.filter((g) => getMonthKey(g.fecha) === month);

  const byConcepto: Record<string, Gasto[]> = {};
  for (const g of monthGastos) {
    if (!byConcepto[g.concepto]) byConcepto[g.concepto] = [];
    byConcepto[g.concepto].push(g);
  }

  const total = monthGastos.reduce((sum, g) => sum + g.monto, 0);

  return (
    <>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, fontFamily: FONT }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(235,235,245,0.4)", margin: 0 }}>
            Detalle
          </p>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: "4px 0 0" }}>{getMonthLabel(month)}</h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: accentColor }}>{formatCurrency(total)}</span>
          <button onClick={onClose}
            style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={14} color="rgba(235,235,245,0.5)" />
          </button>
        </div>
      </div>

      {monthGastos.length === 0 && (
        <p style={{ textAlign: "center", padding: "32px 0", fontSize: 14, color: "rgba(235,235,245,0.3)", fontFamily: FONT }}>
          No hay gastos en este mes
        </p>
      )}

      {/* Groups */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {Object.entries(byConcepto).map(([concepto, items]) => {
          const subtotal = items.reduce((s, g) => s + g.monto, 0);
          const isExpanded = expandedConcepto === concepto;

          return (
            <div key={concepto} style={{ background: "#2c2c2e", borderRadius: 13, overflow: "hidden" }}>
              {/* Group header */}
              <button
                onClick={() => setExpandedConcepto(isExpanded ? null : concepto)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "13px 16px", background: "transparent", border: "none",
                  cursor: "pointer", fontFamily: FONT,
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: `${accentColor}18`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 700, color: accentColor,
                }}>
                  {concepto.charAt(0)}
                </div>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#fff", margin: 0 }}>{concepto}</p>
                  <p style={{ fontSize: 12, color: "rgba(235,235,245,0.5)", margin: 0 }}>
                    {items.length} registro{items.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{formatCurrency(subtotal)}</span>
                  {isExpanded
                    ? <ChevronUp size={15} color="rgba(235,235,245,0.4)" />
                    : <ChevronDown size={15} color="rgba(235,235,245,0.4)" />}
                </div>
              </button>

              {/* Expanded items */}
              {isExpanded && (
                <div style={{ borderTop: "1px solid rgba(84,84,88,0.35)" }}>
                  {items.map((g, i) => (
                    <div key={g.id}>
                      {i > 0 && <div style={{ height: 1, background: "rgba(84,84,88,0.25)", marginLeft: 16 }} />}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: "#fff", fontFamily: FONT }}>
                              {formatCurrency(g.monto)}
                            </span>
                            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "rgba(255,255,255,0.07)", color: "rgba(235,235,245,0.5)" }}>
                              {formatDate(g.fecha)}
                            </span>
                            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: `${accentColor}18`, color: accentColor }}>
                              {g.quien}
                            </span>
                          </div>
                          {g.notas && (
                            <p style={{ fontSize: 12, marginTop: 4, color: "rgba(235,235,245,0.3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: FONT }}>
                              {g.notas}
                            </p>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: 6, marginLeft: 8 }}>
                          <button onClick={() => setEditGasto(g)}
                            style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Pencil size={12} color="rgba(235,235,245,0.5)" />
                          </button>
                          <button onClick={() => deleteGasto(g.id)}
                            style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,69,58,0.12)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Trash2 size={12} color="#ff453a" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editGasto && (
        <GastoForm editGasto={editGasto} onClose={() => setEditGasto(null)} accentColor={accentColor} />
      )}
    </>
  );
}
