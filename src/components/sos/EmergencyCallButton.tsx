"use client";
import { Phone } from "lucide-react";
import { Skeleton } from "@/components/ui";
import { PetEmergency } from "@/components/icons/pet";
import { distanceLabel } from "@/lib/api/businesses";
import type { Business } from "@/types/db";

/**
 * Botón circular de llamada (estilo SOS de emergencia de iOS): una sola
 * acción fuerte en la pantalla, con un halo suave que late. Debajo, solo el
 * nombre de la clínica y un dato (distancia o barrio).
 */
export function EmergencyCallButton({ business, distance, loading, fromCache }: { business: Business | null; distance: number | null; loading: boolean; fromCache: boolean }) {
  if (loading && !business) {
    return (
      <div className="flex flex-col items-center gap-3" aria-hidden="true">
        <Skeleton className="h-32 w-32 rounded-full" />
        <Skeleton className="h-4 w-40" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="flex h-32 w-32 items-center justify-center rounded-full bg-surface-elevated text-text-secondary">
          <PetEmergency size={44} aria-hidden="true" />
        </span>
        <p className="mt-1 text-body font-semibold text-text">Sin urgencias cerca</p>
        <p className="text-small text-text-secondary">Llama a tu veterinaria de confianza</p>
      </div>
    );
  }

  const phone = business.whatsapp ?? business.phone;
  const meta = [distance !== null ? distanceLabel(distance) : business.neighborhood, business.emergency_24h ? "24 h" : null, fromCache ? "guardado" : null]
    .filter(Boolean)
    .join(" · ");

  const circle = (
    <span className="relative flex h-32 w-32 items-center justify-center">
      {phone && <span className="sos-halo absolute inset-0 rounded-full bg-danger" aria-hidden="true" />}
      <span
        className={
          phone
            ? "relative flex h-32 w-32 items-center justify-center rounded-full bg-danger text-on-danger shadow-3"
            : "relative flex h-32 w-32 items-center justify-center rounded-full bg-surface-elevated text-text-secondary"
        }
      >
        <Phone size={44} strokeWidth={2.2} aria-hidden="true" />
      </span>
    </span>
  );

  const caption = (
    <span className="flex flex-col items-center text-center">
      <span className="text-title font-semibold text-text">{phone ? "Llamar" : "Sin teléfono"}</span>
      <span className="mt-1 max-w-[260px] truncate text-small text-text-secondary">
        {business.name}
        {meta ? ` · ${meta}` : ""}
      </span>
    </span>
  );

  if (!phone) {
    return (
      <div className="flex flex-col items-center gap-3">
        {circle}
        {caption}
      </div>
    );
  }

  return (
    <a href={`tel:${phone.replace(/\s+/g, "")}`} aria-label={`Llamar a ${business.name}`} className="pressable flex flex-col items-center gap-3 rounded-xl">
      {circle}
      {caption}
    </a>
  );
}
