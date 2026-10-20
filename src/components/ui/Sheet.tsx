"use client";
import React, { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { backdrop, sheet as sheetVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  /** altura máxima del contenido (por defecto 86dvh) */
  maxHeight?: string;
  /** oculta el botón cerrar */
  hideClose?: boolean;
  /** pie fijo (CTA) */
  footer?: React.ReactNode;
  className?: string;
}

/**
 * Bottom sheet arrastrable. En móvil sustituye al modal.
 * Accesible: role=dialog, foco inicial, Escape cierra, foco vuelve al disparador.
 */
export function Sheet({ open, onClose, title, subtitle, children, maxHeight = "86dvh", hideClose, footer, className }: SheetProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    triggerRef.current = document.activeElement as HTMLElement;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const raf = requestAnimationFrame(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      first?.focus();
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      triggerRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center" role="presentation">
          <motion.div
            className="absolute inset-0 bg-scrim"
            variants={backdrop}
            initial="hidden"
            animate="show"
            exit="exit"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            variants={reduce ? backdrop : sheetVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            drag={reduce ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 800) onClose();
            }}
            className={cn(
              "relative flex w-full max-w-[560px] flex-col rounded-t-xl bg-surface-elevated shadow-3 sm:rounded-xl",
              className
            )}
            style={{ maxHeight }}
          >
            <div className="flex justify-center pt-2 pb-2" aria-hidden="true">
              <div className="h-1 w-8 rounded-full bg-border" />
            </div>
            {(title || !hideClose) && (
              <div className="flex items-start justify-between gap-3 px-4 pb-2">
                <div className="min-w-0">
                  {title && <h2 id={titleId} className="font-semibold text-title leading-tight text-text">{title}</h2>}
                  {subtitle && <p className="mt-1 text-small text-text-secondary">{subtitle}</p>}
                </div>
                {!hideClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Cerrar"
                    className="pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface text-text"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">{children}</div>
            {footer && <div className="border-t border-border bg-surface-elevated px-4 pt-3 pb-[max(20px,env(safe-area-inset-bottom))]">{footer}</div>}
            {!footer && <div className="pb-[max(12px,env(safe-area-inset-bottom))]" />}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
