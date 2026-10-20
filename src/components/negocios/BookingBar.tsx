"use client";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui";
import type { BusinessService } from "@/types/db";
import { cn, formatCurrency } from "@/lib/utils";

export interface BookingBarProps {
  businessId: string;
  service: BusinessService | null;
  petName: string | null;
  whatsappHref: string | null;
}

/** Barra inferior fija en vidrio con resumen y CTA de reserva. */
export function BookingBar({ businessId, service, petName, whatsappHref }: BookingBarProps) {
  const summary = [service?.name ?? "Elige un servicio", petName].filter(Boolean).join(" · ");
  const href = service ? `/reservar?business=${businessId}&service=${service.id}` : `/reservar?business=${businessId}`;
  return (
    <div className="glass fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[640px] border-t border-border px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-body font-semibold text-text">{summary}</p>
          <p className="truncate text-label text-text-secondary">Cancela gratis hasta 24 h antes</p>
          {service?.price != null && <p className="font-semibold text-title leading-tight text-text">{formatCurrency(service.price)}</p>}
        </div>
        {service || !whatsappHref ? (
          <Link href={href} className={cn(buttonVariants({ variant: "primary", size: "lg" }), "shrink-0")}>
            Reservar{service?.price != null ? ` · ${formatCurrency(service.price)}` : ""}
          </Link>
        ) : (
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: "primary", size: "lg" }), "shrink-0")}>
            <MessageCircle size={18} /> Reservar por WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
