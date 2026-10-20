"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useLoaderVisibility } from "./Loaders";

/**
 * Transición skeleton → contenido (docs/design-system.md · Skeleton):
 * - si la carga dura menos de --loader-delay (300 ms) el skeleton no aparece;
 * - si aparece, se mantiene al menos --loader-min-visible (500 ms);
 * - al terminar hay fundido cruzado: el skeleton baja a opacidad 0 mientras
 *   el contenido entra con opacidad 0→1 y translateY(4px → 0). Para escalonar
 *   por elemento, usar .enter-soft-list dentro del contenido.
 */
export function SkeletonSwap({ loading, skeleton, children, className, label = "Cargando", reserveSpace }: {
  loading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** texto para lectores de pantalla mientras carga */
  label?: string;
  /**
   * Secciones dentro de una pantalla: durante los primeros 300 ms el
   * skeleton ocupa su lugar invisible, así el contenido de abajo no salta.
   */
  reserveSpace?: boolean;
}) {
  const show = useLoaderVisibility(loading);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (show) {
      setMounted(true);
      return;
    }
    if (!mounted) return;
    // --duration-base: el skeleton termina de desvanecerse y se desmonta
    const ms = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--duration-base")) || 0;
    const t = setTimeout(() => setMounted(false), ms);
    return () => clearTimeout(t);
  }, [show, mounted]);

  const contentReady = !loading && !show;
  return (
    <div className={cn("grid", className)} aria-busy={loading || undefined}>
      {(show || mounted || (reserveSpace && loading)) && (
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none min-w-0 transition-opacity duration-[var(--duration-base)] ease-[var(--ease-standard)] [grid-area:1/1]",
            show ? "opacity-100" : "opacity-0"
          )}
        >
          {skeleton}
        </div>
      )}
      {loading && <span className="sr-only" role="status" aria-live="polite">{label}</span>}
      {contentReady && <div className="enter-soft min-w-0 [grid-area:1/1]">{children}</div>}
    </div>
  );
}
