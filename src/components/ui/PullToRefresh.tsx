"use client";
import { useEffect, useRef, useState } from "react";
import { TailRefresh } from "./Loaders";

/** Distancia (px) a partir de la cual soltar actualiza, y estiramiento máximo */
const THRESHOLD = 72;
const MAX_PULL = 112;
/** --loader-min-visible: el indicador se mantiene al menos 500 ms */
const MIN_VISIBLE = 500;

/**
 * Pull-to-refresh con el loader "Cola que se mueve": mientras más se estira,
 * más rápido oscila la cola. Solo se activa con la página arriba del todo y
 * con un gesto vertical (los carruseles horizontales no lo disparan).
 * Solo se anima transform y opacity.
 */
export function PullToRefresh({ onRefresh, children, label = "Actualizando" }: {
  onRefresh: () => Promise<unknown> | void;
  children: React.ReactNode;
  label?: string;
}) {
  const [pull, setPull] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const gesture = useRef<{ x: number; y: number; vertical: boolean | null } | null>(null);
  const pullRef = useRef(0);
  const refreshRef = useRef(onRefresh);
  refreshRef.current = onRefresh;
  const busyRef = useRef(false);

  useEffect(() => {
    const setPullBoth = (v: number) => {
      pullRef.current = v;
      setPull(v);
    };
    const onStart = (e: TouchEvent) => {
      // No con la página desplazada, con una hoja abierta (body bloqueado) ni actualizando
      if (busyRef.current || window.scrollY > 0 || document.body.style.overflow === "hidden") return;
      const t = e.touches[0];
      gesture.current = { x: t.clientX, y: t.clientY, vertical: null };
    };
    const onMove = (e: TouchEvent) => {
      const g = gesture.current;
      if (!g) return;
      const t = e.touches[0];
      const dx = t.clientX - g.x;
      const dy = t.clientY - g.y;
      if (g.vertical === null && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) g.vertical = Math.abs(dy) > Math.abs(dx);
      if (!g.vertical || dy <= 0) {
        if (pullRef.current) setPullBoth(0);
        if (g.vertical === false || dy < 0) gesture.current = null;
        return;
      }
      if (e.cancelable) e.preventDefault();
      setDragging(true);
      setPullBoth(Math.min(MAX_PULL, dy * 0.5));
    };
    const onEnd = async () => {
      if (!gesture.current) return;
      gesture.current = null;
      setDragging(false);
      if (pullRef.current < THRESHOLD) {
        setPullBoth(0);
        return;
      }
      busyRef.current = true;
      setRefreshing(true);
      setPullBoth(THRESHOLD);
      const started = Date.now();
      try {
        await refreshRef.current();
      } finally {
        const wait = MIN_VISIBLE - (Date.now() - started);
        if (wait > 0) await new Promise((r) => setTimeout(r, wait));
        busyRef.current = false;
        setRefreshing(false);
        setPullBoth(0);
      }
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, []);

  const progress = refreshing ? 1 : Math.min(1, pull / THRESHOLD);
  const visible = pull > 0 || refreshing;
  const transition = dragging ? "none" : "transform var(--duration-base) var(--ease-standard), opacity var(--duration-base) var(--ease-standard)";

  return (
    <>
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-40 mx-auto flex max-w-[640px] justify-center pt-[env(safe-area-inset-top)]"
        style={{ transform: `translateY(${pull - 48}px)`, opacity: visible ? 1 : 0, transition }}
        aria-hidden={!visible}
      >
        <div className="rounded-full border border-border bg-surface p-2 shadow-2">
          {visible && <TailRefresh size={32} pull={progress} label={refreshing ? label : "Desliza para actualizar"} />}
        </div>
      </div>
      {/* Sin transform en reposo: un ancestro transformado rompería los position: fixed (FAB) */}
      <div style={pull > 0 ? { transform: `translateY(${pull}px)`, transition } : { transition }}>{children}</div>
    </>
  );
}
