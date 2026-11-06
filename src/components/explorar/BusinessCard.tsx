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

/**
 * Tarjeta horizontal de negocio para la hoja de Explorar. Tap → ficha.
 * Foto rounded-lg, nombre en subtítulo, metadatos en secundario y estado
 * con chips de estado (abierto en éxito, cerrado neutro; solo "Urgencias
 * 24 h" usa peligro).
 */
export const BusinessCard = forwardRef<HTMLDivElement, BusinessCardProps>(function BusinessCard({ biz, selected, onFocus }, ref) {
  const open = biz.emergency_24h ? true : biz.is_open ?? isOpenNow(biz.hours, biz.emergency_24h);
  const meta = [BUSINESS_CATEGORY_LABEL[biz.type] ?? "Servicio", biz.distance_m != null ? distanceLabel(biz.distance_m) : biz.neighborhood]
    .filter(Boolean)
    .join(" · ");
  const reviews = biz.rating_count > 0 ? `${biz.rating_count} ${biz.rating_count === 1 ? "reseña" : "reseñas"}` : "Sin reseñas";
  const photo = biz.cover_url ?? biz.logo_url;

  return (
    <div ref={ref} className={cn("rounded-md border bg-surface", selected ? "border-primary" : "border-border")}>
      <Link
        href={`/negocios/${biz.id}`}
        onClick={() => onFocus?.(biz)}
        className="pressable flex gap-3 rounded-md p-3"
        aria-label={`${biz.name}, ${meta}, ${biz.rating_count > 0 ? `${biz.rating_avg.toFixed(1)} estrellas, ` : ""}${reviews}`}
      >
        <div className="relative h-22 w-26 shrink-0 overflow-hidden rounded-lg bg-surface-elevated">
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" className="h-full w-full object-cover" loading="lazy" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-start gap-2">
            <h3 className="min-w-0 flex-1 truncate text-subtitle font-semibold text-text">{biz.name}</h3>
            {biz.verified && <Verified className="shrink-0" label="" />}
          </div>
          <p className="truncate text-small text-text-secondary">{meta}</p>
          <div className="flex items-center gap-2 text-small text-text-secondary">
            {biz.rating_count > 0 && <Rating value={biz.rating_avg} />}
            <span className="truncate">{reviews}</span>
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {biz.emergency_24h ? (
              <Tag tone="danger" size="xs">Urgencias 24 h</Tag>
            ) : open ? (
              <Tag tone="ok" size="xs">Abierto</Tag>
            ) : (
              <Tag tone="neutral" size="xs">Cerrado</Tag>
            )}
            {biz.price_from != null && <Tag tone="neutral" size="xs">Desde {formatCurrency(biz.price_from)}</Tag>}
            {biz.promo_text && <Tag tone="primary" size="xs">{biz.promo_text}</Tag>}
            {biz.writes_history && <Tag tone="info" size="xs">Registra en tu historial</Tag>}
          </div>
        </div>
      </Link>
    </div>
  );
});
