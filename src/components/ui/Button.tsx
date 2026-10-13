"use client";
import React, { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-bold rounded-full transition-[transform,background-color,opacity] duration-150 ease-[var(--ease-standard)] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        primary: "bg-primary text-on-primary hover:brightness-105",
        tonal: "bg-primary-container text-on-primary-container hover:brightness-[0.98]",
        secondary: "bg-surface-2 text-on hover:bg-surface-3",
        outline: "border border-outline text-primary bg-transparent hover:bg-surface-2",
        ghost: "bg-transparent text-primary hover:bg-surface-2",
        danger: "bg-danger text-white hover:brightness-105",
        dangerTonal: "bg-danger-container text-on-danger-container border border-danger",
      },
      size: {
        sm: "min-h-[36px] px-3 text-[13px]",
        md: "min-h-[44px] px-4 text-[15px]",
        lg: "min-h-[54px] px-6 text-[17px]",
        icon: "min-h-[44px] min-w-[44px] p-0",
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
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, full, loading = false, disabled, leading, trailing, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, full }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        leading
      )}
      {children}
      {!loading && trailing}
    </button>
  )
);
Button.displayName = "Button";

export { buttonVariants };
