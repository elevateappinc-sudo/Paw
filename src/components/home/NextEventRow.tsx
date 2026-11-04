"use client";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Skeleton, SkeletonSwap } from "@/components/ui";
import { HomeSectionHeader } from "./HomeSectionHeader";
import { eventDateLabel } from "@/lib/api/events";
import type { PetEvent } from "@/types/db";
import { HomeSectionError } from "./HomeSectionError";

/** Próximo evento (uno) como fila con foto. Sin eventos, la sección no se muestra. */
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
            <div className="flex items-center gap-3 rounded-md border border-border bg-surface p-3">
              <Skeleton className="h-14 w-14 rounded-sm" />
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
          <Link href={`/eventos/${event.id}`} className="pressable flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
            {/* Bloque de fecha estilo Calendario */}
            <span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-md bg-surface-elevated">
              <span className="text-label font-semibold uppercase text-primary-text">{eventDateLabel(event.starts_at).dow}</span>
              <span className="text-title font-semibold leading-none text-text">{eventDateLabel(event.starts_at).day}</span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-body font-semibold text-text">{event.title}</span>
              <span className="block truncate text-small text-text-secondary">{eventDateLabel(event.starts_at).time}</span>
            </span>
            <ChevronRight size={18} className="shrink-0 text-text-secondary" aria-hidden="true" />
          </Link>
        )}
        </SkeletonSwap>
      </div>
    </section>
  );
}
