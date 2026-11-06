"use client";
import Link from "next/link";
import { ChevronRight, Clock, MapPin, PawPrint } from "lucide-react";
import { Skeleton, SkeletonSwap } from "@/components/ui";
import { HomeSectionHeader } from "./HomeSectionHeader";
import { eventDateLabel } from "@/lib/api/events";
import type { EventCategory, PetEvent } from "@/types/db";
import { HomeSectionError } from "./HomeSectionError";

const CATEGORY_LABEL: Record<EventCategory, string> = {
  adopcion: "Adopción",
  clase: "Clase",
  carrera: "Carrera",
  feria: "Feria",
  salud: "Salud",
  social: "Comunidad",
  otro: "Evento",
};

/** Próximo evento (uno): mosaico de fecha estilo Calendario, categoría, título, lugar y hora. Sin eventos, no se muestra. */
export function NextEventRow({ event, loading, error, onRetry }: { event: PetEvent | null; loading: boolean; error?: boolean; onRetry?: () => void }) {
  if (!loading && !error && !event) return null;
  return (
    <section aria-labelledby="home-event">
      <HomeSectionHeader id="home-event" title="Próximo evento" href="/eventos" linkLabel="Ver todos los eventos" />
      <div className="mt-1 px-4">
        <SkeletonSwap
          loading={loading}
          reserveSpace
          label="Cargando el próximo evento"
          skeleton={
            <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
              <Skeleton className="h-18 w-16 rounded-lg" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          }
        >
        {error ? (
          <HomeSectionError message="No pudimos cargar los eventos." onRetry={() => onRetry?.()} />
        ) : loading || !event ? null : (
          <EventCard event={event} />
        )}
        </SkeletonSwap>
      </div>
    </section>
  );
}

function EventCard({ event }: { event: PetEvent }) {
  const d = eventDateLabel(event.starts_at);
  const month = new Date(event.starts_at).toLocaleDateString("es-CO", { month: "short" }).replace(".", "");
  const place = event.address?.split(",")[0] || event.city;
  return (
    <Link href={`/eventos/${event.id}`} className="pressable flex items-center gap-3 rounded-xl border border-border bg-surface p-3 shadow-1">
      <span className="flex h-18 w-16 shrink-0 flex-col items-center justify-center rounded-lg border border-border bg-primary-soft">
        <span className="eyebrow text-primary-text">{d.dow}</span>
        <span className="text-display font-semibold leading-none text-text">{d.day}</span>
        <span className="eyebrow text-primary-text">{month}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-label font-semibold text-primary-text">
          <PawPrint size={12} aria-hidden="true" /> {CATEGORY_LABEL[event.category] ?? "Evento"}
        </span>
        <span className="mt-1 block truncate text-body font-semibold text-text">{event.title.split(" · ")[0]}</span>
        <span className="mt-0.5 flex min-w-0 items-center gap-2 text-small text-text-secondary">
          {place && (
            <span className="flex min-w-0 items-center gap-1">
              <MapPin size={13} className="shrink-0" aria-hidden="true" />
              <span className="truncate">{place}</span>
            </span>
          )}
          <span className="flex shrink-0 items-center gap-1 font-semibold text-text">
            <Clock size={13} className="text-text-secondary" aria-hidden="true" /> {d.time}
          </span>
        </span>
      </span>
      <ChevronRight size={18} className="shrink-0 text-primary-text" aria-hidden="true" />
    </Link>
  );
}
