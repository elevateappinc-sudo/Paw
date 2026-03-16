"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useStore } from "@/store";
import { getMonthKey, getMonthLabel, formatCurrency } from "@/lib/utils";
import { useMemo } from "react";

const PALETTE = [
  "#0a84ff", "#30d158", "#ff9f0a", "#ff453a",
  "#bf5af2", "#64d2ff", "#ffd60a", "#ff6961",
];

interface GastosChartProps {
  onMonthClick: (month: string) => void;
  selectedMonth: string | null;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; fill: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value || 0), 0);
  return (
    <div style={{
      background: "#2c2c2e",
      border: "1px solid rgba(255,255,255,0.1)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      borderRadius: 13, padding: "10px 12px", minWidth: 150,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
    }}>
      <p style={{ fontWeight: 700, color: "#fff", marginBottom: 8, fontSize: 13 }}>{label}</p>
      {payload.map((p) => (
        <div key={p.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.fill }} />
            <span style={{ color: "rgba(235,235,245,0.5)", fontSize: 12 }}>{p.name}</span>
          </div>
          <span style={{ fontWeight: 600, color: "#fff", fontSize: 12 }}>{formatCurrency(p.value)}</span>
        </div>
      ))}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <span style={{ color: "rgba(235,235,245,0.5)", fontSize: 12 }}>Total</span>
        <span style={{ fontWeight: 700, color: "#fff", fontSize: 12 }}>{formatCurrency(total)}</span>
      </div>
    </div>
  );
}

export function GastosChart({ onMonthClick, selectedMonth }: GastosChartProps) {
  const { gastos, selectedPetId } = useStore();

  const petGastos = gastos.filter((g) => g.petId === selectedPetId);

  const { data, allConceptos } = useMemo(() => {
    const monthMap: Record<string, Record<string, number>> = {};
    for (const g of petGastos) {
      const mk = getMonthKey(g.fecha);
      if (!monthMap[mk]) monthMap[mk] = {};
      monthMap[mk][g.concepto] = (monthMap[mk][g.concepto] ?? 0) + g.monto;
    }
    const usedConceptos = [...new Set(petGastos.map((g) => g.concepto))];
    const months = Object.keys(monthMap).sort();
    const data = months.map((m) => ({
      month: m,
      label: getMonthLabel(m),
      ...monthMap[m],
    }));
    return { data, allConceptos: usedConceptos };
  }, [petGastos]);

  if (data.length === 0) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        height: 160, gap: 8, borderRadius: 13, background: "#2c2c2e",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
      }}>
        <p style={{ fontSize: 14, fontWeight: 500, color: "rgba(235,235,245,0.5)", margin: 0 }}>
          Sin datos todavía
        </p>
        <p style={{ fontSize: 12, color: "rgba(235,235,245,0.25)", margin: 0 }}>
          Agrega gastos para ver el gráfico
        </p>
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={data}
          barGap={3}
          onClick={(d: unknown) => {
            const dd = d as { activePayload?: { payload: { month: string } }[] } | null;
            if (dd?.activePayload?.[0]) onMonthClick(dd.activePayload[0].payload.month);
          }}
        >
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "rgba(235,235,245,0.3)", fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "rgba(235,235,245,0.25)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
            width={36}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
          {allConceptos.map((concepto, i) => (
            <Bar
              key={concepto}
              dataKey={concepto}
              stackId="a"
              fill={PALETTE[i % PALETTE.length]}
              radius={i === allConceptos.length - 1 ? [5, 5, 0, 0] : [0, 0, 0, 0]}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.month}
                  opacity={selectedMonth && entry.month !== selectedMonth ? 0.25 : 1}
                />
              ))}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
      <p style={{ textAlign: "center", fontSize: 11, marginTop: 4, color: "rgba(235,235,245,0.25)" }}>
        Toca un mes para ver el detalle
      </p>
    </div>
  );
}
