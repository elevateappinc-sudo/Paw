"use client";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
}

export function SegmentedControl<T extends string>({ options, value, onChange, className, size = "md", ariaLabel }: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
  size?: "sm" | "md";
  ariaLabel?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <div role="tablist" aria-label={ariaLabel} className={cn("flex rounded-full bg-surface-elevated p-1", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative flex-1 rounded-full font-semibold text-text transition-colors",
              size === "sm" ? "min-h-9 px-2 text-label" : "min-h-11 px-3 text-label",
              !active && "text-text-secondary"
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${ariaLabel ?? "default"}`}
                className="absolute inset-0 rounded-full bg-surface shadow-1"
                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Tabs con subrayado (Android / secciones del perfil) */
export function Tabs<T extends string>({ options, value, onChange, className, ariaLabel }: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
  ariaLabel?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <div role="tablist" aria-label={ariaLabel} className={cn("no-scrollbar flex gap-1 overflow-x-auto border-b border-border", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn("relative min-h-[44px] shrink-0 px-4 text-body font-semibold transition-colors", active ? "text-primary-text" : "text-text-secondary")}
          >
            {o.label}
            {active && (
              <motion.span
                layoutId={`tab-${ariaLabel ?? "default"}`}
                className="absolute inset-x-3 bottom-0 h-1 rounded-t-full bg-primary"
                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
