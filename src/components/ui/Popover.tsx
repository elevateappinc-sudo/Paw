"use client";
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

const GAP = 8;
const MARGIN = 12;

/**
 * Panel flotante anclado a un disparador (calendario, hora, opciones).
 * Se monta en un portal por encima de los sheets, se abre debajo del campo o
 * encima si no cabe, y se cierra con Escape, tocando fuera o al desaparecer
 * el disparador. Superficie del design system: surface, borde, radio 24 y
 * shadow-3; entra con opacidad y escala (sin escala con movimiento reducido).
 */
export function Popover({
  open,
  anchor,
  onClose,
  children,
  className,
  label,
  matchWidth,
}: {
  open: boolean;
  anchor: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  label: string;
  /** El panel toma el ancho del disparador (listas de opciones) */
  matchWidth?: boolean;
}) {
  const panel = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width?: number; above: boolean } | null>(null);

  const place = useCallback(() => {
    const a = anchor.current;
    const p = panel.current;
    if (!a || !p) return;
    const r = a.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = matchWidth ? Math.max(r.width, 200) : p.offsetWidth;
    const h = p.offsetHeight;
    const below = vh - r.bottom - GAP - MARGIN;
    const above = r.top - GAP - MARGIN;
    const goAbove = h > below && above > below;
    const top = goAbove ? Math.max(MARGIN, r.top - GAP - h) : Math.min(r.bottom + GAP, vh - MARGIN - h);
    const left = Math.min(Math.max(MARGIN, r.left), vw - MARGIN - width);
    setPos({ top, left, width: matchWidth ? width : undefined, above: goAbove });
  }, [anchor, matchWidth]);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        onClose();
        anchor.current?.focus();
      }
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panel.current?.contains(t) || anchor.current?.contains(t)) return;
      onClose();
    };
    window.addEventListener("keydown", onKey, true);
    document.addEventListener("pointerdown", onDown, true);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      document.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, onClose, place, anchor]);

  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div
      ref={panel}
      role="dialog"
      aria-label={label}
      className={cn(
        "fixed z-[70] rounded-xl border border-border bg-surface p-3 text-text shadow-3 transition-[opacity,transform] duration-[var(--duration-base)] ease-[var(--ease-enter)]",
        pos ? "scale-100 opacity-100" : "scale-[0.97] opacity-0",
        className
      )}
      style={{
        top: pos?.top ?? -9999,
        left: pos?.left ?? -9999,
        width: pos?.width,
        transformOrigin: pos?.above ? "bottom left" : "top left",
      }}
    >
      {children}
    </div>,
    document.body
  );
}
