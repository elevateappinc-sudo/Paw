"use client";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Skeleton, SkeletonSwap, severityFromDays, showToast, type Severity } from "@/components/ui";
import { completeCareCycle, daysUntil, fetchCareCycles } from "@/lib/api/careCycles";
import { CARE_KIND_ICON, isMissingRelation } from "@/components/pets/petHelpers";
import { CARE_KIND_LABEL } from "@/types/db";
import { DURATION, EASE_PLAYFUL, EASE_STANDARD } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { Pet } from "@/types";
import type { CareCycle } from "@/types/db";
import { HomeSectionError } from "./HomeSectionError";
import { HomeSectionHeader } from "./HomeSectionHeader";

type LoadError = "missing" | "failed" | null;

/** Color de la línea de fecha: azul de marca; solo lo vencido cambia de color */
const TONE: Record<Severity, { text: string }> = {
  overdue: { text: "text-overdue-text" },
  soon: { text: "text-primary-text" },
  ok: { text: "text-primary-text" },
  info: { text: "text-primary-text" },
};

/** Fecha corta para la tarjeta: "Vencido", "Hoy", "Mañana", "En 3 días" */
function shortDue(days: number): string {
  if (days < 0) return "Vencido";
  if (days === 0) return "Hoy";
  if (days === 1) return "Mañana";
  return `En ${days} días`;
}

/** Filas visibles; el resto se ve con la flecha */
const MAX_ROWS = 4;

/**
 * "Para hoy": lista compacta con lo pendiente (vencido y próximos 7 días).
 * Sin pendientes, la sección no se muestra. Marcar el check completa el
 * cuidado: el check se dibuja, la fila se va y el anillo de la tarjeta de la
 * mascota avanza (onCompleted).
 */
export function TodayCard({ pet, onCompleted }: { pet: Pet | null; onCompleted?: () => void }) {
  const [cycles, setCycles] = useState<CareCycle[] | null>(null);
  const [error, setError] = useState<LoadError>(null);
  const [done, setDone] = useState<Record<string, boolean>>({});

  const load = useCallback(async (petId: string) => {
    try {
      setCycles(await fetchCareCycles(petId));
      setError(null);
    } catch (e) {
      setCycles([]);
      setError(isMissingRelation(e) ? "missing" : "failed");
    }
  }, []);

  useEffect(() => {
    if (!pet) return;
    setCycles(null);
    setError(null);
    setDone({});
    void load(pet.id);
  }, [pet, load]);

  function retry() {
    if (!pet) return;
    setCycles(null);
    setError(null);
    void load(pet.id);
  }

  async function complete(c: CareCycle) {
    setDone((d) => ({ ...d, [c.id]: true }));
    try {
      await completeCareCycle(c.id);
      onCompleted?.();
    } catch {
      setDone((d) => ({ ...d, [c.id]: false }));
      showToast("No se pudo marcar como hecho", () => void complete(c), "error");
    }
  }

  if (!pet) return <TodayCardSkeleton />;

  const all = cycles ?? [];
  const pending = all
    .filter((c) => !done[c.id] && daysUntil(c.next_due_at) <= 7)
    .sort((a, b) => a.next_due_at.localeCompare(b.next_due_at));

  return (
    <section aria-labelledby="home-today">
      <SkeletonSwap loading={cycles === null} skeleton={<TodaySkeletonBody />} label="Cargando los cuidados de hoy" reserveSpace>
        {cycles === null ? null : error === "failed" ? (
          <div className="px-4">
            <HomeSectionError message="No pudimos cargar los cuidados de hoy." onRetry={retry} />
          </div>
        ) : pending.length === 0 ? null : (
          <>
            {/* El estado general (al día, progreso) vive en la tarjeta de la mascota; aquí solo lo pendiente */}
            <HomeSectionHeader id="home-today" title="Para hoy" badge={pending.length} href={`/salud?pet=${pet.id}`} linkLabel={`Ver todos los cuidados de ${pet.name}`} />

            <ul className="enter-soft-list mx-4 mt-3 flex flex-col gap-2" aria-label="Cuidados pendientes">
              <AnimatePresence initial={false}>
                {pending.slice(0, MAX_ROWS).map((c) => (
                  <CareRow key={c.id} cycle={c} onComplete={() => void complete(c)} />
                ))}
              </AnimatePresence>
            </ul>
          </>
        )}
      </SkeletonSwap>
    </section>
  );
}

