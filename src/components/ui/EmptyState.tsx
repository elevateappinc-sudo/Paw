"use client";
import React from "react";
import { PawPrint } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  title: string;
  description?: string;
  /** Acción principal que resuelve el problema (por ejemplo "Ampliar a 5 km") */
  action?: React.ReactNode;
  /** Acción secundaria opcional ("Avisarme") */
  secondary?: React.ReactNode;
  icon?: React.ReactNode;
  /** @deprecated el círculo siempre usa el acento suave */
  tone?: string;
  className?: string;
  compact?: boolean;
}

/**
 * Estado vacío: ícono en un círculo con el acento suave, título, una línea
 * de explicación, una acción principal y una secundaria opcional.
 */
export function EmptyState({ title, description, action, secondary, icon, className, compact }: EmptyStateProps) {
  return (
    <div className={cn("enter flex flex-col items-center gap-3 text-center", compact ? "px-4 py-6" : "px-8 py-12", className)}>
      <div className={cn("flex items-center justify-center rounded-full bg-accent-soft text-text", compact ? "h-14 w-14" : "h-16 w-16")}>
        {icon ?? <PawPrint size={compact ? 24 : 28} aria-hidden="true" />}
      </div>
      <h3 className="text-subtitle font-semibold text-text">{title}</h3>
      {description && <p className="max-w-[320px] text-body text-text-secondary">{description}</p>}
      {action && <div className="mt-2 w-full max-w-[320px]">{action}</div>}
      {secondary && <div className="text-small font-semibold text-primary-text">{secondary}</div>}
    </div>
  );
}
