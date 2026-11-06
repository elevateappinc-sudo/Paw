"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { SOSButton } from "@/components/layout/SOSButton";

/**
 * Cabecera estándar: botón atrás, título (large title iOS), acciones.
 * SOS solo donde aporta seguridad (salud, emergencia, mascota perdida):
 * se activa con `sos`; el punto de entrada general es el Inicio.
 */
export function PageHeader({ title, eyebrow, back, actions, sos = false, className, large = true, backHref }: {
  title: React.ReactNode;
  eyebrow?: React.ReactNode;
  back?: boolean;
  backHref?: string;
  actions?: React.ReactNode;
  sos?: boolean;
  className?: string;
  large?: boolean;
}) {
  const router = useRouter();
  return (
    <header className={cn("flex items-center justify-between gap-3 px-4 pt-[max(16px,env(safe-area-inset-top))] pb-3", className)}>
      <div className="flex min-w-0 items-center gap-2">
        {back && (
          <button
            type="button"
            onClick={() => (backHref ? router.push(backHref) : router.back())}
            aria-label="Volver"
            className="pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-text"
          >
            <ChevronLeft size={22} />
          </button>
        )}
        <div className="min-w-0">
          {eyebrow && <div className="text-small text-text-secondary">{eyebrow}</div>}
          <h1 className={cn("line-clamp-2 break-words font-semibold leading-tight text-text", large ? "text-display" : "text-title")}>{title}</h1>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {actions}
        {sos && <SOSButton />}
      </div>
    </header>
  );
}
