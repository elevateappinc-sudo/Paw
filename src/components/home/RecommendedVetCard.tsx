"use client";
import Link from "next/link";
import { Clock, MapPin, Star } from "lucide-react";
import { PetHealth } from "@/components/icons/pet";
import { distanceLabel } from "@/lib/api/businesses";
import { BUSINESS_CATEGORY_LABEL } from "@/types/db";
import type { NearbyCard } from "./NearbyCarousel";
import { HomeSectionHeader } from "./HomeSectionHeader";

/** Veterinaria a recomendar: la primera abierta, si no la primera veterinaria, si no el primer lugar */
export function pickRecommended(items: NearbyCard[] | null): NearbyCard | null {
  return items?.find((b) => b.type === "veterinaria" && b.is_open) ?? items?.find((b) => b.type === "veterinaria") ?? items?.[0] ?? null;
}

/**
 * Recomendado para la mascota activa: una sola tarjeta lila con la
 * veterinaria más cercana (o mejor calificada), sus datos clave y un botón
 * blanco de píldora para reservar. Sin datos, la sección no se muestra.
 */
export function RecommendedVetCard({ items, petName }: { items: NearbyCard[] | null; petName: string | null }) {
  const vet = pickRecommended(items);
  if (!vet) return null;

  return (
    <section aria-labelledby="home-reco">
      <HomeSectionHeader id="home-reco" title={petName ? `Recomendado para ${petName}` : "Recomendado"} href="/explorar?cat=veterinaria" linkLabel="Ver más veterinarias" />
      <div className="mt-1 px-4">
        <article className="rounded-xl bg-pastel-lilac p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-pastel-glass text-primary-text">
              {vet.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={vet.cover_url} alt="" className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
              ) : (
                <PetHealth size={22} aria-hidden="true" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-subtitle font-semibold text-text">{vet.name}</span>
              <span className="block text-small text-text-secondary">{BUSINESS_CATEGORY_LABEL[vet.type] ?? "Veterinaria"}</span>
            </span>
            {vet.rating_count > 0 && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-surface px-2 py-1 text-label font-semibold text-text">
                {vet.rating_avg.toLocaleString("es-CO", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                <Star size={12} className="fill-warning text-warning" aria-hidden="true" />
              </span>
            )}
          </div>

          <ul className="mt-3 flex flex-col gap-1 text-small text-text-secondary">
            {vet.distance_m !== null && (
              <li className="flex items-center gap-2">
                <MapPin size={14} aria-hidden="true" /> A {distanceLabel(vet.distance_m)} de ti
              </li>
            )}
            <li className="flex items-center gap-2">
              <Clock size={14} aria-hidden="true" /> {vet.emergency_24h ? "Abierto 24 horas" : vet.is_open ? "Abierto ahora" : "Cerrado ahora"}
            </li>
          </ul>

          <Link href={`/reservar?business=${vet.id}`} className="pressable mt-4 flex min-h-11 items-center justify-center rounded-full bg-surface text-body font-semibold text-text">
            Reservar cita
          </Link>
        </article>
      </div>
    </section>
  );
}
