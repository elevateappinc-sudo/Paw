"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronRight } from "lucide-react";
import { Skeleton, SkeletonSwap, severityFromDays, showToast, type Severity } from "@/components/ui";
import { completeCareCycle, daysUntil, fetchCareCycles } from "@/lib/api/careCycles";
import { CARE_KIND_ICON, isMissingRelation } from "@/components/pets/petHelpers";
import { DURATION, EASE_PLAYFUL, EASE_STANDARD } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { Pet } from "@/types";
import type { CareCycle } from "@/types/db";
import { HomeSectionError } from "./HomeSectionError";

type LoadError = "missing" | "failed" | null;

/** Colores de cada nivel de la escala de severidad para la tarjeta de cuidado */
const TONE: Record<Severity, { box: string; text: string }> = {
  overdue: { box: "bg-overdue-soft text-overdue-text", text: "text-overdue-text" },
  soon: { box: "bg-warning-soft text-warning-text", text: "text-warning-text" },
  ok: { box: "bg-success-soft text-success-text", text: "text-success-text" },
  info: { box: "bg-primary-soft text-primary-text", text: "text-primary-text" },
};

/** Fecha corta para la tarjeta: "Vencido", "Hoy", "Mañana", "3 días" */
function shortDue(days: number): string {
  if (days < 0) return "Vencido";
  if (days === 0) return "Hoy";
  if (days === 1) return "Mañana";
  return `${days} días`;
}

/**
 * "Para hoy": tarjetas cuadradas deslizables con lo pendiente (vencido y
 * próximos 7 días). Sin pendientes, la sección no se muestra.
 * Marcar el check completa el cuidado: el check se dibuja, la tarjeta se
 * va y el anillo avanza.
 */
export function TodayCard({ pet }: { pet: Pet | null }) {
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
            <div className="flex items-center justify-between gap-3 px-4">
              <h2 id="home-today" className="text-title font-semibold text-text">
                Para hoy
              </h2>
              <Link
                href={`/salud?pet=${pet.id}`}
                aria-label={`Ver todos los cuidados de ${pet.name}`}
                className="pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-elevated text-text-secondary"
              >
                <ChevronRight size={20} aria-hidden="true" />
              </Link>
            </div>

            {pending.length > 0 && (
              <ul
                className="no-scrollbar fade-edge enter-soft-list mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-1"
                aria-label="Cuidados pendientes"
              >
                <AnimatePresence initial={false}>
                  {pending.map((c) => (
                    <CareTile key={c.id} cycle={c} onComplete={() => void complete(c)} />
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </>
        )}
      </SkeletonSwap>
    </section>
  );
}

/** Tarjeta cuadrada de un cuidado: ícono grande, nombre, fecha corta y check */
function CareTile({ cycle, onComplete }: { cycle: CareCycle; onComplete: () => void }) {
  const reduce = useReducedMotion();
  const [checked, setChecked] = useState(false);
  const days = daysUntil(cycle.next_due_at);
  const tone = TONE[severityFromDays(days)];
  const Icon = CARE_KIND_ICON[cycle.kind];

  function check() {
    if (checked) return;
    setChecked(true);
    // El check se dibuja y luego la tarjeta se va (y el anillo avanza)
    setTimeout(onComplete, reduce ? 0 : 520);
  }

  return (
    <motion.li
      layout={!reduce}
      exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
      transition={{ duration: DURATION.base, ease: EASE_STANDARD }}
      className="snap-start"
    >
      <div
        className={cn(
          "relative flex h-36 w-36 flex-col justify-between rounded-lg border border-border bg-surface p-3 shadow-1 transition-opacity duration-[var(--duration-base)]",
          checked && "opacity-60"
        )}
      >
        <div className="flex items-start justify-between">
          <span className={cn("flex h-11 w-11 items-center justify-center rounded-md", checked ? "bg-success-soft text-success-text" : tone.box)}>
            <Icon size={24} aria-hidden="true" />
          </span>
          <button
            type="button"
            onClick={check}
            aria-pressed={checked}
            aria-label={checked ? `${cycle.name} hecho` : `Marcar ${cycle.name} como hecho`}
            className="-mr-2 -mt-2 flex h-11 w-11 items-center justify-center rounded-full"
          >
            <motion.span
              animate={checked && !reduce ? { scale: [1, 1.18, 1] } : { scale: 1 }}
              transition={{ duration: DURATION.slow, ease: EASE_PLAYFUL }}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors duration-[var(--duration-fast)]",
                checked ? "border-success bg-success text-on-primary" : "border-border bg-surface"
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
        </div>
        <div className="min-w-0">
          <div className="line-clamp-2 text-body font-semibold leading-tight text-text">{cycle.name}</div>
          <div className={cn("mt-1 text-label font-semibold", tone.text)}>{shortDue(days)}</div>
        </div>
      </div>
    </motion.li>
  );
}

/** Misma geometría que el contenido: anillo + título y fila de tarjetas */
function TodaySkeletonBody() {
  return (
    <div aria-hidden="true">
      <div className="flex min-h-11 items-center px-4">
        <Skeleton className="h-5 w-24" />
      </div>
      <div className="mt-3 flex gap-3 overflow-hidden px-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-36 w-36 shrink-0 rounded-lg" />
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
