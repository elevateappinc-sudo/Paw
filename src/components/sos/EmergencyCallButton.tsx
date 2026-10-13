"use client";
import { Phone, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui";
import { distanceLabel } from "@/lib/api/businesses";
import type { Business } from "@/types/db";

/**
 * Botón gigante de 72 px: una sola acción fuerte en la pantalla.
 * Llama a la urgencia más cercana con tel:.
 */
export function EmergencyCallButton({ business, distance, loading, fromCache }: { business: Business | null; distance: number | null; loading: boolean; fromCache: boolean }) {
  if (loading && !business) {
    return <Skeleton className="h-[72px] w-full rounded-card-lg" />;
  }
  if (!business) {
    return (
      <div className="rounded-card-lg border border-danger/40 bg-danger-container px-4 py-3 text-on-danger-container">
        <div className="text-[16px] font-bold">No encontramos una urgencia cerca</div>
        <div className="text-[13px]">Busca en Explorar o llama a tu veterinaria de confianza.</div>
      </div>
    );
  }
  const phone = business.whatsapp ?? business.phone;
  const meta = [business.emergency_24h ? "Urgencias 24 h" : "Veterinaria", distance !== null ? distanceLabel(distance) : business.neighborhood, business.verified ? "verificada" : null, fromCache ? "datos guardados" : null]
    .filter(Boolean)
    .join(" · ");

  if (!phone) {
    return (
      <div className="flex min-h-[72px] items-center gap-3 rounded-card-lg bg-danger-container px-4 text-on-danger-container">
        <MapPin size={26} className="shrink-0 text-danger" aria-hidden="true" />
        <div className="min-w-0">
          <div className="truncate text-[17px] font-bold">{business.name}</div>
          <div className="truncate text-[13px]">{meta} · sin teléfono registrado</div>
        </div>
      </div>
    );
  }

  return (
    <a
      href={`tel:${phone.replace(/\s+/g, "")}`}
      className="flex min-h-[72px] w-full items-center gap-3 rounded-card-lg bg-danger px-4 text-white shadow-2 transition-transform active:scale-[0.98]"
      aria-label={`Llamar a ${business.name}`}
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20">
        <Phone size={24} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate font-display text-[18px] leading-tight">Llamar a {business.name}</span>
        <span className="block truncate text-[13px] font-semibold opacity-90">{meta}</span>
      </span>
    </a>
  );
}
