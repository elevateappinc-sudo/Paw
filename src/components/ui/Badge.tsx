import { Star, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/** Badge flotante sobre foto (rating, promo, estado) */
export function PhotoBadge({ children, className, tone = "surface" }: { children: React.ReactNode; className?: string; tone?: "surface" | "primary" | "ok" }) {
  const t = {
    surface: "bg-surface text-text shadow-2",
    primary: "bg-primary text-on-primary",
    ok: "bg-success-soft text-success-text",
  }[tone];
  return <span className={cn("absolute inline-flex items-center gap-1 rounded-full px-2 py-1 text-small font-semibold", t, className)}>{children}</span>;
}

export function Rating({ value, count, className }: { value: number; count?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-small font-semibold text-text", className)}>
      <Star size={13} className="fill-warning text-warning" aria-hidden="true" />
      {value.toLocaleString("es-CO", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
      {count !== undefined && <span className="font-normal text-text-secondary">({count})</span>}
    </span>
  );
}

export function Verified({ className, label = "Verificado" }: { className?: string; label?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-info-soft px-2 py-1 text-small font-semibold text-info-text", className)}>
      <BadgeCheck size={14} className="text-info-text" aria-hidden="true" />
      {label}
    </span>
  );
}

/** Punto de notificación: acento de marca (el rojo es solo para SOS) */
export function Dot({ className }: { className?: string }) {
  return <span className={cn("absolute h-2.5 w-2.5 rounded-full border-2 border-surface bg-accent", className)} aria-hidden="true" />;
}

/** @deprecated compat con módulos antiguos; usar Tag de ./Chip */
export function Badge({ variant = "neutral", className, children }: { variant?: "success" | "warning" | "error" | "info" | "neutral"; className?: string; children: React.ReactNode }) {
  const tone = {
    success: "bg-success-soft text-success-text",
    warning: "bg-warning-soft text-warning-text",
    error: "bg-overdue-soft text-overdue-text",
    info: "bg-info-soft text-info-text",
    neutral: "bg-surface-elevated text-text-secondary",
  }[variant];
  return <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-small font-semibold", tone, className)}>{children}</span>;
}
