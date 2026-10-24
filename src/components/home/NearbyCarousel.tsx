"use client";
import Link from "next/link";
import { MapPinned } from "lucide-react";
import { EmptyState, Skeleton, PhotoBadge, Rating, buttonVariants, SkeletonSwap } from "@/components/ui";
import { HomeSectionHeader } from "./HomeSectionHeader";
import { HomeSectionError } from "./HomeSectionError";
import { distanceLabel } from "@/lib/api/businesses";
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

export function NearbyCarousel({ items, error, onRetry }: { items: NearbyCard[] | null; error?: boolean; onRetry?: () => void }) {
  const loading = items === null && !error;
  // Inicio oculta los módulos vacíos (la búsqueda amplia vive en Explorar)
  if (!error && items !== null && items.length === 0) return null;
  return (
    <section aria-labelledby="home-nearby">
      <HomeSectionHeader id="home-nearby" title="Cerca de ti" href="/explorar" linkLabel="Ver el mapa" />
      <SkeletonSwap
        loading={loading}
        reserveSpace
        label="Cargando negocios cercanos"
        skeleton={
          <div className="mt-1 flex gap-3 overflow-hidden px-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-40 shrink-0">
                <Skeleton className="h-28 w-full rounded-lg" />
                <Skeleton className="mt-2 h-4 w-3/4" />
                <Skeleton className="mt-2 h-3 w-1/3" />
              </div>
            ))}
          </div>
        }
      >
      {error ? (
        <div className="mt-1 px-4">
          <HomeSectionError message="No pudimos cargar los negocios cercanos." onRetry={() => onRetry?.()} />
        </div>
      ) : items === null ? null : items.length === 0 ? (
        <div className="mt-1 px-4">
          <EmptyState
            compact
            icon={<MapPinned size={24} aria-hidden="true" />}
            title="Aún no hay negocios en tu zona"
            description="Abre el mapa para ampliar la búsqueda."
            action={
              <Link href="/explorar" className={buttonVariants({ variant: "secondary", full: true })}>
                Abrir el mapa
              </Link>
            }
          />
        </div>
      ) : (
        <ul className="no-scrollbar fade-edge enter-soft-list mt-1 flex gap-3 overflow-x-auto px-4 pb-1">
          {items.map((b) => (
            <li key={b.id} className="shrink-0">
              <BizCard b={b} />
            </li>
          ))}
        </ul>
      )}
      </SkeletonSwap>
    </section>
  );
}

/** Tarjeta mínima: foto con calificación, nombre y un solo dato (distancia o categoría) */
function BizCard({ b }: { b: NearbyCard }) {
  const meta = b.distance_m !== null ? distanceLabel(b.distance_m) : BUSINESS_CATEGORY_LABEL[b.type] ?? "Negocio";
  return (
    <Link href={`/negocios/${b.id}`} className="pressable block w-40">
      <div className="relative h-28 w-full overflow-hidden rounded-lg bg-surface-elevated">
        {b.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={b.cover_url} alt="" className="h-full w-full object-cover" loading="lazy" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
        )}
        {b.rating_count > 0 && (
          <PhotoBadge className="left-2 top-2">
            <Rating value={b.rating_avg} />
          </PhotoBadge>
        )}
      </div>
      <div className="mt-2 truncate text-body font-semibold text-text">{b.name}</div>
      <div className="truncate text-small text-text-secondary">{meta}</div>
    </Link>
  );
}
