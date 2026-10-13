"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { PawIllustration } from "./PawIllustration";

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  secondary?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "primary" | "warn" | "info" | "danger" | "neutral";
  className?: string;
  compact?: boolean;
}

/**
 * Patrón Polaris: ilustración pequeña, un título, una línea, una acción.
 */
export function EmptyState({ title, description, action, secondary, icon, tone = "primary", className, compact }: EmptyStateProps) {
  const toneBg = {
    primary: "bg-primary-container text-on-primary-container",
    warn: "bg-warn-container text-warn",
    info: "bg-info-container text-info",
    danger: "bg-danger-container text-danger",
    neutral: "bg-surface-2 text-on-variant",
  }[tone];
  return (
    <div className={cn("flex flex-col items-center gap-3 text-center", compact ? "px-4 py-6" : "px-8 py-10", className)}>
      {icon ? (
        <div className={cn("flex h-14 w-14 items-center justify-center rounded-full", toneBg)}>{icon}</div>
      ) : (
        <PawIllustration className={compact ? "h-20 w-20" : "h-28 w-28"} />
      )}
      <h3 className="font-display text-[22px] leading-tight text-on">{title}</h3>
      {description && <p className="max-w-[320px] text-[15px] leading-relaxed text-on-variant">{description}</p>}
      {action && <div className="mt-2 w-full max-w-[320px]">{action}</div>}
      {secondary && <div className="text-[15px] font-semibold text-primary">{secondary}</div>}
    </div>
  );
}
