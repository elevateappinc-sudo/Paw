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
  tone?: "surface" | "container" | "primary" | "warn" | "info" | "danger";
  padded?: boolean;
  interactive?: boolean;
}

const toneClass = {
  surface: "bg-surface border border-outline-variant",
  container: "bg-surface-2 border border-transparent",
  primary: "bg-primary-container border border-transparent text-on-primary-container",
  warn: "bg-warn-container border border-transparent text-on-warn-container",
  info: "bg-info-container border border-transparent text-on-info-container",
  danger: "bg-danger-container border border-danger/40 text-on-danger-container",
};

export function Card({ className, elevation = 1, tone = "surface", padded = true, interactive, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card-lg",
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
        <h3 className="font-display text-[17px] leading-tight text-on">{title}</h3>
        {subtitle && <p className="mt-0.5 text-[13px] text-on-variant">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0 text-[14px] font-bold text-primary">{action}</div>}
    </div>
  );
}

export function SectionTitle({ children, action, className }: { children: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-3", className)}>
      <h2 className="font-display text-[22px] leading-tight text-on">{children}</h2>
      {action && <div className="shrink-0 text-[14px] font-bold text-primary">{action}</div>}
    </div>
  );
}

/** Celda etiqueta / valor para datos clave */
export function InfoCell({ label, value, tone, className, onClick }: { label: string; value: React.ReactNode; tone?: "warn" | "info" | "ok"; className?: string; onClick?: () => void }) {
  const valueTone = tone === "warn" ? "text-warn" : tone === "info" ? "text-info" : tone === "ok" ? "text-ok" : "text-on";
  return (
    <div onClick={onClick} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined} className={cn("rounded-control bg-surface-2 px-3 py-2.5", onClick && "cursor-pointer active:opacity-80", className)}>
      <div className="text-[11px] font-semibold text-on-variant">{label}</div>
      <div className={cn("mt-0.5 text-[15px] font-bold leading-tight", valueTone)}>{value}</div>
    </div>
  );
}

/** Fila de lista con icono, texto y acción */
export function Row({ icon, iconTone = "container", title, subtitle, trailing, onClick, className, href }: {
  icon?: React.ReactNode;
  iconTone?: "container" | "primary" | "warn" | "info" | "danger" | "ok";
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  trailing?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
}) {
  const tones = {
    container: "bg-surface-2 text-on-variant",
    primary: "bg-primary-container text-on-primary-container",
    warn: "bg-warn-container text-warn",
    info: "bg-info-container text-info",
    danger: "bg-danger-container text-danger",
    ok: "bg-ok-container text-ok",
  };
  const content = (
    <>
      {icon && <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]", tones[iconTone])}>{icon}</div>}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[16px] font-bold text-on">{title}</div>
        {subtitle && <div className="truncate text-[13px] text-on-variant">{subtitle}</div>}
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </>
  );
  const base = cn("flex min-h-[64px] w-full items-center gap-3 px-4 py-3 text-left", (onClick || href) && "active:bg-surface-2 transition-colors", className);
  if (href) {
     
    return <a href={href} className={base}>{content}</a>;
  }
  if (onClick) {
    return <button type="button" onClick={onClick} className={base}>{content}</button>;
  }
  return <div className={base}>{content}</div>;
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn("mx-4 h-px bg-outline-variant", className)} />;
}
