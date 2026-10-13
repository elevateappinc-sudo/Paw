"use client";
/**
 * PhotoMonth — Sección de un mes con cabecera y rejilla de fotos.
 */
import { PhotoCard, type PhotoCardPhoto } from "./PhotoCard";
import type { ContextualBadge } from "./badges";

export interface MonthGroup {
  month_key: string;
  month_label: string;
  photo_count: number;
  photos: PhotoCardPhoto[];
}

interface PhotoMonthProps {
  group: MonthGroup;
  getBadges: (photo: PhotoCardPhoto) => ContextualBadge[];
  onPhotoClick: (photo: PhotoCardPhoto, group: MonthGroup) => void;
}

// La primera letra en mayúscula (toLocaleDateString devuelve el mes en minúscula)
function capitalizeMonth(label: string): string {
  return label.trim().replace(/^\w/, (c) => c.toUpperCase());
}

export function PhotoMonth({ group, getBadges, onPhotoClick }: PhotoMonthProps) {
  return (
    <section className="mb-7" aria-label={capitalizeMonth(group.month_label)}>
      <div className="mb-2.5 flex items-baseline gap-2 px-1">
        <h3 className="font-display text-[17px] leading-tight text-on">{capitalizeMonth(group.month_label)}</h3>
        <span className="text-[13px] text-on-variant">
          · {group.photo_count} {group.photo_count === 1 ? "foto" : "fotos"}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-1 md:grid-cols-4">
        {group.photos.map((photo) => (
          <PhotoCard key={photo.id} photo={photo} badges={getBadges(photo)} onClick={() => onPhotoClick(photo, group)} />
        ))}
      </div>
    </section>
  );
}
