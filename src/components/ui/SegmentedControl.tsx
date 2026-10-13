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
    <div role="tablist" aria-label={ariaLabel} className={cn("flex rounded-[11px] bg-surface-3 p-[3px]", className)}>
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
              "relative flex-1 rounded-[9px] font-bold text-on transition-colors",
              size === "sm" ? "min-h-[32px] px-2 text-[12px]" : "min-h-[38px] px-3 text-[13px]",
              !active && "text-on-variant"
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${ariaLabel ?? "default"}`}
                className="absolute inset-0 rounded-[9px] bg-surface shadow-1"
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
    <div role="tablist" aria-label={ariaLabel} className={cn("no-scrollbar flex gap-1 overflow-x-auto border-b border-outline-variant", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn("relative min-h-[44px] shrink-0 px-4 text-[14px] font-bold transition-colors", active ? "text-primary" : "text-on-variant")}
          >
            {o.label}
            {active && (
              <motion.span
                layoutId={`tab-${ariaLabel ?? "default"}`}
                className="absolute inset-x-3 bottom-0 h-[3px] rounded-t-full bg-primary"
                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
