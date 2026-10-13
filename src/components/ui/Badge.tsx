import { Star, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/** Badge flotante sobre foto (rating, promo, estado) */
export function PhotoBadge({ children, className, tone = "surface" }: { children: React.ReactNode; className?: string; tone?: "surface" | "primary" | "ok" }) {
  const t = {
    surface: "bg-surface text-on shadow-2",
    primary: "bg-primary text-on-primary",
    ok: "bg-ok-container text-on-ok-container",
  }[tone];
  return <span className={cn("absolute inline-flex items-center gap-1 rounded-full px-2 py-1 text-[12px] font-extrabold", t, className)}>{children}</span>;
}

export function Rating({ value, count, className }: { value: number; count?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-[13px] font-bold text-on", className)}>
      <Star size={13} className="fill-[var(--wa)] text-[var(--wa)]" aria-hidden="true" />
      {value.toLocaleString("es-CO", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
      {count !== undefined && <span className="font-semibold text-on-variant">({count})</span>}
    </span>
  );
}

export function Verified({ className, label = "Verificado" }: { className?: string; label?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-info-container px-2 py-0.5 text-[12px] font-bold text-on-info-container", className)}>
      <BadgeCheck size={14} className="text-info" aria-hidden="true" />
      {label}
    </span>
  );
}

/** Punto rojo de notificación */
export function Dot({ className }: { className?: string }) {
  return <span className={cn("absolute h-2.5 w-2.5 rounded-full border-2 border-surface bg-danger", className)} aria-hidden="true" />;
}

/** @deprecated compat con módulos antiguos; usar Tag de ./Chip */
export function Badge({ variant = "neutral", className, children }: { variant?: "success" | "warning" | "error" | "info" | "neutral"; className?: string; children: React.ReactNode }) {
  const tone = {
    success: "bg-ok-container text-on-ok-container",
    warning: "bg-warn-container text-on-warn-container",
    error: "bg-danger-container text-on-danger-container",
    info: "bg-info-container text-on-info-container",
    neutral: "bg-surface-2 text-on",
  }[variant];
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold", tone, className)}>{children}</span>;
}
