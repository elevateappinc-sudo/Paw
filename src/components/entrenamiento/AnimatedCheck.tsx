"use client";
import { cn } from "@/lib/utils";

export type CheckState = "off" | "partial" | "on";

/**
 * Casilla circular con check que se dibuja (stroke-dashoffset) al completar,
 * con un leve rebote --ease-playful. Solo transform y opacity.
 * Objetivo táctil de 44 px; expone role=checkbox.
 */
export function AnimatedCheck({ state, onClick, label, className }: { state: CheckState; onClick: () => void; label: string; className?: string }) {
  const on = state === "on";
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on ? true : state === "partial" ? "mixed" : false}
      aria-label={label}
      onClick={onClick}
      className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full", className)}
    >
      <span
        className={cn("relative flex h-7 w-7 items-center justify-center rounded-full border-2", on ? "border-success text-on-primary" : state === "partial" ? "border-info-text" : "border-text-secondary")}
        style={{ transform: on ? "scale(1)" : "scale(0.92)", transition: "transform var(--duration-slow) var(--ease-playful)" }}
      >
        <span className="absolute inset-0 rounded-full bg-success" style={{ opacity: on ? 1 : 0, transition: "opacity var(--duration-base) var(--ease-standard)" }} aria-hidden="true" />
        <svg width="14" height="11" viewBox="0 0 14 11" fill="none" className="relative" aria-hidden="true">
          <path
            d="M1.5 5.5L5 9L12.5 1.5"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: 18,
              strokeDashoffset: on ? 0 : 18,
              opacity: on ? 1 : 0,
              transition: "stroke-dashoffset var(--duration-slow) var(--ease-playful), opacity var(--duration-fast) linear",
            }}
          />
        </svg>
        {state === "partial" && <span className="absolute h-2 w-2 rounded-full bg-info-text" aria-hidden="true" />}
      </span>
    </button>
  );
}
