"use client";
import React from "react";
import { AlertCircle, Check, CheckCircle2, Clock, Info } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Dos tipos de chip que nunca se mezclan:
 * - Tag / StatusChip: solo informativo, con la escala de severidad.
 * - Chip: filtro seleccionable (activo con --color-accent y check).
 */

export type ChipTone = "neutral" | "primary" | "ok" | "warn" | "info" | "danger" | "overdue";
/** Escala de severidad: mismo color, ícono y texto en chips, tareas y notificaciones */
export type Severity = "overdue" | "soon" | "ok" | "info";

const toneClass: Record<ChipTone, string> = {
  neutral: "bg-surface-elevated text-text-secondary",
  primary: "bg-primary-soft text-primary-text",
  info: "bg-info-soft text-info-text",
  ok: "bg-success-soft text-success-text",
  warn: "bg-warning-soft text-warning-text",
  overdue: "bg-overdue-soft text-overdue-text",
  /** Solo SOS y mascota perdida */
  danger: "bg-danger-soft text-danger-text",
};

export const SEVERITY: Record<Severity, { tone: ChipTone; icon: typeof Info; label: string; text: string }> = {
  overdue: { tone: "overdue", icon: AlertCircle, label: "Vencido", text: "text-overdue-text" },
  soon: { tone: "warn", icon: Clock, label: "Vence pronto", text: "text-warning-text" },
  ok: { tone: "ok", icon: CheckCircle2, label: "Al día", text: "text-success-text" },
  info: { tone: "info", icon: Info, label: "Info", text: "text-info-text" },
};

/** Severidad a partir de los días que faltan (negativo = vencido) */
export function severityFromDays(days: number | null | undefined): Severity {
  if (days === null || days === undefined) return "info";
  if (days < 0) return "overdue";
  if (days <= 7) return "soon";
  return "ok";
}

/** Etiqueta de estado (no interactiva). Texto de 12 px: el estado es información funcional */
export function Tag({ tone = "neutral", children, className, size = "sm" }: { tone?: ChipTone; children: React.ReactNode; className?: string; size?: "xs" | "sm" }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full text-small font-semibold", size === "xs" ? "px-2 py-1" : "px-3 py-1", toneClass[tone], className)}>
      {children}
    </span>
  );
}

/** Chip de estado con el ícono y el texto de su nivel de severidad */
export function StatusChip({ severity, children, className }: { severity: Severity; children?: React.ReactNode; className?: string }) {
  const s = SEVERITY[severity];
  const Icon = s.icon;
  return (
    <Tag tone={s.tone} className={className}>
      <Icon size={14} aria-hidden="true" />
      {children ?? s.label}
    </Tag>
  );
}

/** Chip de filtro / selección (interactivo). Activo: acento rosa + check. */
export function Chip({ selected, onClick, children, className, leading, glass, count }: {
  selected?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  leading?: React.ReactNode;
  glass?: boolean;
  /** contador opcional (por ejemplo, filtros aplicados) */
  count?: number;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "pressable relative inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full border px-3 text-small font-semibold transition-colors duration-[var(--duration-fast)] after:absolute after:inset-x-0 after:-inset-y-1 after:content-['']",
        selected
          ? "border-accent bg-accent text-on-accent"
          : glass
            ? "glass border-border text-text shadow-1"
            : "border-border bg-surface text-text",
        className
      )}
    >
      {selected ? <Check size={14} aria-hidden="true" /> : leading}
      {children}
      {count !== undefined && count > 0 && (
        <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-label text-on-primary">{count}</span>
      )}
    </button>
  );
}

/** Fila de chips con scroll horizontal y desvanecido en el borde */
export function ChipRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("no-scrollbar fade-edge -mx-4 flex gap-2 overflow-x-auto px-4 py-1", className)}>{children}</div>;
}
