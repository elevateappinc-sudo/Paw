"use client";
import { PetWeight } from "@/components/icons/pet";
import { Button, Skeleton } from "@/components/ui";
import type { WeightLog } from "@/types/db";
import { WeightChart } from "./WeightChart";

/** Evolución del peso: gráfico y acción para registrar el de hoy (el valor actual vive en el mosaico de arriba) */
export function WeightCard({ weights, onAddWeight }: { weights: WeightLog[] | null; onAddWeight: () => void }) {
  return (
    <section aria-labelledby="pet-weight" className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 id="pet-weight" className="text-subtitle font-semibold text-text">
          Peso
        </h3>
        {weights && weights.length > 1 && <span className="text-small text-text-secondary">{weights.length} registros</span>}
      </div>
      <div className="mt-3">
        {weights === null ? (
          <Skeleton className="h-30 w-full" />
        ) : weights.length === 0 ? (
          <p className="text-small text-text-secondary">Aún no hay registros de peso.</p>
        ) : (
          <WeightChart logs={weights} />
        )}
      </div>
      <Button variant="secondary" full className="mt-3" onClick={onAddWeight} leading={<PetWeight size={18} aria-hidden="true" />}>
        Registrar peso de hoy
      </Button>
    </section>
  );
}
