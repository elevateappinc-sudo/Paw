"use client";
import React, { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { PawDotsLoader } from "./Loaders";

/**
 * Botones: primary, secondary (relleno suave), outline (borde), ghost y
 * destructive. Tamaños S (36), M (44) y L (52), siempre píldora, en sentence
 * case. Un solo primario por vista. Al presionar escala a --press-scale (0,98)
 * en --duration-fast. Al cargar conserva el ancho y bloquea el doble envío.
 * El tamaño S amplía su área táctil a 44 px con un pseudo-elemento.
 */
const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 rounded-full font-semibold select-none transition-[transform,background-color,border-color,opacity] duration-[var(--duration-fast)] ease-[var(--ease-standard)] active:scale-[var(--press-scale)] focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-on-primary hover:brightness-105",
        secondary: "bg-primary-soft text-primary-text hover:brightness-[0.98]",
        outline: "border border-border bg-surface text-text hover:bg-surface-elevated",
        ghost: "bg-transparent text-primary-text hover:bg-primary-soft",
        destructive: "bg-danger text-on-danger hover:brightness-105",
        /** @deprecated usar secondary */
        tonal: "bg-primary-soft text-primary-text hover:brightness-[0.98]",
        /** @deprecated usar destructive */
        danger: "bg-danger text-on-danger hover:brightness-105",
        /** Destructivo secundario: borde y texto de peligro */
        dangerTonal: "border border-danger bg-surface text-danger-text hover:bg-danger-soft",
      },
      size: {
        sm: "min-h-9 px-4 text-small after:absolute after:inset-x-0 after:-inset-y-1 after:content-['']",
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
