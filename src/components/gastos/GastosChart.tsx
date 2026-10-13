"use client";
import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useStore } from "@/store";
import { getMonthKey, getMonthLabel, formatCurrency } from "@/lib/utils";

/** Paleta por tokens: cambia sola con el tema. */
const PALETTE = ["var(--pr)", "var(--te)", "var(--wa)", "var(--olv)", "var(--prc)", "var(--tec)"];

interface GastosChartProps {
  onMonthClick: (month: string) => void;
  selectedMonth: string | null;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; fill: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value || 0), 0);
  return (
    <div className="min-w-[160px] rounded-card border border-outline-variant bg-surface px-3 py-2.5 shadow-2">
      <p className="mb-2 text-[13px] font-bold text-on">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="mb-1 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: p.fill }} aria-hidden="true" />
            <span className="text-[12px] text-on-variant">{p.name}</span>
          </div>
          <span className="text-[12px] font-semibold text-on">{formatCurrency(p.value)}</span>
        </div>
      ))}
      <div className="mt-2 flex justify-between border-t border-outline-variant pt-2">
        <span className="text-[12px] text-on-variant">Total</span>
        <span className="text-[12px] font-bold text-on">{formatCurrency(total)}</span>
      </div>
    </div>
  );
}

export function GastosChart({ onMonthClick, selectedMonth }: GastosChartProps) {
  const { gastos, selectedPetId } = useStore();

  const petGastos = useMemo(() => gastos.filter((g) => g.petId === selectedPetId), [gastos, selectedPetId]);

  const { data, allConceptos } = useMemo(() => {
    const monthMap: Record<string, Record<string, number>> = {};
    for (const g of petGastos) {
      const mk = getMonthKey(g.fecha);
      if (!monthMap[mk]) monthMap[mk] = {};
      monthMap[mk][g.concepto] = (monthMap[mk][g.concepto] ?? 0) + g.monto;
    }
    const usedConceptos = [...new Set(petGastos.map((g) => g.concepto))];
    const months = Object.keys(monthMap).sort();
    const data = months.map((m) => ({ month: m, label: getMonthLabel(m), ...monthMap[m] }));
    return { data, allConceptos: usedConceptos };
  }, [petGastos]);

  if (data.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-1 rounded-card bg-surface-2">
        <p className="text-[14px] font-semibold text-on-variant">Sin datos todavía</p>
        <p className="text-[12px] text-on-variant">Agrega gastos para ver el gráfico</p>
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
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--onv)", fontWeight: 600 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--onv)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
            width={36}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--sc)" }} />
          {allConceptos.map((concepto, i) => (
            <Bar
              key={concepto}
              dataKey={concepto}
              stackId="a"
              fill={PALETTE[i % PALETTE.length]}
              radius={i === allConceptos.length - 1 ? [5, 5, 0, 0] : [0, 0, 0, 0]}
            >
              {data.map((entry) => (
                <Cell key={entry.month} opacity={selectedMonth && entry.month !== selectedMonth ? 0.3 : 1} />
              ))}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-1 text-center text-[11px] text-on-variant">Toca un mes para ver el detalle</p>
    </div>
  );
}