/**
 * Cuidado como tarjeta flotante independiente (no fila de tabla): ícono de
 * marca en círculo, nombre y fecha corta; solo la fecha lleva el color de la
 * urgencia. Check fino al estilo de Recordatorios.
 */
function CareRow({ cycle, onComplete }: { cycle: CareCycle; onComplete: () => void }) {
  const reduce = useReducedMotion();
  const [checked, setChecked] = useState(false);
  const days = daysUntil(cycle.next_due_at);
  const tone = TONE[severityFromDays(days)];
  const Icon = CARE_KIND_ICON[cycle.kind];
  // Detalle solo si aporta algo distinto al nombre (producto o tipo de cuidado)
  const detail = [cycle.product, CARE_KIND_LABEL[cycle.kind]].find((t) => t && t.toLocaleLowerCase("es") !== cycle.name.toLocaleLowerCase("es")) ?? null;

  function check() {
    if (checked) return;
    setChecked(true);
    // El check se dibuja y luego la fila se va
    setTimeout(onComplete, reduce ? 0 : 520);
  }

  return (
    <motion.li
      layout={!reduce}
      exit={reduce ? { opacity: 0 } : { opacity: 0, x: 24 }}
      transition={{ duration: DURATION.base, ease: EASE_STANDARD }}
      className={cn("invert-dark flex items-center gap-3 rounded-xl border border-border bg-surface py-3 pl-3 pr-1 shadow-1 transition-opacity duration-[var(--duration-base)]", checked && "opacity-60")}
    >
      <span
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border transition-colors duration-[var(--duration-base)]",
          checked ? "border-transparent bg-success-soft text-success-text" : "border-border bg-primary-soft text-primary-text"
        )}
      >
        <Icon size={22} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body font-semibold text-text">{cycle.name}</span>
        <span className={cn("flex min-w-0 items-center gap-1.5 text-small", tone.text)}>
          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", days < 0 ? "bg-current" : "bg-accent")} aria-hidden="true" />
          <span className="truncate">
            {detail && `${detail} · `}
            <span className="font-semibold">{shortDue(days)}</span>
          </span>
        </span>
      </span>
      <button
        type="button"
        onClick={check}
        aria-pressed={checked}
        aria-label={checked ? `${cycle.name} hecho` : `Marcar ${cycle.name} como hecho`}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
      >
        <motion.span
          animate={checked && !reduce ? { scale: [1, 1.18, 1] } : { scale: 1 }}
          transition={{ duration: DURATION.slow, ease: EASE_PLAYFUL }}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full border-[1.5px] transition-colors duration-[var(--duration-fast)]",
            checked ? "border-success bg-success text-on-primary" : "border-text-secondary"
          )}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <motion.path
              d="M5 12.5l4.5 4.5L19 7.5"
              initial={false}
              animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
              transition={{ duration: reduce ? 0 : DURATION.slow, ease: EASE_PLAYFUL }}
            />
          </svg>
        </motion.span>
      </button>
    </motion.li>
  );
}

/** Misma geometría que el contenido: título y filas */
function TodaySkeletonBody() {
  return (
    <div aria-hidden="true">
      <div className="flex min-h-11 items-center px-4">
        <Skeleton className="h-5 w-24" />
      </div>
      <div className="mx-4 mt-3 flex flex-col gap-2">
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
            <Skeleton className="h-12 w-12 shrink-0 rounded-lg" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TodayCardSkeleton() {
  return (
    <section aria-hidden="true">
      <TodaySkeletonBody />
    </section>
  );
}
