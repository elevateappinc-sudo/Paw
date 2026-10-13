"use client";
import { Clock, SlidersHorizontal, Star } from "lucide-react";
import { Chip, ChipRow } from "@/components/ui";
import type { BusinessCategory } from "@/types/db";
import { CATEGORY_CHIPS, type RadiusM } from "./lib";

export interface ExploreFilters {
  radius: RadiusM;
  minRating: boolean;
  sortPrice: boolean;
  openNow: boolean;
}

export function CategoryChips({ value, onChange }: { value: BusinessCategory | null; onChange: (v: BusinessCategory | null) => void }) {
  return (
    <ChipRow className="mx-0 px-4">
      {CATEGORY_CHIPS.map((c) => {
        const selected = c.id === "all" ? value === null : value === c.id;
        return (
          <Chip key={c.id} glass selected={selected} onClick={() => onChange(c.id === "all" ? null : c.id)}>
            {c.label}
          </Chip>
        );
      })}
    </ChipRow>
  );
}

export function FilterChips({ value, onChange, radiusEnabled }: { value: ExploreFilters; onChange: (v: ExploreFilters) => void; radiusEnabled: boolean }) {
  return (
    <ChipRow className="mx-0 px-4">
      {radiusEnabled && (
        <Chip glass selected={value.radius === 5000} onClick={() => onChange({ ...value, radius: value.radius === 2000 ? 5000 : 2000 })} leading={<SlidersHorizontal size={14} />}>
          Hasta {value.radius === 2000 ? "2 km" : "5 km"}
        </Chip>
      )}
      <Chip glass selected={value.minRating} onClick={() => onChange({ ...value, minRating: !value.minRating })} leading={value.minRating ? undefined : <Star size={14} />}>
        4,5 o más
      </Chip>
      <Chip glass selected={value.sortPrice} onClick={() => onChange({ ...value, sortPrice: !value.sortPrice })}>
        Precio
      </Chip>
      <Chip glass selected={value.openNow} onClick={() => onChange({ ...value, openNow: !value.openNow })} leading={value.openNow ? undefined : <Clock size={14} />}>
        Abierto ahora
      </Chip>
    </ChipRow>
  );
}
