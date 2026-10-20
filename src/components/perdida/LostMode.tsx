"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PetEmergency } from "@/components/icons/pet";
import { cn } from "@/lib/utils";
import { LOST_MODE_STYLE } from "./lostModeStyle";

export { LOST_MODE_STYLE };

export function LostModeRoot({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-h-dvh flex-col bg-bg", className)} style={LOST_MODE_STYLE}>
      {children}
    </div>
  );
}

/** Envoltorio sin caja para contenido que se monta en un portal (hojas) */
export function LostModeScope({ children }: { children: React.ReactNode }) {
  return <div style={LOST_MODE_STYLE}>{children}</div>;
}

/** "2 h 15 min", "3 días y 4 h", "12 min" */
export function elapsedLabel(iso: string, now: number): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const min = Math.max(0, Math.floor((now - t) / 60000));
  if (min < 1) return "menos de 1 min";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return min % 60 ? `${h} h ${min % 60} min` : `${h} h`;
  const d = Math.floor(h / 24);
  const rest = h % 24;
  const days = `${d} ${d === 1 ? "día" : "días"}`;
  return rest ? `${days} y ${rest} h` : days;
}

/** Banner fijo con el tiempo transcurrido desde la pérdida */
export function LostElapsedBanner({ since, petName }: { since: string; petName: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-40 flex items-center gap-2 bg-danger px-4 pt-[max(12px,env(safe-area-inset-top))] pb-3 text-on-danger"
    >
      <PetEmergency size={18} className="shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate text-body">
        <span className="font-semibold">{petName}</span> · perdida hace {elapsedLabel(since, now)}
      </span>
    </div>
  );
}

/** FAB contextual de Comunidad: "Reportar" */
export function ReportFab() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[max(24px,env(safe-area-inset-bottom))] z-40 mx-auto flex w-full max-w-[640px] justify-end px-4">
      <Link
        href="/perdida/nueva"
        aria-label="Reportar mascota perdida"
        className="pressable pointer-events-auto flex h-13 w-13 items-center justify-center rounded-full bg-primary text-on-primary shadow-2"
      >
        <Plus size={24} aria-hidden="true" />
      </Link>
    </div>
  );
}
