"use client";
import { useState } from "react";
import type { WeightLog } from "@/types/db";

const W = 320;
const H = 120;
const PAD = { top: 10, right: 12, bottom: 22, left: 12 };

function fmtKg(v: number) {
  return `${v.toLocaleString("es-CO", { maximumFractionDigits: 1 })} kg`;
}
function fmtDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

/**
 * Línea de peso (una serie, sin leyenda). Banda de rango ideal ±8 % del último
 * registro cuando hay ≥2 puntos. Tocar un punto muestra su valor.
 */
export function WeightChart({ logs }: { logs: WeightLog[] }) {
  const [sel, setSel] = useState<number | null>(null);
  if (logs.length === 0) return null;

  const values = logs.map((l) => Number(l.weight_kg));
  const last = values[values.length - 1];
  const band = logs.length >= 2 ? { lo: last * 0.92, hi: last * 1.08 } : null;
  const minV = Math.min(...values, band ? band.lo : Infinity);
  const maxV = Math.max(...values, band ? band.hi : -Infinity);
  const span = maxV - minV || 1;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (logs.length === 1 ? innerW / 2 : (i / (logs.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - ((v - minV) / span) * innerH;
  const path = values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const active = sel ?? logs.length - 1;

  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Peso de ${fmtKg(values[0])} a ${fmtKg(last)} en ${logs.length} registros`}>
        {band && <rect x={PAD.left} y={y(band.hi)} width={innerW} height={Math.max(0, y(band.lo) - y(band.hi))} rx={4} className="fill-primary-soft/60" />}
        <line x1={PAD.left} x2={W - PAD.right} y1={PAD.top + innerH} y2={PAD.top + innerH} className="stroke-border" strokeWidth={1} />
        <path d={path} fill="none" className="stroke-primary" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {values.map((v, i) => (
          <g key={logs[i].id} onClick={() => setSel(i)} className="cursor-pointer">
            {/* área táctil de 44 px */}
            <circle cx={x(i)} cy={y(v)} r={22} className="fill-transparent" />
            <circle cx={x(i)} cy={y(v)} r={i === active ? 5 : 4} className="fill-primary stroke-surface" strokeWidth={2} />
          </g>
        ))}
        <text x={PAD.left} y={H - 6} className="fill-text-secondary text-small font-normal">{fmtDate(logs[0].measured_at)}</text>
        {logs.length > 1 && (
          <text x={W - PAD.right} y={H - 6} textAnchor="end" className="fill-text-secondary text-small font-normal">{fmtDate(logs[logs.length - 1].measured_at)}</text>
        )}
      </svg>
      <figcaption className="mt-1 flex flex-wrap items-center justify-between gap-x-2 text-small">
        <span className="font-semibold text-text">
          {fmtKg(values[active])} <span className="font-normal text-text-secondary">· {fmtDate(logs[active].measured_at)}</span>
        </span>
        {band && <span className="text-text-secondary">Rango ideal {fmtKg(band.lo)} – {fmtKg(band.hi)}</span>}
      </figcaption>
    </figure>
  );
}
