"use client";
import { useEffect, useState } from "react";
import { animate, motion, useDragControls, useMotionValue, useReducedMotion } from "motion/react";
import { ChevronUp } from "lucide-react";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** Fracción de la pantalla que ocupa la hoja recogida */
export const SHEET_COLLAPSED = 0.45;
/** Separación entre la cabecera y la hoja desplegada (px) */
const EXPANDED_GAP = 8;

export interface ResultsSheetProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  expanded: boolean;
  onExpandedChange: (v: boolean) => void;
  /** alto de la cabecera fija (px): la hoja desplegada nunca la tapa */
  topInset: number;
  children: React.ReactNode;
  className?: string;
}

/**
 * Hoja inferior fija (no modal) de Explorar: --color-surface-elevated, radio
 * xl arriba y manija de 32×4 px. Recogida ocupa ~45 % de la pantalla y se
 * despliega hasta justo debajo de la cabecera. El contenido hace scroll y
 * termina con --content-bottom-padding para no quedar bajo el menú flotante.
 */
export function ResultsSheet({ title, subtitle, expanded, onExpandedChange, topInset, children, className }: ResultsSheetProps) {
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

  const collapsedH = vh ? Math.round(vh * SHEET_COLLAPSED) : 0;
  const expandedH = vh ? Math.max(collapsedH, vh - topInset - EXPANDED_GAP) : 0;
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
        "fixed inset-x-0 bottom-0 z-30 mx-auto flex w-full max-w-[640px] flex-col rounded-t-xl border-t border-border bg-surface-elevated shadow-3",
        className
      )}
      style={{ y, height: expandedH }}
      drag={reduce ? false : "y"}
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
      <div className="shrink-0 cursor-grab touch-none select-none px-4 pb-3 pt-2 active:cursor-grabbing" onPointerDown={(e) => controls.start(e)}>
        <div className="flex justify-center pb-2" aria-hidden="true">
          <div className="h-1 w-8 rounded-full bg-border" />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-title font-semibold text-text">{title}</h2>
            {subtitle && <p className="truncate text-small text-text-secondary">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={() => onExpandedChange(!expanded)}
            aria-label={expanded ? "Reducir lista" : "Ampliar lista"}
            aria-expanded={expanded}
            className="pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-text"
          >
            <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={reduce ? { duration: 0 } : spring} className="flex">
              <ChevronUp size={20} aria-hidden="true" />
            </motion.span>
          </button>
        </div>
      </div>
      {/* Recogida, la parte inferior de la hoja queda fuera de pantalla (range px):
          se suma al relleno para que el último elemento siga alcanzable sobre el menú. */}
      <div
        className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain px-4", expanded && "pb-content")}
        style={expanded ? undefined : { paddingBottom: `calc(var(--content-bottom-padding) + ${range}px)` }}
      >
        {children}
      </div>
    </motion.section>
  );
}
