"use client";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export interface ProgressRingProps {
  /** 0..1 */
  value: number;
  size?: number;
  stroke?: number;
  tone?: "primary" | "warn" | "info" | "danger" | "ok";
  label?: React.ReactNode;
  className?: string;
}

const toneVar = {
  primary: "var(--pr)",
  warn: "var(--wa)",
  info: "var(--te)",
  danger: "var(--er)",
  ok: "var(--ok)",
};

export function ProgressRing({ value, size = 56, stroke = 6, tone = "primary", label, className }: ProgressRingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  const reduce = useReducedMotion();
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--sch)" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={toneVar[tone]}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          strokeDasharray={c}
          initial={{ strokeDashoffset: reduce ? c * (1 - v) : c }}
          animate={{ strokeDashoffset: c * (1 - v) }}
          transition={{ duration: reduce ? 0 : 0.7, ease: [0.3, 0, 0, 1] }}
        />
      </svg>
      {label !== undefined && (
        <div className="absolute inset-0 flex items-center justify-center text-[13px] font-extrabold text-on">{label}</div>
      )}
    </div>
  );
}

export function ProgressBar({ value, tone = "primary", className }: { value: number; tone?: ProgressRingProps["tone"]; className?: string }) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-3", className)} role="progressbar" aria-valuenow={Math.round(v * 100)} aria-valuemin={0} aria-valuemax={100}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: toneVar[tone ?? "primary"] }}
        initial={{ width: 0 }}
        animate={{ width: `${v * 100}%` }}
        transition={{ duration: 0.6, ease: [0.3, 0, 0, 1] }}
      />
    </div>
  );
}
