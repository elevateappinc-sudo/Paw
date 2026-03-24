"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useStore } from "@/store";
import { InfoCell } from "@/components/ui/Card";
import { GastoForm } from "./GastoForm";
import { GastosChart } from "./GastosChart";
import { MonthDetail } from "./MonthDetail";
import { formatCurrency, formatDate, getMonthKey } from "@/lib/utils";
import { Plus, Wallet } from "lucide-react";

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";

const section = (label: string) => (
  <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(235,235,245,0.4)", marginBottom: 10, fontFamily: FONT }}>
    {label}
  </p>
);

export function GastosModule() {
  const { gastos, selectedPetId, pets, fetchGastos, loadingExpenses } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!selectedPetId) return;
    await fetchGastos();
  }, [selectedPetId, fetchGastos]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const pet = pets.find((p) => p.id === selectedPetId);
  const accentColor = pet?.color ?? "#0a84ff";
  const petGastos = gastos.filter((g) => g.petId === selectedPetId);

  const stats = useMemo(() => {
    const now = new Date();
    const mk = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const thisMonth = petGastos.filter((g) => getMonthKey(g.fecha) === mk);
    const total = petGastos.reduce((s, g) => s + g.monto, 0);
    const thisMonthTotal = thisMonth.reduce((s, g) => s + g.monto, 0);
    const map: Record<string, number> = {};
    for (const g of petGastos) map[g.concepto] = (map[g.concepto] ?? 0) + g.monto;
    const topConcepto = Object.entries(map).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
    return { total, thisMonthTotal, count: petGastos.length, topConcepto };
  }, [petGastos]);

  const recentGastos = [...petGastos].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 5);

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
            <Wallet size={15} color={`${accentColor}cc`} />
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>
              {pet?.name ?? "Mascota"}
            </span>
          </div>
          <h1 style={{ fontSize: 34, fontWeight: 700, color: "#fff", margin: 0, letterSpacing: -0.5 }}>Gastos</h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>Registros y análisis financiero</p>
        </div>
      </div>

      {/* Stats panel */}
      <div style={{ padding: "0 16px", marginTop: -16, position: "relative", zIndex: 10 }}>
        <div style={{ background: "#1c1c1e", borderRadius: 20, padding: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
          {section("Resumen")}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <InfoCell label="Este mes"       value={formatCurrency(stats.thisMonthTotal)} />
            <InfoCell label="Total histórico" value={formatCurrency(stats.total)} />
            <InfoCell label="Registros"      value={String(stats.count)} />
            <InfoCell label="Mayor gasto"    value={stats.topConcepto} />
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ padding: "24px 16px 0" }}>
        {section("Evolución mensual")}
        <div style={{ background: "#1c1c1e", borderRadius: 16, padding: 16 }}>
          <GastosChart
            onMonthClick={(m) => setSelectedMonth(m === selectedMonth ? null : m)}
            selectedMonth={selectedMonth}
          />
        </div>
      </div>

      {/* Month Detail */}
      {selectedMonth && (
        <div style={{ padding: "16px 16px 0" }}>
          <div style={{ background: "#1c1c1e", borderRadius: 16, padding: 16 }}>
            <MonthDetail month={selectedMonth} onClose={() => setSelectedMonth(null)} />
          </div>
        </div>
      )}

      {/* Recent */}
      {!selectedMonth && recentGastos.length > 0 && (
        <div style={{ padding: "20px 16px 0" }}>
          {section("Recientes")}
          <div style={{ background: "#1c1c1e", borderRadius: 16, overflow: "hidden" }}>
            {recentGastos.map((g, i) => (
              <div key={g.id}>
                {i > 0 && <div style={{ height: 1, background: "rgba(84,84,88,0.65)", marginLeft: 60 }} />}
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px" }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: `${accentColor}18`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, fontWeight: 700, color: accentColor,
                  }}>
                    {g.concepto.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {g.concepto}
                    </p>
                    <p style={{ fontSize: 12, color: "rgba(235,235,245,0.5)", margin: 0 }}>
                      {formatDate(g.fecha)} · {g.quien}
                    </p>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{formatCurrency(g.monto)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty */}
      {petGastos.length === 0 && (
        <div style={{ padding: "20px 16px 0" }}>
          <div style={{ background: "#1c1c1e", borderRadius: 20, padding: "40px 24px", textAlign: "center" }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16, margin: "0 auto 14px",
              background: `${accentColor}18`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Wallet size={24} color={accentColor} />
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0 }}>Sin gastos aún</p>
            <p style={{ fontSize: 13, color: "rgba(235,235,245,0.5)", marginTop: 6, marginBottom: 20 }}>
              Registra el primer gasto de {pet?.name}
            </p>
            <button onClick={() => setShowForm(true)}
              style={{ width: "100%", padding: 14, borderRadius: 13, background: accentColor, border: "none", cursor: "pointer", fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: FONT }}>
              Agregar gasto
            </button>
          </div>
        </div>
      )}

      {/* CTA */}
      {petGastos.length > 0 && (
        <div style={{ padding: "20px 16px 0" }}>
          <button onClick={() => setShowForm(true)}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "16px", borderRadius: 13, background: accentColor, border: "none", cursor: "pointer",
              fontSize: 16, fontWeight: 700, color: "#fff", fontFamily: FONT,
            }}>
            <Plus size={18} /> Nuevo gasto
          </button>
        </div>
      )}

      {showForm && <GastoForm onClose={() => setShowForm(false)} accentColor={accentColor} />}
    </div>
  );
}
