"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check, Clock } from "lucide-react";
import { Card, CardHeader, Tag } from "@/components/ui";
import { useStore } from "@/store";
import { useAuthContext } from "@/contexts/AuthContext";
import type { PetMeal } from "@/types/db";
import { cn } from "@/lib/utils";
import { todayStr } from "@/components/salud/shared";

interface DayState {
  meals: string[]; // horas marcadas
  snacks: number;
}

function storageKey(petId: string, date: string) {
  return `paw.meals.${petId}.${date}`;
}

function readDay(petId: string, date: string): DayState {
  try {
    const raw = localStorage.getItem(storageKey(petId, date));
    if (!raw) return { meals: [], snacks: 0 };
    const parsed = JSON.parse(raw) as Partial<DayState>;
    return { meals: Array.isArray(parsed.meals) ? parsed.meals : [], snacks: typeof parsed.snacks === "number" ? parsed.snacks : 0 };
  } catch {
    return { meals: [], snacks: 0 };
  }
}

function writeDay(petId: string, date: string, state: DayState) {
  try {
    localStorage.setItem(storageKey(petId, date), JSON.stringify(state));
  } catch {
    /* almacenamiento no disponible */
  }
}

/** Normaliza "8:00" → "08:00" */
function normTime(t: string): string {
  const [h = "0", m = "0"] = t.split(":");
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
}

/**
 * Estado del día (comidas marcadas y snacks). Persiste en localStorage y,
 * si ya existen items de comida en el itinerario, también en `itinerary_records`.
 */
export function useMealDay(petId: string) {
  const date = todayStr();
  const { itinerario, registros, fetchItinerario, toggleRegistro, selectedPetId } = useStore();
  const { user } = useAuthContext();
  const [state, setState] = useState<DayState>({ meals: [], snacks: 0 });

  useEffect(() => {
    setState(readDay(petId, date));
  }, [petId, date]);

  useEffect(() => {
    if (selectedPetId === petId) void fetchItinerario();
  }, [selectedPetId, petId, fetchItinerario]);

  const mealItems = useMemo(() => itinerario.filter((i) => i.petId === petId && i.tipo === "comida"), [itinerario, petId]);

  const isDone = useCallback(
    (time: string) => {
      const t = normTime(time);
      if (state.meals.includes(t)) return true;
      const item = mealItems.find((i) => normTime(i.hora) === t);
      if (!item) return false;
      return registros.some((r) => r.itemId === item.id && r.fecha === date && r.completado);
    },
    [state.meals, mealItems, registros, date]
  );

  const toggleMeal = useCallback(
    (time: string) => {
      const t = normTime(time);
      const wasDone = isDone(t);
      const next: DayState = { ...state, meals: wasDone ? state.meals.filter((x) => x !== t) : [...state.meals, t] };
      setState(next);
      writeDay(petId, date, next);
      const item = mealItems.find((i) => normTime(i.hora) === t);
      if (item && user) {
        const rec = registros.find((r) => r.itemId === item.id && r.fecha === date);
        const recDone = !!rec?.completado;
        if (recDone === wasDone) void toggleRegistro(item.id, date, user.id);
      }
    },
    [state, petId, date, mealItems, user, registros, toggleRegistro, isDone]
  );

  const setSnacks = useCallback(
    (n: number) => {
      const next = { ...state, snacks: Math.max(0, n) };
      setState(next);
      writeDay(petId, date, next);
    },
    [state, petId, date]
  );

  return { isDone, toggleMeal, snacks: state.snacks, setSnacks, syncsItinerary: mealItems.length > 0 };
}

export function MealsCard({ meals, totalGrams, explanation, isDone, toggleMeal }: {
  meals: PetMeal[];
  totalGrams: number | null;
  explanation: string;
  isDone: (time: string) => boolean;
  toggleMeal: (time: string) => void;
}) {
  const reduce = useReducedMotion();
  const doneCount = meals.filter((m) => isDone(m.time)).length;

  return (
    <Card>
      <CardHeader title="Ración diaria" subtitle={explanation} action={meals.length > 0 ? `${doneCount}/${meals.length}` : undefined} />
      <div className="mb-3 flex items-baseline gap-1">
        <span className="font-semibold text-display leading-none text-text">{totalGrams ?? "—"}</span>
        <span className="text-body font-semibold text-text-secondary">g al día</span>
      </div>
      {meals.length === 0 ? (
        <p className="text-body text-text-secondary">Añade las horas de comida con el botón Editar.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-2">
          {meals.map((m) => {
            const done = isDone(m.time);
            return (
              <li key={m.time}>
                <button
                  type="button"
                  onClick={() => toggleMeal(m.time)}
                  aria-pressed={done}
                  className={cn(
                    "flex min-h-16 w-full items-center gap-3 rounded-md px-3 py-3 text-left transition-colors active:scale-[0.98]",
                    done ? "bg-success-soft text-success-text" : "bg-surface-elevated text-text"
                  )}
                >
                  <motion.span
                    initial={false}
                    animate={done && !reduce ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                    transition={{ duration: 0.25 }}
                    className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", done ? "bg-success text-on-primary" : "bg-surface text-text-secondary")}
                  >
                    {done ? <Check size={18} strokeWidth={3} /> : <Clock size={16} />}
                  </motion.span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-body font-semibold">{m.time}</span>
                    <span className="block text-label opacity-80">{m.grams} g</span>
                  </span>
                  <Tag tone={done ? "ok" : "neutral"} size="xs">{done ? "Hecho" : "Pendiente"}</Tag>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
