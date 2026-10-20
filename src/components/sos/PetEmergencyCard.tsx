"use client";
import { CircleAlert, Cpu, Droplet, FileText, type LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui";
import { PetHealth, PetMedication, PetVaccine } from "@/components/icons/pet";
import type { Pet } from "@/types";
import type { SosPetDetails } from "./sosData";
import { medicationLabel } from "./sosData";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Fact {
  icon: LucideIcon;
  label: string;
  value: string;
  /** dato que el veterinario debe ver primero (alergias, medicación) */
  important?: boolean;
}

/**
 * Ficha médica (estilo Ficha Médica de iOS): solo los datos que existen,
 * cada uno con su ícono. Lo importante (alergias, medicación) va primero
 * y en el color de advertencia.
 */
export function PetEmergencyCard({ pet, details, loading, onSummary, summaryLoading }: {
  pet: Pet;
  details: SosPetDetails | null;
  loading: boolean;
  onSummary: () => void;
  summaryLoading: boolean;
}) {
  const row = details?.pet ?? null;
  const meds = details?.medications ?? [];

  const facts: Fact[] = [
    row?.allergies?.length ? { icon: CircleAlert, label: "Alergias", value: row.allergies.join(", "), important: true } : null,
    meds.length ? { icon: PetMedication, label: "Medicación", value: meds.map(medicationLabel).join("; "), important: true } : null,
    row?.conditions?.length ? { icon: PetHealth, label: "Condiciones", value: row.conditions.join(", ") } : null,
    row?.blood_type ? { icon: Droplet, label: "Sangre", value: row.blood_type } : null,
    details?.lastVaccine ? { icon: PetVaccine, label: "Última vacuna", value: `${details.lastVaccine.name} · ${formatDate(details.lastVaccine.last_done_at)}` } : null,
    row?.microchip ? { icon: Cpu, label: "Microchip", value: row.microchip } : null,
  ].filter((f): f is Fact => f !== null);

  const weight = row?.weight ?? pet.weight;

  return (
    <section aria-labelledby="sos-ficha" className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-2">
        <h2 id="sos-ficha" className="text-subtitle font-semibold text-text">
          Ficha médica
        </h2>
        {weight ? <span className="text-small text-text-secondary">{weight} kg</span> : null}
      </div>

      {loading && !details ? (
        <div className="flex flex-col gap-3 px-4 pb-4" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-sm" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      ) : facts.length === 0 ? (
        <p className="px-4 pb-4 text-small text-text-secondary">Sin alergias ni medicación registradas.</p>
      ) : (
        <ul className="flex flex-col">
          {facts.map((f) => {
            const Icon = f.icon;
            return (
              <li key={f.label} className="flex items-center gap-3 border-t border-border px-4 py-3 first:border-t-0">
                <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-sm", f.important ? "bg-warning-soft text-warning-text" : "bg-surface-elevated text-text-secondary")}>
                  <Icon size={18} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-label text-text-secondary">{f.label}</span>
                  <span className={cn("block text-body font-semibold", f.important ? "text-warning-text" : "text-text")}>{f.value}</span>
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={onSummary}
        disabled={!row || summaryLoading}
        className="flex min-h-12 w-full items-center justify-center gap-2 border-t border-border text-label font-semibold text-primary-text disabled:opacity-50"
      >
        <FileText size={16} aria-hidden="true" />
        {summaryLoading ? "Preparando…" : "Resumen para el veterinario"}
      </button>
    </section>
  );
}
