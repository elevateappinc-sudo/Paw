"use client";
import { forwardRef } from "react";
import Link from "next/link";
import { Rating, Verified, Tag } from "@/components/ui";
import { distanceLabel, isOpenNow } from "@/lib/api/businesses";
import { BUSINESS_CATEGORY_LABEL } from "@/types/db";
import { cn, formatCurrency } from "@/lib/utils";
import type { ExploreBiz } from "./lib";

export interface BusinessCardProps {
  biz: ExploreBiz;
  selected?: boolean;
  onFocus?: (biz: ExploreBiz) => void;
}

/** Tarjeta horizontal de negocio para la hoja de Explorar. Tap → ficha. */
export const BusinessCard = forwardRef<HTMLDivElement, BusinessCardProps>(function BusinessCard({ biz, selected, onFocus }, ref) {
  const open = biz.emergency_24h ? true : biz.is_open ?? isOpenNow(biz.hours, biz.emergency_24h);
  const meta = [
    BUSINESS_CATEGORY_LABEL[biz.type] ?? "Servicio",
    biz.distance_m != null ? distanceLabel(biz.distance_m) : biz.neighborhood,
    biz.rating_count > 0 ? `${biz.rating_count} ${biz.rating_count === 1 ? "reseña" : "reseñas"}` : "Sin reseñas",
  ]
    .filter(Boolean)
    .join(" · ");
  const photo = biz.cover_url ?? biz.logo_url;

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-card-lg border bg-surface transition-[border-color,box-shadow]",
        selected ? "border-primary shadow-2" : "border-outline-variant shadow-1"
      )}
    >
      <Link
        href={`/negocios/${biz.id}`}
        onClick={() => onFocus?.(biz)}
        className="flex gap-3 p-3 active:bg-surface-2 rounded-card-lg"
        aria-label={`${biz.name}, ${meta}`}
      >
        <div className="relative h-[88px] w-[104px] shrink-0 overflow-hidden rounded-card bg-surface-3">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-surface-2 to-surface-3" aria-hidden="true" />
          )}
          {biz.rating_count > 0 && (
            <span className="absolute left-1.5 top-1.5 rounded-full bg-surface px-1.5 py-0.5 shadow-2">
              <Rating value={biz.rating_avg} className="text-[12px]" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-1.5">
            <h3 className="min-w-0 flex-1 truncate font-display text-[16px] leading-tight text-on">{biz.name}</h3>
            {biz.verified && <Verified className="shrink-0" label="" />}
          </div>
          <p className="mt-0.5 truncate text-[13px] text-on-variant">{meta}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {biz.emergency_24h ? (
              <Tag tone="ok" size="xs">Abierto 24 h</Tag>
            ) : open ? (
              <Tag tone="ok" size="xs">Abierto</Tag>
            ) : (
              <Tag tone="neutral" size="xs">Cerrado</Tag>
            )}
            {biz.price_from != null && <Tag tone="neutral" size="xs">Desde {formatCurrency(biz.price_from)}</Tag>}
            {biz.promo_text && <Tag tone="warn" size="xs">{biz.promo_text}</Tag>}
            {biz.writes_history && <Tag tone="primary" size="xs">Registra en tu historial</Tag>}
          </div>
        </div>
      </Link>
    </div>
  );
});
