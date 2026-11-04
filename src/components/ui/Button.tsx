"use client";
import React, { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { PawDotsLoader } from "./Loaders";

/**
 * Botones: primario, secundario (borde), fantasma y destructivo.
 * Tamaños S (32), M (44) y L (52), siempre píldora. Un solo primario por vista.
 * El tamaño S amplía su área táctil a 44 px con un pseudo-elemento.
 */
const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 rounded-full font-semibold select-none transition-[transform,background-color,border-color,opacity] duration-[var(--duration-fast)] ease-[var(--ease-standard)] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-on-primary hover:brightness-105",
        secondary: "border border-border bg-surface text-text hover:bg-surface-elevated",
        ghost: "bg-transparent text-primary-text hover:bg-primary-soft",
        destructive: "bg-danger text-on-danger hover:brightness-105",
        /** @deprecated usar secondary */
        outline: "border border-border bg-surface text-text hover:bg-surface-elevated",
        /** @deprecated usar secondary */
        tonal: "border border-border bg-surface text-text hover:bg-surface-elevated",
        /** @deprecated usar destructive */
        danger: "bg-danger text-on-danger hover:brightness-105",
        /** Destructivo secundario: borde y texto de peligro */
        dangerTonal: "border border-danger bg-surface text-danger-text hover:bg-danger-soft",
      },
      size: {
        sm: "min-h-8 px-3 text-label after:absolute after:inset-x-0 after:-inset-y-[6px] after:content-['']",
        md: "min-h-11 px-4 text-body",
        lg: "min-h-13 px-6 text-subtitle",
        icon: "min-h-11 min-w-11 p-0",
      },
      full: {
        true: "w-full",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  loadingLabel?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, full, loading = false, loadingLabel = "Guardando", disabled, leading, trailing, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, full }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {/* Al cargar, el contenido queda invisible (conserva el ancho) y encima va el loader */}
      <span className={cn("inline-flex items-center justify-center gap-2", loading && "invisible")}>
        {leading}
        {children}
        {trailing}
      </span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <PawDotsLoader size={size === "lg" ? 20 : 18} label={loadingLabel} inline />
        </span>
      )}
    </button>
  )
);
Button.displayName = "Button";

export { buttonVariants };
