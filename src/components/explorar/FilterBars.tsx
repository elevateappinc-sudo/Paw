"use client";
import { SlidersHorizontal } from "lucide-react";
import { Button, Chip, ChipRow, Sheet } from "@/components/ui";
import type { BusinessCategory } from "@/types/db";
import { CATEGORY_CHIPS, RADIUS_OPTIONS, activeFilterCount, type RadiusM } from "./lib";

export interface ExploreFilters {
  radius: RadiusM;
  minRating: boolean;
  sortPrice: boolean;
  openNow: boolean;
}

export const DEFAULT_FILTERS: ExploreFilters = { radius: 2000, minRating: false, sortPrice: false, openNow: false };

export function radiusLabel(r: RadiusM): string {
  return `${r / 1000} km`;
}

/**
 * Una sola fila: botón "Filtros" (con contador) fijo a la izquierda y las
 * categorías con scroll horizontal y desvanecido en el borde.
 */
export function CategoryBar({
  value,
  onChange,
  filterCount,
  onOpenFilters,
}: {
  value: BusinessCategory | null;
  onChange: (v: BusinessCategory | null) => void;
  filterCount: number;
  onOpenFilters: () => void;
}) {
  return (
    <div className="flex items-center gap-2 pl-4">
      <Chip onClick={onOpenFilters} count={filterCount} leading={<SlidersHorizontal size={14} aria-hidden="true" />}>
        Filtros
      </Chip>
      <ChipRow className="mx-0 min-w-0 flex-1 pl-0 pr-4">
        {CATEGORY_CHIPS.map((c) => {
          const selected = c.id === "all" ? value === null : value === c.id;
          return (
            <Chip key={c.id} selected={selected} onClick={() => onChange(c.id === "all" ? null : c.id)}>
              {c.label}
            </Chip>
          );
        })}
      </ChipRow>
    </div>
  );
}

function FilterGroup({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-subtitle font-semibold text-text">{title}</legend>
      {hint && <p className="-mt-1 text-small text-text-secondary">{hint}</p>}
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

/** Hoja con los filtros de distancia, calificación, precio y horario. */
export function FiltersSheet({
  open,
  onClose,
  value,
  onChange,
  radiusEnabled,
}: {
  open: boolean;
  onClose: () => void;
  value: ExploreFilters;
  onChange: (v: ExploreFilters) => void;
  radiusEnabled: boolean;
}) {
  const count = activeFilterCount(value, radiusEnabled);
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Filtros"
      subtitle={count > 0 ? `${count} ${count === 1 ? "filtro aplicado" : "filtros aplicados"}` : "Sin filtros aplicados"}
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" disabled={count === 0} onClick={() => onChange(DEFAULT_FILTERS)}>
            Limpiar
          </Button>
          <Button className="flex-1" onClick={onClose}>
            Ver resultados
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6 pb-2">
        <FilterGroup title="Distancia" hint={radiusEnabled ? undefined : "Activa tu ubicación para filtrar por distancia."}>
          {radiusEnabled &&
            RADIUS_OPTIONS.map((r) => (
              <Chip key={r} selected={value.radius === r} onClick={() => onChange({ ...value, radius: r })}>
                Hasta {radiusLabel(r)}
              </Chip>
            ))}
        </FilterGroup>
        <FilterGroup title="Calificación">
          <Chip selected={value.minRating} onClick={() => onChange({ ...value, minRating: !value.minRating })}>
            4,5 o más
          </Chip>
        </FilterGroup>
        <FilterGroup title="Precio">
          <Chip selected={value.sortPrice} onClick={() => onChange({ ...value, sortPrice: !value.sortPrice })}>
            Menor precio primero
          </Chip>
        </FilterGroup>
        <FilterGroup title="Horario">
          <Chip selected={value.openNow} onClick={() => onChange({ ...value, openNow: !value.openNow })}>
            Abierto ahora
          </Chip>
        </FilterGroup>
      </div>
    </Sheet>
  );
}
