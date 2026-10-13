import { createClient } from "@/lib/supabase/client";
import type { LostPetAlert } from "@/types/db";

export interface Sighting {
  id: string;
  alert_id: string;
  user_id: string | null;
  lat: number | null;
  lng: number | null;
  message: string | null;
  photo_url: string | null;
  created_at: string;
}

export async function fetchAlert(id: string): Promise<LostPetAlert | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("lost_pet_alerts").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as LostPetAlert) ?? null;
}

export async function fetchSightings(alertId: string): Promise<Sighting[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("lost_pet_sightings").select("*").eq("alert_id", alertId).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Sighting[];
}

export const RADIUS_OPTIONS = [
  { value: 1000, label: "1 km" },
  { value: 3000, label: "3 km" },
  { value: 5000, label: "5 km" },
];

export function radiusKm(m: number): string {
  return `${Math.round(m / 100) / 10} km`.replace(".0", "");
}

export function buildPosterText(input: { petName: string; breed?: string | null; address?: string | null; message?: string | null; phone?: string | null; reward?: number | null; url: string }): string {
  const lines = [`SE BUSCA · ${input.petName.toUpperCase()}`];
  if (input.breed) lines.push(input.breed);
  if (input.address) lines.push(`Visto por última vez en ${input.address}`);
  if (input.message) lines.push(input.message);
  if (input.phone) lines.push(`Si lo ves, llama al ${input.phone}`);
  if (input.reward) lines.push(`Recompensa: ${input.reward.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}`);
  lines.push(`Ficha completa: ${input.url}`);
  return lines.join("\n");
}
