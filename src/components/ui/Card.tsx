"use client";
import React from "react";
import { cn } from "@/lib/utils";

type Elevation = 0 | 1 | 2 | 3;

const elevationClass: Record<Elevation, string> = {
  0: "",
  1: "shadow-1",
  2: "shadow-2",
  3: "shadow-3",
};

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevation?: Elevation;
  tone?: "surface" | "container" | "primary" | "warn" | "info" | "danger" | "overdue";
  padded?: boolean;
  interactive?: boolean;
}

const toneClass = {
  surface: "bg-surface border border-border",
  container: "bg-surface-elevated border border-transparent",
  primary: "bg-primary-soft border border-transparent text-primary-text",
  warn: "bg-warning-soft border border-transparent text-warning-text",
  info: "bg-info-soft border border-transparent text-info-text",
  /** Solo SOS y mascota perdida */
  danger: "bg-danger-soft border border-danger/40 text-danger-text",
  overdue: "bg-overdue-soft border border-transparent text-overdue-text",
};

export function Card({ className, elevation = 1, tone = "surface", padded = true, interactive, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-md",
        toneClass[tone],
        elevationClass[elevation],
        padded && "p-4",
        interactive && "cursor-pointer transition-transform duration-150 active:scale-[0.985]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, action, className, subtitle }: { title: React.ReactNode; subtitle?: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mb-3 flex items-baseline justify-between gap-3", className)}>
      <div className="min-w-0">
        <h3 className="font-semibold text-subtitle leading-tight text-text">{title}</h3>
        {subtitle && <p className="mt-1 text-small text-text-secondary">{subtitle}</p>}
      </div>
      {action && <div className="flex min-h-11 shrink-0 items-center text-label font-semibold text-primary-text">{action}</div>}
    </div>
  );
}

export function SectionTitle({ children, action, className }: { children: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-3", className)}>
      <h2 className="font-semibold text-title leading-tight text-text">{children}</h2>
      {action && <div className="flex min-h-11 shrink-0 items-center text-label font-semibold text-primary-text">{action}</div>}
    </div>
  );
}

/** Celda etiqueta / valor para datos clave */
export function InfoCell({ label, value, tone, className, onClick }: { label: string; value: React.ReactNode; tone?: "warn" | "info" | "ok"; className?: string; onClick?: () => void }) {
  const valueTone = tone === "warn" ? "text-warning-text" : tone === "info" ? "text-info-text" : tone === "ok" ? "text-success-text" : "text-text";
  return (
    <div onClick={onClick} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined} className={cn("rounded-md bg-surface-elevated px-3 py-3", onClick && "cursor-pointer active:opacity-80", className)}>
      <div className="text-label font-semibold text-text-secondary">{label}</div>
      <div className={cn("mt-1 text-body font-semibold leading-tight", valueTone)}>{value}</div>
    </div>
  );
}

/** Fila de lista con icono, texto y acción */
export function Row({ icon, iconTone = "container", title, subtitle, trailing, onClick, className, href }: {
  icon?: React.ReactNode;
  iconTone?: "container" | "primary" | "warn" | "info" | "danger" | "ok" | "overdue";
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  trailing?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
}) {
  const tones = {
    container: "bg-surface-elevated text-text-secondary",
    primary: "bg-primary-soft text-primary-text",
    warn: "bg-warning-soft text-warning-text",
    info: "bg-info-soft text-info-text",
    danger: "bg-danger-soft text-danger-text",
    ok: "bg-success-soft text-success-text",
    overdue: "bg-overdue-soft text-overdue-text",
  };
  const content = (
    <>
      {icon && <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-sm", tones[iconTone])}>{icon}</div>}
      <div className="min-w-0 flex-1">
        <div className="truncate text-subtitle font-semibold text-text">{title}</div>
        {subtitle && <div className="truncate text-small text-text-secondary">{subtitle}</div>}
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </>
  );
  const base = cn("flex min-h-[64px] w-full items-center gap-3 px-4 py-3 text-left", (onClick || href) && "active:bg-surface-elevated transition-colors", className);
  if (href) {
     
    return <a href={href} className={base}>{content}</a>;
  }
  if (onClick) {
    return <button type="button" onClick={onClick} className={base}>{content}</button>;
  }
  return <div className={base}>{content}</div>;
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn("mx-4 h-px bg-border", className)} />;
}
