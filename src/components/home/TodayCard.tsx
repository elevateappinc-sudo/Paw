"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";
import { Card, SectionTitle, Skeleton, buttonVariants, showToast } from "@/components/ui";
import { completeCareCycle, cycleUrgency, dueLabel, fetchCareCycles } from "@/lib/api/careCycles";
import { CARE_KIND_BOOKING, CARE_KIND_ICON, isMissingRelation } from "@/components/pets/petHelpers";
import { cn } from "@/lib/utils";
import type { Pet } from "@/types";
import type { CareCycle } from "@/types/db";

/** "Hoy le toca a {nombre}": hasta 3 ciclos próximos de la mascota activa */
export function TodayCard({ pet }: { pet: Pet | null }) {
  const [cycles, setCycles] = useState<CareCycle[] | null>(null);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const toasted = useRef(false);

  const load = useCallback(async (petId: string) => {
    try {
      const all = await fetchCareCycles(petId);
      setCycles(all.filter((c) => c.kind !== "dental").slice(0, 3));
    } catch (e) {
      setCycles([]);
      if (!toasted.current) {
        toasted.current = true;
        showToast(isMissingRelation(e) ? "El plan de cuidados aún no está disponible" : "No pudimos cargar los cuidados de hoy", undefined, "error");
      }
    }
  }, []);

  useEffect(() => {
    if (!pet) return;
    setCycles(null);
    setDone({});
    void load(pet.id);
  }, [pet, load]);

  async function complete(c: CareCycle) {
    setDone((d) => ({ ...d, [c.id]: true }));
    try {
      await completeCareCycle(c.id);
      showToast(`${c.name}: hecho`, undefined, "success");
      if (pet) setTimeout(() => void load(pet.id), 600);
    } catch {
      setDone((d) => ({ ...d, [c.id]: false }));
      showToast("No se pudo marcar como hecho", () => void complete(c), "error");
    }
  }

  if (!pet) {
    return (
      <section className="px-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-3 h-[196px] w-full rounded-card-lg" />
      </section>
    );
  }

  return (
    <section className="px-4" aria-labelledby="home-today">
      <SectionTitle action={<Link href={`/salud?pet=${pet.id}`}>Ver todo</Link>}>
        <span id="home-today">Hoy le toca a {pet.name}</span>
      </SectionTitle>
      <Card padded={false} className="mt-3 overflow-hidden">
        {cycles === null ? (
          <div className="flex flex-col gap-1 p-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 px-2 py-2.5">
                <Skeleton className="h-11 w-11 rounded-[14px]" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-3.5 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-11 w-11 rounded-full" />
              </div>
            ))}
          </div>
        ) : cycles.length === 0 ? (
          <p className="px-4 py-6 text-center text-[15px] text-on-variant">Nada pendiente por ahora. {pet.name} está al día.</p>
        ) : (
          <ul className="flex flex-col">
            {cycles.map((c, i) => (
              <CycleRow key={c.id} cycle={c} highlight={i === 0} done={!!done[c.id]} onComplete={() => void complete(c)} />
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}

function CycleRow({ cycle, highlight, done, onComplete }: { cycle: CareCycle; highlight: boolean; done: boolean; onComplete: () => void }) {
  const reduce = useReducedMotion();
  const urgency = cycleUrgency(cycle);
  const warn = highlight && (urgency === "soon" || urgency === "overdue");
  const Icon = CARE_KIND_ICON[cycle.kind];
  const booking = CARE_KIND_BOOKING[cycle.kind];

  return (
    <li className={cn("flex items-center gap-3 px-4 py-3", warn ? "bg-warn-container" : "border-t border-outline-variant first:border-t-0")}>
      <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]", warn ? "bg-surface text-warn" : "bg-primary-container text-on-primary-container")}>
        <Icon size={22} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className={cn("truncate text-[16px] font-bold", warn ? "text-on-warn-container" : "text-on")}>{cycle.name}</div>
        <div className={cn("text-[13px] font-semibold", warn ? "text-warn" : urgency === "overdue" ? "text-danger" : "text-on-variant")}>{dueLabel(cycle.next_due_at)}</div>
      </div>
      {booking && !done && (
        <Link href={`/explorar?cat=${booking}`} className={buttonVariants({ variant: "tonal", size: "sm" })}>
          Reservar
        </Link>
      )}
      <button
        type="button"
        onClick={onComplete}
        disabled={done}
        aria-label={done ? `${cycle.name} hecho` : `Marcar ${cycle.name} como hecho`}
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          done ? "border-primary bg-primary text-on-primary" : "border-outline bg-surface text-transparent active:scale-95"
        )}
      >
        <AnimatePresence>
          {done && (
            <motion.span initial={reduce ? false : { scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 500, damping: 24 }}>
              <Check size={22} strokeWidth={3} aria-hidden="true" />
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </li>
  );
}
