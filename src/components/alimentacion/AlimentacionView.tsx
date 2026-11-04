"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Pencil, Cookie, Plus, TriangleAlert, ArrowRight } from "lucide-react";
import { PetFood as PetFoodIcon, PetShop } from "@/components/icons/pet";
import { PageHeader, Card, CardHeader, Button, Tag, ProgressBar, EmptyState, Divider } from "@/components/ui";
import { showToast } from "@/components/ui/Toast";
import { useActivePet } from "@/hooks/useActivePet";
import { fetchPet, fetchWeightLogs, updatePetFood, dailyGrams, lifeStage, restockEstimate, TOXIC_FOODS } from "@/lib/api/pets";
import type { PetFood, PetRow } from "@/types/db";
import { cn } from "@/lib/utils";
import { fadeUp, stagger } from "@/lib/motion";
import { isMissingRelation, longDate, shortDate, toastOnce } from "@/components/salud/shared";
import { AlimentacionSkeleton } from "./AlimentacionSkeleton";
import { MealsCard, useMealDay } from "./MealsCard";
import { FoodEditSheet } from "./FoodEditSheet";
import { DietChangeSheet, type DietChange } from "./DietChangeSheet";
import { ToxicSheet } from "./ToxicSheet";

const STAGE_LABEL = { puppy: "cachorro", adult: "adulto", senior: "sénior" } as const;
const ACTIVITY_LABEL = { low: "actividad baja", medium: "actividad media", high: "actividad alta" } as const;

function hasFoodData(food: PetFood | null): boolean {
  return !!food && !!(food.brand || food.product || food.grams_per_day || food.bag_kg);
}

