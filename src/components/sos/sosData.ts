import { createClient } from "@/lib/supabase/client";
import { fetchNearestEmergency, fetchPopularBusinesses } from "@/lib/api/businesses";
import { fetchPet } from "@/lib/api/pets";
import type { Business, PetRow } from "@/types/db";

export const SOS_CACHE_KEY = "paw.sos.cache";

export interface SosCache {
  at: string; // ISO
  items: Business[];
}

export interface ActiveMedication {
  name: string;
  dose_amount: number | null;
  dose_unit: string | null;
  frequency_value: number | null;
  frequency_unit: string | null;
}

export interface SosPetDetails {
  pet: PetRow | null;
  medications: ActiveMedication[];
  lastVaccine: { name: string; last_done_at: string } | null;
  ownerName: string | null;
}

export function readSosCache(): SosCache | null {
  try {
    const raw = localStorage.getItem(SOS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SosCache;
    if (!parsed || !Array.isArray(parsed.items)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSosCache(items: Business[]): SosCache {
  const cache: SosCache = { at: new Date().toISOString(), items };
  try {
    localStorage.setItem(SOS_CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* sin espacio o modo privado */
  }
  return cache;
}

function isEmergency(b: Business): boolean {
  return b.emergency_24h || (b.categories ?? []).includes("urgencias") || b.type === "urgencias";
}

/** Urgencias cercanas (RPC con geo) o populares con urgencias 24 h si no hay geo. */
export async function loadEmergencies(lat: number | null, lng: number | null): Promise<Business[]> {
  if (lat !== null && lng !== null) {
    const rows = await fetchNearestEmergency(lat, lng, 5);
    if (rows.length) return rows;
  }
  const popular = await fetchPopularBusinesses(undefined, 50);
  return popular.filter(isEmergency);
}

/** Distancia en metros (haversine) */
export function distanceM(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export async function loadSosPetDetails(petId: string): Promise<SosPetDetails> {
  const supabase = createClient();
  const pet = await fetchPet(petId);

  const [meds, vac, owner] = await Promise.all([
    supabase
      .from("medications")
      .select("name, dose_amount, dose_unit, frequency_value, frequency_unit")
      .eq("pet_id", petId)
      .eq("active", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("care_cycles")
      .select("name, last_done_at")
      .eq("pet_id", petId)
      .eq("kind", "vaccine")
      .eq("active", true)
      .not("last_done_at", "is", null)
      .order("last_done_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    pet?.user_id ? supabase.from("users").select("display_name").eq("id", pet.user_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);

  return {
    pet,
    medications: (meds.data ?? []) as ActiveMedication[],
    lastVaccine: (vac.data as { name: string; last_done_at: string } | null) ?? null,
    ownerName: (owner.data as { display_name: string | null } | null)?.display_name ?? null,
  };
}

export function medicationLabel(m: ActiveMedication): string {
  const dose = m.dose_amount !== null && m.dose_unit ? ` ${m.dose_amount} ${m.dose_unit}` : "";
  const freq = m.frequency_value !== null && m.frequency_unit ? ` · ${frequencyLabel(m.frequency_value, m.frequency_unit)}` : "";
  return `${m.name}${dose}${freq}`;
}

export function frequencyLabel(value: number, unit: string): string {
  switch (unit) {
    case "hours":
      return `cada ${value} h`;
    case "days":
      return value === 1 ? "cada día" : `cada ${value} días`;
    case "times_per_day":
      return `${value} ${value === 1 ? "vez" : "veces"} al día`;
    case "weekly":
      return `${value} por semana`;
    default:
      return `${value} ${unit}`;
  }
}

/** Texto del resumen clínico para compartir con el veterinario */
export function buildClinicalSummary(d: SosPetDetails, extra: { ageLabel: string; speciesLabel: string }): string {
  const p = d.pet;
  if (!p) return "";
  const lines: string[] = [];
  lines.push(`RESUMEN CLÍNICO · ${p.name}`);
  lines.push(`${extra.speciesLabel}${p.breed ? ` · ${p.breed}` : ""} · ${extra.ageLabel}${p.weight ? ` · ${p.weight} kg` : ""}`);
  lines.push(`Sexo: ${p.sex === "male" ? "macho" : p.sex === "female" ? "hembra" : "sin especificar"}${p.neutered ? " (esterilizado)" : ""}`);
  if (p.microchip) lines.push(`Microchip: ${p.microchip}`);
  if (p.blood_type) lines.push(`Grupo sanguíneo: ${p.blood_type}`);
  lines.push(`Alergias: ${p.allergies?.length ? p.allergies.join(", ") : "ninguna conocida"}`);
  lines.push(`Condiciones: ${p.conditions?.length ? p.conditions.join(", ") : "ninguna conocida"}`);
  lines.push(`Medicación activa: ${d.medications.length ? d.medications.map(medicationLabel).join("; ") : "ninguna"}`);
  if (d.lastVaccine) lines.push(`Última vacuna: ${d.lastVaccine.name} (${d.lastVaccine.last_done_at})`);
  if (p.emergency_contact?.phone) lines.push(`Contacto de emergencia: ${p.emergency_contact.name} ${p.emergency_contact.phone}`);
  lines.push(`Generado con Paw · ${new Date().toLocaleString("es-CO")}`);
  return lines.join("\n");
}

/** Comparte con la hoja nativa o copia al portapapeles. Devuelve "shared" | "copied" | "failed". */
export async function shareOrCopy(data: { title: string; text: string; url?: string }): Promise<"shared" | "copied" | "failed"> {
  try {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share(data);
      return "shared";
    }
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") return "failed";
  }
  try {
    await navigator.clipboard.writeText(data.url ? `${data.text}\n${data.url}` : data.text);
    return "copied";
  } catch {
    return "failed";
  }
}
