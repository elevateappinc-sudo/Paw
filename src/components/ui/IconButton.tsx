"use client";
import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Botón de solo ícono: área táctil de 44×44 px con el ícono visible de
 * 20–24 px. El nombre accesible es obligatorio (`label`): nunca un ícono
 * aislado sin texto para lectores de pantalla.
 */
export interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> {
  label: string;
  /** plain: sin fondo · soft: superficie elevada · outline: borde fino · glass: sobre fotos */
  tone?: "plain" | "soft" | "outline" | "glass";
}

const TONE = {
  plain: "text-text-secondary hover:bg-surface-elevated",
  soft: "bg-surface-elevated text-text",
  outline: "border border-border bg-surface text-text-secondary",
  glass: "bg-pastel-glass text-text backdrop-blur",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(({ label, tone = "soft", className, children, type = "button", ...props }, ref) => (
  <button
    ref={ref}
    type={type}
    aria-label={label}
    title={label}
    className={cn(
      "pressable inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors duration-[var(--duration-fast)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50",
      TONE[tone],
      className
    )}
    {...props}
  >
    {children}
  </button>
));
IconButton.displayName = "IconButton";
