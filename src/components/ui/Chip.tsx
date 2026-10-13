"use client";
import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type ChipTone = "neutral" | "primary" | "ok" | "warn" | "info" | "danger";

const toneClass: Record<ChipTone, string> = {
  neutral: "bg-surface-2 text-on",
  primary: "bg-primary-container text-on-primary-container",
  ok: "bg-ok-container text-on-ok-container",
  warn: "bg-warn-container text-on-warn-container",
  info: "bg-info-container text-on-info-container",
  danger: "bg-danger-container text-on-danger-container",
};

/** Etiqueta de estado (no interactiva) */
export function Tag({ tone = "neutral", children, className, size = "sm" }: { tone?: ChipTone; children: React.ReactNode; className?: string; size?: "xs" | "sm" }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full font-bold", size === "xs" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-[12px]", toneClass[tone], className)}>
      {children}
    </span>
  );
}

/** Chip de filtro / selección (interactivo) */
export function Chip({ selected, onClick, children, className, leading, glass }: {
  selected?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  leading?: React.ReactNode;
  glass?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-bold transition-[background-color,transform] active:scale-95",
        selected ? "bg-primary text-on-primary" : glass ? "glass border border-outline-variant text-on shadow-1" : "bg-surface-2 text-on",
        className
      )}
    >
      {selected && !leading ? <Check size={14} /> : leading}
      {children}
    </button>
  );
}

export function ChipRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 py-0.5", className)}>{children}</div>;
}