export function AlimentacionView() {
  const router = useRouter();
  const { pet } = useActivePet();
  const [profile, setProfile] = useState<PetRow | null>(null);
  const [latestWeight, setLatestWeight] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showToxic, setShowToxic] = useState(false);
  const [showChange, setShowChange] = useState(false);

  const load = useCallback(async (petId: string) => {
    setLoading(true);
    setError(null);
    try {
      const [p, weights] = await Promise.all([
        fetchPet(petId),
        fetchWeightLogs(petId, 1).catch((e: unknown) => {
          if (isMissingRelation(e)) toastOnce("missing:weight_logs", "El registro de peso aún no está disponible en tu cuenta.");
          return [];
        }),
      ]);
      setProfile(p);
      const w = weights.length ? Number(weights[weights.length - 1].weight_kg) : null;
      setLatestWeight(w ?? p?.weight ?? null);
    } catch (e) {
      console.error("[alimentacion]", e);
      setError("No pudimos cargar la alimentación.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!pet) {
      setLoading(false);
      return;
    }
    void load(pet.id);
  }, [pet, load]);

  const petId = pet?.id ?? "";
  const day = useMealDay(petId);

  const food = profile?.food ?? null;
  const species = profile?.species ?? pet?.species ?? "perro";
  const stage = lifeStage(species, profile?.birth_date);
  const neutered = profile?.neutered ?? false;
  const activity = profile?.activity_level ?? "medium";
  const suggested = latestWeight ? dailyGrams(latestWeight, { stage, neutered, activity }) : null;
  const totalGrams = food?.grams_per_day ?? suggested;
  const meals = food?.meals ?? [];
  const restock = restockEstimate(food);
  const toxic = species === "perro" || species === "gato" ? TOXIC_FOODS[species] : [];
  const speciesPlural = species === "gato" ? "gatos" : species === "perro" ? "perros" : "mascotas";
  const allergies = profile?.allergies ?? [];
  const snacksMax = food?.snacks_per_day ?? 0;
  const changes = useMemo(() => [...(food?.changes ?? [])].sort((a, b) => (a.date < b.date ? 1 : -1)), [food]);

  const explanation = latestWeight
    ? `Calculada para ${latestWeight} kg, ${STAGE_LABEL[stage]}, ${ACTIVITY_LABEL[activity]}, ${neutered ? "esterilizado" : "sin esterilizar"}`
    : "Añade el peso en el perfil para calcular la ración";

  async function saveFood(next: PetFood) {
    if (!pet) return;
    await updatePetFood(pet.id, next);
    setProfile((p) => (p ? { ...p, food: next } : p));
    showToast("Alimentación guardada", undefined, "success");
  }

  async function addChange(change: DietChange) {
    const next: PetFood = { ...(food ?? {}), changes: [...(food?.changes ?? []), change] };
    if (change.to) {
      // El nuevo alimento pasa a ser el actual (marca y producto en un solo texto)
      next.product = change.to;
    }
    await saveFood(next);
  }

  if (!pet) {
    return (
      <div className="pb-8">
        <PageHeader back backHref="/mascotas" title="Alimentación" />
        <EmptyState title="Añade una mascota" description="Para llevar su alimentación necesitas registrarla primero." action={<Button full onClick={() => router.push("/mascotas/nueva")}>Añadir mascota</Button>} />
      </div>
    );
  }

  if (loading) return <AlimentacionSkeleton />;

  const currentFoodLabel = [food?.brand, food?.product].filter(Boolean).join(" ");

  return (
    <div className="pb-8">
      <PageHeader
        back
        backHref={`/mascotas/${pet.id}`}
        eyebrow={pet.name}
        title="Alimentación"
        actions={
          hasFoodData(food) ? (
            <Button variant="secondary" size="icon" aria-label="Editar alimentación" onClick={() => setShowEdit(true)}>
              <Pencil size={20} />
            </Button>
          ) : undefined
        }
      />

      {error ? (
        <div className="px-4">
          <EmptyState title="No pudimos cargar" description={error} action={<Button full onClick={() => void load(pet.id)}>Reintentar</Button>} />
        </div>
      ) : (
        <motion.div variants={stagger()} initial="hidden" animate="show" className="flex flex-col gap-3 px-4">
          {/* Alimento actual */}
          <motion.div variants={fadeUp}>
            {hasFoodData(food) ? (
              <Card className="bg-gradient-to-br from-surface to-surface-elevated">
                <CardHeader
                  title="Alimento actual"
                  subtitle={currentFoodLabel || "Sin marca"}
                  action={<button type="button" onClick={() => setShowEdit(true)} className="min-h-11">Editar</button>}
                />
                <p className="text-small text-text-secondary">
                  {food?.bag_kg ? `Bolsa de ${food.bag_kg} kg` : "Tamaño de bolsa sin registrar"}
                  {food?.opened_at ? ` · abierta el ${shortDate(food.opened_at)}` : ""}
                </p>
                {restock ? (
                  <div className="mt-3">
                    <div className="mb-2 flex items-center justify-between text-small">
                      <span className="font-semibold text-text">Queda {Math.round(restock.pctLeft * 100)} %</span>
                      <span className={cn("font-semibold", restock.daysLeft <= 3 ? "text-warning-text" : "text-text-secondary")}>
                        Recompra estimada: {longDate(restock.date)}
                      </span>
                    </div>
                    <ProgressBar value={restock.pctLeft} tone={restock.daysLeft <= 3 ? "warn" : "primary"} />
                  </div>
                ) : (
                  <p className="mt-3 text-small text-text-secondary">Añade bolsa, fecha de apertura y gramos por día para estimar la recompra.</p>
                )}
                <Button full className="mt-4" leading={<PetShop size={18} />} onClick={() => router.push("/explorar?cat=tienda")}>
                  Pedir en tienda cercana
                </Button>
              </Card>
            ) : (
              <Card tone="container" elevation={0}>
                <EmptyState
                  compact
                  icon={<PetFoodIcon size={24} />}
                  title="Cuéntanos qué come"
                  description={`Con la marca, la bolsa y la ración te avisamos cuándo comprar más para ${pet.name}.`}
                  action={<Button full onClick={() => setShowEdit(true)}>Añadir alimento</Button>}
                />
              </Card>
            )}
          </motion.div>

          {/* Ración diaria */}
          <motion.div variants={fadeUp}>
            <MealsCard meals={meals} totalGrams={totalGrams} explanation={explanation} isDone={day.isDone} toggleMeal={day.toggleMeal} />
          </motion.div>

          {/* Snacks */}
          <motion.div variants={fadeUp}>
            <Card>
              <CardHeader title="Snacks de hoy" action={snacksMax > 0 ? `${Math.min(day.snacks, snacksMax)} de ${snacksMax}` : undefined} />
              {snacksMax > 0 ? (
                <div className="flex gap-2" role="group" aria-label="Snacks dados hoy">
                  {Array.from({ length: snacksMax }, (_, i) => {
                    const filled = i < day.snacks;
                    return (
                      <button
                        key={i}
                        type="button"
                        aria-pressed={filled}
                        aria-label={`Snack ${i + 1}`}
                        onClick={() => day.setSnacks(filled && i === day.snacks - 1 ? i : i + 1)}
                        className={cn("flex h-11 flex-1 items-center justify-center rounded-md transition-colors active:scale-95", filled ? "bg-accent text-on-accent" : "bg-surface-elevated text-text-secondary")}
                      >
                        <Cookie size={18} />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-body text-text-secondary">Sin snacks configurados. Añádelos al editar la alimentación.</p>
              )}
              <p className="mt-2 text-label text-text-secondary">Máximo 10 % de las calorías del día.</p>
            </Card>
          </motion.div>

          {/* Nunca */}
          {(toxic.length > 0 || allergies.length > 0) && (
            <motion.div variants={fadeUp}>
              <Card className="border-warning">
                <CardHeader
                  title={
                    <span className="inline-flex items-center gap-2">
                      <TriangleAlert size={18} className="text-warning-text" aria-hidden="true" />
                      Nunca para {speciesPlural}
                    </span>
                  }
                  action={toxic.length > 0 ? <button type="button" onClick={() => setShowToxic(true)} className="min-h-11">Ver lista</button> : undefined}
                />
                <div className="flex flex-wrap gap-2">
                  {toxic.slice(0, 6).map((f) => <Tag key={f} tone="warn">{f}</Tag>)}
                  {allergies.map((a) => <Tag key={`al-${a}`} tone="warn">Alergia: {a}</Tag>)}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Cambios de dieta */}
          <motion.div variants={fadeUp}>
            <Card padded={false}>
              <div className="px-4 pt-4">
                <CardHeader
                  title="Cambios de dieta"
                  action={
                    <button type="button" onClick={() => setShowChange(true)} className="inline-flex min-h-11 items-center gap-1">
                      <Plus size={16} /> Añadir
                    </button>
                  }
                />
              </div>
              {changes.length === 0 ? (
                <p className="px-4 pb-4 text-body text-text-secondary">Sin cambios registrados. Anota cada cambio de alimento para seguir cómo le sienta.</p>
              ) : (
                <ul className="pb-2">
                  {changes.map((c, i) => (
                    <li key={`${c.date}-${i}`}>
                      {i > 0 && <Divider />}
                      <div className="px-4 py-3">
                        <div className="text-label font-semibold text-text-secondary">{longDate(c.date)}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-body font-semibold text-text">
                          <span className="text-text-secondary">{c.from || "—"}</span>
                          <ArrowRight size={14} className="text-text-secondary" aria-hidden="true" />
                          <span>{c.to || "—"}</span>
                        </div>
                        {c.reason && <div className="text-small text-text-secondary">{c.reason}</div>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </motion.div>
        </motion.div>
      )}

      <FoodEditSheet open={showEdit} onClose={() => setShowEdit(false)} food={food} suggestedGrams={suggested} onSave={saveFood} />
      <DietChangeSheet open={showChange} onClose={() => setShowChange(false)} currentFood={currentFoodLabel || undefined} onSave={addChange} />
      <ToxicSheet open={showToxic} onClose={() => setShowToxic(false)} speciesLabel={speciesPlural} foods={toxic} allergies={allergies} />
    </div>
  );
}
