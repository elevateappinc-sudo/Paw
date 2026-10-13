"use client";
import Link from "next/link";
import { SectionTitle, SkeletonBiz, PhotoBadge, Rating } from "@/components/ui";
import { distanceLabel } from "@/lib/api/businesses";
import { formatCurrency } from "@/lib/utils";
import { BUSINESS_CATEGORY_LABEL, type BusinessCategory } from "@/types/db";

/** Forma común de `NearbyBusiness` (RPC) y `Business` (populares) */
export interface NearbyCard {
  id: string;
  name: string;
  type: BusinessCategory;
  cover_url: string | null;
  rating_avg: number;
  rating_count: number;
  distance_m: number | null;
  price_from: number | null;
  is_open: boolean;
  emergency_24h: boolean;
  promo_text: string | null;
}

export function NearbyCarousel({ items }: { items: NearbyCard[] | null }) {
  return (
    <section aria-labelledby="home-nearby">
      <div className="px-4">
        <SectionTitle action={<Link href="/explorar">Ver mapa</Link>}>
          <span id="home-nearby">Cerca de ti</span>
        </SectionTitle>
      </div>
      {items === null ? (
        <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto px-4">
          <SkeletonBiz />
          <SkeletonBiz />
          <SkeletonBiz />
        </div>
      ) : items.length === 0 ? (
        <p className="mt-3 px-4 text-[14px] text-on-variant">Todavía no hay negocios en tu zona. Explora el mapa para ampliar la búsqueda.</p>
      ) : (
        <ul className="no-scrollbar mt-3 flex gap-3 overflow-x-auto px-4 pb-1">
          {items.map((b) => (
            <li key={b.id} className="shrink-0">
              <BizCard b={b} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function BizCard({ b }: { b: NearbyCard }) {
  const status = b.emergency_24h
    ? { label: "Abierto 24 h", tone: "ok" as const }
    : b.is_open
      ? { label: "Abierto", tone: "ok" as const }
      : b.promo_text
        ? { label: b.promo_text, tone: "primary" as const }
        : null;
  const meta = [BUSINESS_CATEGORY_LABEL[b.type] ?? "Negocio", b.distance_m !== null ? distanceLabel(b.distance_m) : null, b.price_from ? `desde ${formatCurrency(b.price_from)}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link href={`/negocios/${b.id}`} className="block w-[200px] overflow-hidden rounded-card-lg border border-outline-variant bg-surface shadow-1 active:scale-[0.985]">
      <div className="relative h-[110px] w-full bg-gradient-to-br from-surface-2 to-surface-3">
        {b.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={b.cover_url} alt="" className="h-full w-full object-cover" loading="lazy" />
        )}
        {b.rating_count > 0 && (
          <PhotoBadge className="left-2 top-2">
            <Rating value={b.rating_avg} />
          </PhotoBadge>
        )}
        {status && (
          <PhotoBadge tone={status.tone} className="bottom-2 right-2 max-w-[150px] truncate">
            {status.label}
          </PhotoBadge>
        )}
      </div>
      <div className="p-3">
        <div className="truncate font-display text-[15px] leading-tight text-on">{b.name}</div>
        <div className="mt-1 truncate text-[12px] font-semibold text-on-variant">{meta}</div>
      </div>
    </Link>
  );
}
