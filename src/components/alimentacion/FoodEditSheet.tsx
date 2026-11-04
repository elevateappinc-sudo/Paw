"use client";
import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Sheet, Button, Input } from "@/components/ui";
import type { PetFood, PetMeal } from "@/types/db";
import { errorMessage, todayStr } from "@/components/salud/shared";

const DEFAULT_MEALS: PetMeal[] = [
  { time: "08:00", grams: 0 },
  { time: "18:00", grams: 0 },
];

function splitGrams(total: number, n: number): number[] {
  if (n <= 0) return [];
  const base = Math.floor(total / n / 5) * 5;
  const out = Array(n).fill(base) as number[];
  out[0] += total - base * n;
  return out;
}

export function FoodEditSheet({ open, onClose, food, suggestedGrams, onSave }: {
  open: boolean;
  onClose: () => void;
  food: PetFood | null;
  /** ración calculada con peso/etapa/actividad para prellenar */
  suggestedGrams: number | null;
  onSave: (food: PetFood) => Promise<void>;
}) {
  const [brand, setBrand] = useState("");
  const [product, setProduct] = useState("");
  const [bagKg, setBagKg] = useState("");
  const [openedAt, setOpenedAt] = useState("");
  const [grams, setGrams] = useState("");
  const [meals, setMeals] = useState<PetMeal[]>(DEFAULT_MEALS);
  const [snacks, setSnacks] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const g = food?.grams_per_day ?? suggestedGrams ?? 0;
    setBrand(food?.brand ?? "");
    setProduct(food?.product ?? "");
    setBagKg(food?.bag_kg ? String(food.bag_kg) : "");
    setOpenedAt(food?.opened_at ?? "");
    setGrams(g ? String(g) : "");
    const initialMeals = food?.meals?.length ? food.meals : DEFAULT_MEALS.map((m, i) => ({ ...m, grams: splitGrams(g, DEFAULT_MEALS.length)[i] ?? 0 }));
    setMeals(initialMeals);
    setSnacks(food?.snacks_per_day != null ? String(food.snacks_per_day) : "");
    setError(null);
  }, [open, food, suggestedGrams]);

  function updateMeal(i: number, patch: Partial<PetMeal>) {
    setMeals((ms) => ms.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  }

  function distribute() {
    const total = Number(grams) || 0;
    const parts = splitGrams(total, meals.length);
    setMeals((ms) => ms.map((m, i) => ({ ...m, grams: parts[i] ?? 0 })));
  }

  async function submit() {
    const gramsNum = grams ? Number(grams) : undefined;
    const bagNum = bagKg ? Number(bagKg) : undefined;
    const snacksNum = snacks ? Number(snacks) : undefined;
    if (gramsNum !== undefined && (Number.isNaN(gramsNum) || gramsNum <= 0)) return setError("Revisa los gramos por día.");
    if (bagNum !== undefined && (Number.isNaN(bagNum) || bagNum <= 0)) return setError("Revisa el tamaño de la bolsa.");
    if (snacksNum !== undefined && (Number.isNaN(snacksNum) || snacksNum < 0)) return setError("Revisa los snacks por día.");
    const cleanMeals = meals.filter((m) => m.time).map((m) => ({ time: m.time, grams: Number(m.grams) || 0 })).sort((a, b) => a.time.localeCompare(b.time));
    setSaving(true);
    setError(null);
    try {
      await onSave({
        ...(food ?? {}),
        brand: brand.trim() || undefined,
        product: product.trim() || undefined,
        bag_kg: bagNum,
        opened_at: openedAt || undefined,
        grams_per_day: gramsNum,
        meals: cleanMeals,
        snacks_per_day: snacksNum,
      });
      onClose();
    } catch (e) {
      setError(errorMessage(e, "No pudimos guardar. Intenta de nuevo."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Qué come"
      subtitle="Marca, bolsa y ración diaria"
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button onClick={() => void submit()} loading={saving} className="flex-[2]">Guardar</Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3 pb-2">
        <Input label="Marca" placeholder="Ej. Royal Canin, Hill's" value={brand} onChange={(e) => setBrand(e.target.value)} />
        <Input label="Producto" placeholder="Ej. Adult Medium, Indoor" value={product} onChange={(e) => setProduct(e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <Input label="Bolsa" type="number" inputMode="decimal" min={0} step={0.5} placeholder="0" value={bagKg} onChange={(e) => setBagKg(e.target.value)} trailing={<span className="text-small">kg</span>} />
          <Input label="Abierta el" type="date" max={todayStr()} value={openedAt} onChange={(e) => setOpenedAt(e.target.value)} />
        </div>
        <Input
          label="Gramos por día"
          type="number"
          inputMode="numeric"
          min={0}
          step={5}
          placeholder={suggestedGrams ? String(suggestedGrams) : "0"}
          value={grams}
          onChange={(e) => setGrams(e.target.value)}
          trailing={<span className="text-small">g</span>}
          hint={suggestedGrams ? `Sugerido según peso y etapa: ${suggestedGrams} g` : "Mira la etiqueta del alimento o pregunta a tu veterinario"}
        />

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-small font-semibold text-text-secondary">Comidas del día</span>
            <button type="button" onClick={distribute} className="text-small font-semibold text-primary-text">Repartir gramos</button>
          </div>
          {meals.map((m, i) => (
            <div key={i} className="flex items-end gap-2">
              <Input aria-label={`Hora de la comida ${i + 1}`} type="time" value={m.time} onChange={(e) => updateMeal(i, { time: e.target.value })} className="flex-1" />
              <Input aria-label={`Gramos de la comida ${i + 1}`} type="number" inputMode="numeric" min={0} step={5} value={String(m.grams || "")} placeholder="0" onChange={(e) => updateMeal(i, { grams: Number(e.target.value) })} trailing={<span className="text-small">g</span>} className="flex-1" />
              <Button variant="secondary" size="icon" aria-label="Quitar comida" onClick={() => setMeals((ms) => ms.filter((_, idx) => idx !== i))} disabled={meals.length <= 1}>
                <Trash2 size={18} />
              </Button>
            </div>
          ))}
          <Button variant="secondary" size="sm" leading={<Plus size={16} />} onClick={() => setMeals((ms) => [...ms, { time: "12:00", grams: 0 }])} className="self-start">
            Añadir comida
          </Button>
        </div>

        <Input label="Snacks por día" type="number" inputMode="numeric" min={0} step={1} placeholder="0" value={snacks} onChange={(e) => setSnacks(e.target.value)} hint="Máximo el 10 % de las calorías del día" />
        {error && <p role="alert" className="text-small font-semibold text-overdue-text">{error}</p>}
      </div>
    </Sheet>
  );
}
