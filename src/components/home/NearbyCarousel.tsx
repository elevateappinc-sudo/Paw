"use client";
import { useState } from "react";
import Link from "next/link";
import { MapPinned, PawPrint, type LucideIcon } from "lucide-react";
import { PetDaycare, PetEmergency, PetGrooming, PetHealth, PetMedication, PetShop, PetTraining, PetWalk } from "@/components/icons/pet";
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

/** Veterinaria a recomendar: la primera abierta, si no la primera veterinaria, si no el primer lugar */
export function pickRecommended(items: NearbyCard[] | null): NearbyCard | null {
  return items?.find((b) => b.type === "veterinaria" && b.is_open) ?? items?.find((b) => b.type === "veterinaria") ?? items?.[0] ?? null;
}

/** Portada de respaldo por categoría: pastel + ícono, nunca un recuadro vacío */
const COVER: Record<BusinessCategory, { bg: string; icon: LucideIcon }> = {
  veterinaria: { bg: "bg-pastel-lilac", icon: PetHealth },
  urgencias: { bg: "bg-pastel-peach", icon: PetEmergency },
  farmacia: { bg: "bg-pastel-lilac", icon: PetMedication },
  peluqueria: { bg: "bg-pastel-sky", icon: PetGrooming },
  tienda: { bg: "bg-pastel-peach", icon: PetShop },
  entrenador: { bg: "bg-pastel-mint", icon: PetTraining },
  paseador: { bg: "bg-pastel-mint", icon: PetWalk },
  guarderia: { bg: "bg-pastel-sky", icon: PetDaycare },
  pet_friendly: { bg: "bg-pastel-mint", icon: PawPrint },
  funeraria: { bg: "bg-pastel-lilac", icon: PawPrint },
  otro: { bg: "bg-pastel-lilac", icon: PawPrint },
};

/**
 * Cerca de ti: carrusel de lugares. La veterinaria recomendada va primero con
 * su marca "Recomendado"; no tiene sección propia para no pesar más que los
 * cuidados de la mascota.
 */
export function NearbyCarousel({ items: raw, error, onRetry }: { items: NearbyCard[] | null; error?: boolean; onRetry?: () => void }) {
  const loading = raw === null && !error;
  const reco = pickRecommended(raw);
  const items = raw && reco ? [reco, ...raw.filter((b) => b.id !== reco.id)] : raw;
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
              <BizCard b={b} recommended={b.id === reco?.id} />
            </li>
          ))}
        </ul>
      )}
      </SkeletonSwap>
    </section>
  );
}

/** Tarjeta mínima: foto con calificación, nombre y un solo dato (distancia o categoría) */
function BizCard({ b, recommended }: { b: NearbyCard; recommended: boolean }) {
  const [broken, setBroken] = useState(false);
  const meta = b.distance_m !== null ? distanceLabel(b.distance_m) : BUSINESS_CATEGORY_LABEL[b.type] ?? "Negocio";
  const cover = COVER[b.type] ?? COVER.otro;
  const Icon = cover.icon;
  return (
    <Link href={`/negocios/${b.id}`} className="pressable block w-40">
      <div className={`invert-dark relative flex h-28 w-full items-center justify-center overflow-hidden rounded-lg ${cover.bg}`}>
        <Icon size={32} className="text-primary-text" aria-hidden="true" />
        {b.cover_url && !broken && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={b.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" onError={() => setBroken(true)} />
        )}
        {b.rating_count > 0 && (
          <PhotoBadge className="left-2 top-2">
            <Rating value={b.rating_avg} />
          </PhotoBadge>
        )}
        {recommended && (
          <PhotoBadge tone="primary" className="bottom-2 left-2">
            Recomendado
          </PhotoBadge>
        )}
      </div>
      <div className="mt-2 truncate text-body font-semibold text-text">{b.name}</div>
      <div className="truncate text-small text-text-secondary">{meta}</div>
    </Link>
  );
}
