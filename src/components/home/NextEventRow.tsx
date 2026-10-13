"use client";
import Link from "next/link";
import { CalendarDays, ChevronRight } from "lucide-react";
import { Card, SectionTitle, Skeleton } from "@/components/ui";
import { eventDateLabel } from "@/lib/api/events";
import type { PetEvent } from "@/types/db";

/** Próximo evento (uno) como fila con foto */
export function NextEventRow({ event, loading }: { event: PetEvent | null; loading: boolean }) {
  if (!loading && !event) return null;
  return (
    <section className="px-4" aria-labelledby="home-event">
      <SectionTitle action={<Link href="/eventos">Ver todos</Link>}>
        <span id="home-event">Próximo evento</span>
      </SectionTitle>
      {loading || !event ? (
        <Skeleton className="mt-3 h-[88px] w-full rounded-card-lg" />
      ) : (
        <Link href={`/eventos/${event.id}`} className="mt-3 block">
          <Card padded={false} interactive className="flex items-center gap-3 p-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-info-container text-info">
              {event.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={event.cover_url} alt="" className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <CalendarDays size={24} aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[16px] font-bold text-on">{event.title}</div>
              <div className="truncate text-[13px] text-on-variant">
                {(() => {
                  const d = eventDateLabel(event.starts_at);
                  return `${d.dow} ${d.day} · ${d.time}${event.address ? ` · ${event.address}` : ""}`;
                })()}
              </div>
            </div>
            <ChevronRight size={20} className="shrink-0 text-on-variant" aria-hidden="true" />
          </Card>
        </Link>
      )}
    </section>
  );
}
