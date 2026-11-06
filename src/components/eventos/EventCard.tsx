"use client";
import Link from "next/link";
import { Check, ShieldCheck } from "lucide-react";
import { Button, Tag } from "@/components/ui";
import { distanceLabel } from "@/lib/api/businesses";
import { eventDateLabel } from "@/lib/api/events";
import type { PetEvent } from "@/types/db";
import { cn, formatCurrency } from "@/lib/utils";

export interface EventCardProps {
  event: PetEvent;
  distanceM: number | null;
  onRsvp: (e: PetEvent) => void;
  rsvpBusy?: boolean;
  /** "{mascota} cumple los requisitos · vacunas al día" */
  eligibleNote?: string | null;
  variant?: "large" | "compact";
}

function GoingAvatars({ count }: { count: number }) {
  if (count <= 0) return <span className="text-small text-text-secondary">Sé la primera persona en ir</span>;
  const shown = Math.min(count, 3);
  return (
    <span className="inline-flex items-center gap-2">
      <span className="flex -space-x-2" aria-hidden="true">
        {Array.from({ length: shown }).map((_, i) => (
          <span key={i} className={cn("h-7 w-7 rounded-full border-2 border-surface", i % 3 === 0 ? "bg-primary-soft" : i % 3 === 1 ? "bg-info-soft" : "bg-warning-soft")} />
        ))}
      </span>
      <span className="text-small font-semibold text-text">{count} van</span>
    </span>
  );
}

function PriceTag({ price }: { price: number }) {
  return price > 0 ? <Tag tone="neutral">{formatCurrency(price)}</Tag> : <Tag tone="ok">Gratis</Tag>;
}

export function EventCard({ event, distanceM, onRsvp, rsvpBusy, eligibleNote, variant = "compact" }: EventCardProps) {
  const { dow, day, time } = eventDateLabel(event.starts_at);
  const going = event.my_status === "going";
  const meta = [time, distanceM != null ? distanceLabel(distanceM) : null, event.organizer_name].filter(Boolean).join(" · ");
  const rsvpButton = (
    <Button
      size="sm"
      variant={going ? "primary" : "tonal"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onRsvp(event);
      }}
      loading={rsvpBusy}
      aria-pressed={going}
      leading={going ? <Check size={16} /> : undefined}
    >
      {going ? "Vas" : "Voy"}
    </Button>
  );

  if (variant === "large") {
    return (
      <article className="overflow-hidden rounded-md border border-border bg-surface">
        <Link href={`/eventos/${event.id}`} className="block">
          <div className="relative h-[150px] bg-border">
            {event.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={event.cover_url} alt="" className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-primary-soft via-surface-elevated to-info-soft" aria-hidden="true" />
            )}
            <div className="absolute left-3 top-3 flex h-[52px] w-[48px] flex-col items-center justify-center rounded-md bg-surface">
              <span className="text-small font-semibold capitalize text-primary-text">{dow}</span>
              <span className="font-semibold text-title leading-none text-text">{day}</span>
            </div>
            <div className="absolute right-3 top-3">
              <PriceTag price={event.price} />
            </div>
          </div>
          <div className="p-4 pb-2">
            <h3 className="font-semibold text-title leading-tight text-text">{event.title}</h3>
            <p className="mt-1 text-small text-text-secondary">{meta}</p>
            {eligibleNote && (
              <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-success-soft px-3 py-1 text-label font-semibold text-success-text">
                <ShieldCheck size={14} className="text-success-text" aria-hidden="true" /> {eligibleNote}
              </p>
            )}
          </div>
        </Link>
        <div className="flex items-center justify-between gap-3 px-4 pb-4">
          <GoingAvatars count={event.going_count ?? 0} />
          {rsvpButton}
        </div>
      </article>
    );
  }

  return (
    <article className="flex gap-3 rounded-md border border-border bg-surface p-3">
      <Link href={`/eventos/${event.id}`} className="flex min-w-0 flex-1 gap-3">
        <div className="flex h-[60px] w-[52px] shrink-0 flex-col items-center justify-center rounded-md bg-surface-elevated">
          <span className="text-small font-semibold capitalize text-primary-text">{dow}</span>
          <span className="font-semibold text-title leading-none text-text">{day}</span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-subtitle font-semibold text-text">{event.title}</h3>
          <p className="truncate text-small text-text-secondary">{meta}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <PriceTag price={event.price} />
            {(event.going_count ?? 0) > 0 && <span className="text-label font-semibold text-text-secondary">{event.going_count} van</span>}
          </div>
          {eligibleNote && (
            <p className="mt-2 inline-flex items-center gap-1 text-label font-semibold text-success-text">
              <ShieldCheck size={13} aria-hidden="true" /> {eligibleNote}
            </p>
          )}
        </div>
      </Link>
      <div className="flex shrink-0 items-center">{rsvpButton}</div>
    </article>
  );
}
