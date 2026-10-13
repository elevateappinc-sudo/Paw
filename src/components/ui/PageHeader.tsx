"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { SOSButton } from "@/components/layout/SOSButton";

/**
 * Cabecera estándar: botón atrás, título (large title iOS), acciones.
 * SOS siempre arriba a la derecha salvo que se desactive.
 */
export function PageHeader({ title, eyebrow, back, actions, sos = true, className, large = true, backHref }: {
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
    <header className={cn("flex items-end justify-between gap-3 px-4 pt-[max(14px,env(safe-area-inset-top))] pb-2", className)}>
      <div className="flex min-w-0 items-end gap-2">
        {back && (
          <button
            type="button"
            onClick={() => (backHref ? router.push(backHref) : router.back())}
            aria-label="Volver"
            className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-surface-2 text-on active:scale-95"
          >
            <ChevronLeft size={22} />
          </button>
        )}
        <div className="min-w-0">
          {eyebrow && <div className="text-[13px] font-semibold text-on-variant">{eyebrow}</div>}
          <h1 className={cn("truncate font-display leading-[1.1] text-on", large ? "text-[30px]" : "text-[22px]")}>{title}</h1>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {actions}
        {sos && <SOSButton />}
      </div>
    </header>
  );
}
