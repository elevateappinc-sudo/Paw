"use client";
import React from "react";
import { SEVERITY, type Severity } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * Piezas de la "Fila de tarea" (docs/design-system.md · Componentes):
 * ícono en un recuadro de 32 px, título text-subtitle, fecha relativa con el
 * color de su estado y un check circular a la derecha (área táctil 44 px).
 */

const ICON_TONE: Record<Severity, string> = {
  overdue: "bg-overdue-soft text-overdue-text",
  soon: "bg-warning-soft text-warning-text",
  ok: "bg-success-soft text-success-text",
  info: "bg-info-soft text-info-text",
};

/** Recuadro de 32 px con el ícono del tipo de tarea, teñido por severidad */
export function TaskIcon({ severity, children, className }: { severity: Severity; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-sm", ICON_TONE[severity], className)} aria-hidden="true">
      {children}
    </span>
  );
}

/** Fecha relativa con el color e ícono de su estado ("Venció hace 3 días") */
export function TaskDue({ severity, children, className }: { severity: Severity; children: React.ReactNode; className?: string }) {
  const s = SEVERITY[severity];
  const Icon = s.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 text-label font-semibold", s.text, className)}>
      <Icon size={14} aria-hidden="true" />
      {children}
    </span>
  );
}

/**
 * Check circular. Al marcar, el trazo se dibuja (stroke-dashoffset) y el
 * círculo hace un leve rebote con --ease-playful; solo transform y opacity.
 * Con movimiento reducido las duraciones de tokens.css valen 0.
 */
export function TaskCheck({ done, onClick, label, disabled, className }: { done: boolean; onClick?: () => void; label: string; disabled?: boolean; className?: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn("relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full disabled:cursor-default", className)}
    >
      <span
        className={cn(
          "relative flex h-7 w-7 items-center justify-center rounded-full border-2",
          done ? "border-success text-on-primary" : "border-text-secondary text-text-secondary"
        )}
        style={{
          transform: done ? "scale(1)" : "scale(0.92)",
          transition: "transform var(--duration-slow) var(--ease-playful)",
        }}
      >
        {/* relleno con opacidad, no con color animado */}
        <span
          className="absolute inset-0 rounded-full bg-success"
          style={{ opacity: done ? 1 : 0, transition: "opacity var(--duration-base) var(--ease-standard)" }}
          aria-hidden="true"
        />
        <svg width="14" height="11" viewBox="0 0 14 11" fill="none" className="relative" aria-hidden="true">
          <path
            d="M1.5 5.5L5 9L12.5 1.5"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: 18,
              strokeDashoffset: done ? 0 : 18,
              opacity: done ? 1 : 0,
              transition: "stroke-dashoffset var(--duration-slow) var(--ease-playful), opacity var(--duration-fast) linear",
            }}
          />
        </svg>
      </span>
    </button>
  );
}
