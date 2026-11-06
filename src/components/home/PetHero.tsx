"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, ShieldAlert, ShieldCheck } from "lucide-react";
import { ProgressRing, Skeleton } from "@/components/ui";
import { PetWeight } from "@/components/icons/pet";
import { PetAvatar } from "@/components/pets/PetAvatar";
import { daysUntil, fetchCareCycles } from "@/lib/api/careCycles";
import { SEX_LABEL, SPECIES_LABEL } from "@/lib/api/pets";
import { formatPetAge } from "@/lib/age";
import { cn } from "@/lib/utils";
import type { Pet } from "@/types";
import type { CareCycle } from "@/types/db";

/**
 * Mascota activa: etiqueta superior con el selector de avatares apilados y
 * una sola tarjeta destacada (degradado celeste) con foto, datos, anillo de
 * cuidados al día y una franja inferior con vacunas y peso.
 */
export function PetHero({ pets, active, onSelect, refreshKey = 0 }: { pets: Pet[]; active: Pet; onSelect: (id: string) => void; refreshKey?: number }) {
  return (
    <section aria-labelledby="home-pet" className="px-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id="home-pet" className="eyebrow flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
          Mascota activa
        </h2>
        <PetSwitcher pets={pets} activeId={active.id} onSelect={onSelect} />
      </div>
      <PetHeroCard key={active.id} pet={active} refreshKey={refreshKey} />
    </section>
  );
}

/** Avatares superpuestos; el activo lleva anillo primario. El "+" añade otra mascota. */
function PetSwitcher({ pets, activeId, onSelect }: { pets: Pet[]; activeId: string; onSelect: (id: string) => void }) {
  return (
    <div className="flex items-center" role="group" aria-label="Cambiar de mascota">
      {pets.map((p, i) => {
        const on = p.id === activeId;
        return (
          // Área táctil de 44 px; el avatar visible mide 32 px y se superpone
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.id)}
            aria-pressed={on}
            aria-label={p.name}
            className={cn("pressable relative flex h-11 w-9 items-center justify-center", i > 0 && "-ml-1")}
            style={{ zIndex: on ? 10 : pets.length - i }}
          >
            <span className={cn("rounded-full border-2 transition-colors duration-[var(--duration-base)]", on ? "border-primary" : "border-surface")}>
              <PetAvatar pet={p} size="sm" style={{ width: 28, height: 28, borderRadius: "var(--radius-full)" }} />
            </span>
          </button>
        );
      })}
      <Link
        href="/mascotas/nueva"
        aria-label="Añadir mascota"
        className="pressable -ml-1 flex h-11 w-9 items-center justify-center"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface bg-primary-soft text-primary-text">
          <Plus size={14} strokeWidth={2.6} aria-hidden="true" />
        </span>
      </Link>
    </div>
  );
}

function PetHeroCard({ pet, refreshKey }: { pet: Pet; refreshKey: number }) {
  const [cycles, setCycles] = useState<CareCycle[] | null>(null);

  // Al completar un cuidado en "Para hoy" se vuelve a leer sin pasar por el esqueleto
  useEffect(() => {
    let cancelled = false;
    fetchCareCycles(pet.id)
      .then((c) => !cancelled && setCycles(c))
      .catch(() => !cancelled && setCycles((prev) => prev ?? []));
    return () => {
      cancelled = true;
    };
  }, [pet.id, refreshKey]);

  const total = cycles?.length ?? 0;
  const upToDate = cycles ? cycles.filter((c) => daysUntil(c.next_due_at) > 7).length : 0;
  const vaccines = cycles?.filter((c) => c.kind === "vaccine") ?? [];
  const vaccinesOk = vaccines.every((c) => daysUntil(c.next_due_at) >= 0);
  const age = formatPetAge(pet.birthDate);
  const sex = pet.sex && pet.sex !== "unknown" ? SEX_LABEL[pet.sex] : null;

  return (
    <article className="hero-surface invert-dark mt-2 rounded-xl p-4">
      <div className="flex items-center gap-4">
        <Link href={`/mascotas/${pet.id}`} className="pressable shrink-0 rounded-lg border-2 border-surface" aria-label={`Perfil de ${pet.name}`}>
          <PetAvatar pet={pet} size="lg" style={{ width: 76, height: 76, borderRadius: "calc(var(--radius-lg) - 2px)" }} />
        </Link>
        <Link href={`/mascotas/${pet.id}`} className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-title font-semibold text-text">{pet.name}</span>
            {sex && <span className="shrink-0 rounded-full bg-pastel-glass px-2 py-0.5 text-label font-semibold text-primary-text">{sex}</span>}
          </span>
          <span className="block truncate text-small font-semibold text-primary-text">{pet.breed || SPECIES_LABEL[pet.species]}</span>
          {age && <span className="block truncate text-small text-text-secondary">{age}</span>}
        </Link>
        {cycles === null ? (
          <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
        ) : total > 0 ? (
          // Un solo indicador de estado, al estilo de los anillos de Actividad
          <Link href={`/salud?pet=${pet.id}`} aria-label={`${upToDate} de ${total} cuidados al día`} className="pressable shrink-0 rounded-full">
            <ProgressRing
              value={upToDate / total}
              size={64}
              stroke={6}
              tone="info"
              label={
                <span className="flex flex-col items-center leading-none">
                  <span className="text-body font-semibold tabular-nums text-text">
                    {upToDate}
                    <span className="text-label font-normal text-text-secondary">/{total}</span>
                  </span>
                  <span className="mt-0.5 text-label font-normal text-text-secondary">al día</span>
                </span>
              }
            />
          </Link>
        ) : null}
      </div>

      {cycles !== null && (
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-pastel-glass pt-3">
          {total === 0 ? (
            <Link href={`/salud?pet=${pet.id}`} className="pressable inline-flex min-h-9 items-center gap-1 rounded-full bg-pastel-glass px-3 text-small font-semibold text-primary-text">
              <Plus size={14} aria-hidden="true" /> Armar su plan de cuidados
            </Link>
          ) : vaccines.length > 0 ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full bg-pastel-glass px-3 py-1 text-small font-semibold",
                vaccinesOk ? "text-primary-text" : "text-overdue-text"
              )}
            >
              {vaccinesOk ? <ShieldCheck size={14} aria-hidden="true" /> : <ShieldAlert size={14} aria-hidden="true" />}
              {vaccinesOk ? "Vacunas al día" : "Vacuna vencida"}
            </span>
          ) : (
            <span />
          )}
          {pet.weight ? (
            <span className="inline-flex items-center gap-1 text-small text-text-secondary">
              <PetWeight size={14} aria-hidden="true" />
              {pet.weight.toLocaleString("es-CO", { maximumFractionDigits: 1 })} kg
            </span>
          ) : null}
        </div>
      )}
    </article>
  );
}

export function PetHeroSkeleton() {
  return (
    <div className="px-4" aria-hidden="true">
      <div className="flex h-11 items-center justify-between">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
      <div className="mt-2 rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-lg" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-16 w-16 rounded-full" />
        </div>
        <Skeleton className="mt-4 h-7 w-32 rounded-full" />
      </div>
    </div>
  );
}
