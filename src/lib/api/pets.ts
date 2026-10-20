import { createClient } from "@/lib/supabase/client";
import type { PetRow, WeightLog, PetFood, Species } from "@/types/db";
import { today, toLocalISODate } from "@/lib/utils";
import { formatPetAge } from "@/lib/age";

export async function fetchPet(petId: string): Promise<PetRow | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("pets").select("*").eq("id", petId).maybeSingle();
  if (error) throw error;
  return (data as PetRow) ?? null;
}

export async function fetchMyPets(): Promise<PetRow[]> {
  const supabase = createClient();
  // RLS devuelve propias + compartidas (can_access_pet)
  const { data, error } = await supabase.from("pets").select("*").order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as PetRow[];
}

export async function updatePetProfile(petId: string, patch: Partial<Omit<PetRow, "id" | "user_id" | "created_at">>): Promise<PetRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pets")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", petId)
    .select()
    .single();
  if (error) throw error;
  return data as PetRow;
}

export async function createPet(input: {
  user_id: string;
  name: string;
  species: Species;
  breed?: string;
  birth_date?: string;
  weight?: number;
  sex?: PetRow["sex"];
  neutered?: boolean;
  microchip?: string;
  photo_url?: string;
  activity_level?: PetRow["activity_level"];
}): Promise<PetRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pets")
    .insert({ ...input, emoji: "🐾", color: "var(--color-pet-lavanda)" })
    .select()
    .single();
  if (error) throw error;
  const pet = data as PetRow;
  if (input.weight) {
    await supabase.from("weight_logs").insert({ pet_id: pet.id, user_id: input.user_id, weight_kg: input.weight });
  }
  return pet;
}

export async function updatePetFood(petId: string, food: PetFood): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("pets").update({ food, updated_at: new Date().toISOString() }).eq("id", petId);
  if (error) throw error;
}

// ── Peso ────────────────────────────────────────────────────────────────────
export async function fetchWeightLogs(petId: string, limit = 24): Promise<WeightLog[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("weight_logs")
    .select("*")
    .eq("pet_id", petId)
    .order("measured_at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as WeightLog[];
}

export async function addWeightLog(petId: string, userId: string, weightKg: number, measuredAt?: string, notes?: string): Promise<WeightLog> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("weight_logs")
    .insert({ pet_id: petId, user_id: userId, weight_kg: weightKg, measured_at: measuredAt ?? today(), notes: notes ?? null })
    .select()
    .single();
  if (error) throw error;
  return data as WeightLog;
}

// ── Utilidades ──────────────────────────────────────────────────────────────
/** Edad legible ("1 año y 8 meses"), nunca truncada. Ver src/lib/age.ts */
export function ageLabel(birthDate: string | null | undefined): string {
  return formatPetAge(birthDate) ?? "edad desconocida";
}

export function lifeStage(species: Species, birthDate: string | null | undefined): "puppy" | "adult" | "senior" {
  if (!birthDate) return "adult";
  const [y, m, d] = birthDate.split("-").map(Number);
  const days = Math.floor((Date.now() - new Date(y, m - 1, d).getTime()) / 86400000);
  if (days < 365) return "puppy";
  if (species === "perro" && days >= 365 * 7) return "senior";
  if (species === "gato" && days >= 365 * 10) return "senior";
  return "adult";
}

export const SPECIES_LABEL: Record<Species, string> = { perro: "Perro", gato: "Gato", ave: "Ave", conejo: "Conejo", otro: "Otro" };
export const SEX_LABEL = { male: "Macho", female: "Hembra", unknown: "Sin especificar" } as const;

/**
 * Ración diaria estimada en gramos (alimento seco ~3,7 kcal/g).
 * RER = 70 · kg^0.75 · factor según etapa, esterilización y actividad.
 */
export function dailyGrams(weightKg: number, opts: { stage: "puppy" | "adult" | "senior"; neutered: boolean; activity: PetRow["activity_level"]; kcalPerGram?: number }): number {
  const rer = 70 * Math.pow(weightKg, 0.75);
  let factor = opts.stage === "puppy" ? 2.5 : opts.stage === "senior" ? 1.2 : opts.neutered ? 1.4 : 1.6;
  if (opts.activity === "high") factor += 0.3;
  if (opts.activity === "low") factor -= 0.2;
  const kcal = rer * factor;
  return Math.round(kcal / (opts.kcalPerGram ?? 3.7) / 5) * 5;
}

/** Fecha estimada de recompra de alimento según consumo */
export function restockEstimate(food: PetFood | null | undefined): { daysLeft: number; pctLeft: number; date: string } | null {
  if (!food?.bag_kg || !food.opened_at || !food.grams_per_day) return null;
  const [y, m, d] = food.opened_at.split("-").map(Number);
  const opened = new Date(y, m - 1, d);
  const elapsedDays = Math.max(0, Math.floor((Date.now() - opened.getTime()) / 86400000));
  const totalDays = (food.bag_kg * 1000) / food.grams_per_day;
  const daysLeft = Math.max(0, Math.round(totalDays - elapsedDays));
  const pctLeft = Math.max(0, Math.min(1, 1 - elapsedDays / totalDays));
  const date = new Date(Date.now() + daysLeft * 86400000);
  return { daysLeft, pctLeft, date: toLocalISODate(date) };
}

export const TOXIC_FOODS: Record<"perro" | "gato", string[]> = {
  perro: ["Chocolate", "Uvas y pasas", "Cebolla y ajo", "Xilitol (edulcorante)", "Alcohol", "Aguacate", "Huesos cocidos", "Café", "Masa cruda", "Nueces de macadamia"],
  gato: ["Cebolla y ajo", "Chocolate", "Uvas y pasas", "Leche de vaca (adultos)", "Alcohol", "Lirios (planta)", "Huesos cocidos", "Café", "Atún en exceso", "Masa cruda"],
};
