"use client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export type CheckState = "off" | "partial" | "on";

/**
 * Casilla circular con check animado (trazo) al completar.
 * Objetivo táctil de 44 px; expone role=checkbox.
 */
export function AnimatedCheck({ state, onClick, label, className }: { state: CheckState; onClick: () => void; label: string; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={state === "on" ? true : state === "partial" ? "mixed" : false}
      aria-label={label}
      onClick={onClick}
      className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-primary", className)}
    >
      <motion.span
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors duration-150",
          state === "on" ? "border-primary bg-primary text-on-primary" : state === "partial" ? "border-info bg-info-container" : "border-outline bg-transparent"
        )}
        animate={reduce ? undefined : { scale: state === "on" ? [1, 1.18, 1] : 1 }}
        transition={{ duration: 0.25 }}
      >
        <AnimatePresence initial={false}>
          {state === "on" && (
            <motion.svg key="check" width="14" height="11" viewBox="0 0 14 11" fill="none" aria-hidden="true" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.path
                d="M1.5 5.5L5 9L12.5 1.5"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              />
            </motion.svg>
          )}
        </AnimatePresence>
        {state === "partial" && <span className="h-2.5 w-2.5 rounded-full bg-info" aria-hidden="true" />}
      </motion.span>
    </button>
  );
}
