"use client";
import { useEffect, useState } from "react";
import { animate, motion, useDragControls, useMotionValue, useReducedMotion } from "motion/react";
import { ChevronUp } from "lucide-react";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

export const SHEET_COLLAPSED = 0.45;
export const SHEET_EXPANDED = 0.84;

export interface ResultsSheetProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  expanded: boolean;
  onExpandedChange: (v: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * Panel inferior fijo (no modal) con asa. Ocupa ~45 % de la pantalla y se
 * expande al arrastrar el asa o tocar la flecha. El contenido hace scroll.
 */
export function ResultsSheet({ title, subtitle, expanded, onExpandedChange, children, className }: ResultsSheetProps) {
  const [vh, setVh] = useState<number | null>(null);
  const y = useMotionValue(0);
  const controls = useDragControls();
  const reduce = useReducedMotion();

  useEffect(() => {
    const update = () => setVh(window.innerHeight);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const expandedH = vh ? Math.round(vh * SHEET_EXPANDED) : 0;
  const collapsedH = vh ? Math.round(vh * SHEET_COLLAPSED) : 0;
  const range = Math.max(0, expandedH - collapsedH);

  useEffect(() => {
    if (!vh) return;
    const target = expanded ? 0 : range;
    if (reduce) y.set(target);
    else animate(y, target, spring);
  }, [expanded, range, vh, y, reduce]);

  if (!vh) return null;

  return (
    <motion.section
      aria-label="Resultados"
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 mx-auto flex w-full max-w-[640px] flex-col rounded-t-sheet border-t border-outline-variant bg-surface shadow-3",
        className
      )}
      style={{ y, height: expandedH }}
      drag="y"
      dragControls={controls}
      dragListener={false}
      dragConstraints={{ top: 0, bottom: range }}
      dragElastic={0.04}
      dragMomentum={false}
      onDragEnd={(_, info) => {
        const goExpanded = info.velocity.y < -250 ? true : info.velocity.y > 250 ? false : y.get() < range / 2;
        onExpandedChange(goExpanded);
        animate(y, goExpanded ? 0 : range, spring);
      }}
    >
      <div
        className="shrink-0 cursor-grab touch-none select-none px-5 pb-2 pt-2 active:cursor-grabbing"
        onPointerDown={(e) => controls.start(e)}
      >
        <div className="flex justify-center pb-2" aria-hidden="true">
          <div className="h-[5px] w-9 rounded-full bg-outline-variant" />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate font-display text-[20px] leading-tight text-on">{title}</h2>
            {subtitle && <p className="truncate text-[13px] text-on-variant">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={() => onExpandedChange(!expanded)}
            aria-label={expanded ? "Reducir lista" : "Ampliar lista"}
            aria-expanded={expanded}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-2 text-on active:scale-95"
          >
            <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={reduce ? { duration: 0 } : spring} className="flex">
              <ChevronUp size={20} />
            </motion.span>
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(160px+env(safe-area-inset-bottom))]">{children}</div>
    </motion.section>
  );
}
