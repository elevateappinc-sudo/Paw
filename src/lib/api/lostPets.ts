import { createClient } from "@/lib/supabase/client";
import type { LostPetAlert, NearbyLostPet, EmergencyCard } from "@/types/db";

export async function fetchActiveAlert(petId: string): Promise<LostPetAlert | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("lost_pet_alerts").select("*").eq("pet_id", petId).eq("status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return (data as LostPetAlert) ?? null;
}

export async function fetchMyActiveAlerts(userId: string): Promise<LostPetAlert[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("lost_pet_alerts").select("*").eq("user_id", userId).eq("status", "active");
  if (error) throw error;
  return (data ?? []) as LostPetAlert[];
}

export async function createLostAlert(input: {
  pet_id: string;
  user_id: string;
  lat?: number;
  lng?: number;
  address?: string;
  message?: string;
  contact_phone?: string;
  photo_url?: string;
  radius_m?: number;
  reward?: number;
}): Promise<LostPetAlert> {
  const supabase = createClient();
  const { data, error } = await supabase.from("lost_pet_alerts").insert({ ...input, status: "active", last_seen_at: new Date().toISOString() }).select().single();
  if (error) throw error;
  // notificar a usuarios cercanos (edge function, best effort)
  try {
    await supabase.functions.invoke("lost-pet-broadcast", { body: { alert_id: (data as LostPetAlert).id } });
  } catch {
    /* la alerta queda creada aunque no se envíe push */
  }
  return data as LostPetAlert;
}

export async function resolveLostAlert(id: string, status: "found" | "cancelled"): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("lost_pet_alerts").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function fetchNearbyLostPets(lat: number, lng: number, radiusM = 5000): Promise<NearbyLostPet[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("nearby_lost_pets", { p_lat: lat, p_lng: lng, p_radius_m: radiusM });
  if (error) throw error;
  return (data ?? []) as NearbyLostPet[];
}

export async function reportSighting(alertId: string, input: { user_id?: string; lat?: number; lng?: number; message?: string }): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("lost_pet_sightings").insert({ alert_id: alertId, ...input });
  if (error) throw error;
}

export async function saveUserLocation(userId: string, lat: number, lng: number, city?: string, neighborhood?: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("user_locations").upsert({ user_id: userId, lat, lng, city: city ?? null, neighborhood: neighborhood ?? null });
}

export async function fetchEmergencyCard(token: string): Promise<EmergencyCard | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("pet_emergency_card", { p_token: token });
  if (error) throw error;
  const rows = (data ?? []) as EmergencyCard[];
  return rows[0] ?? null;
}

/** Token de emergencia (QR de la placa). Crea uno si no existe. */
export async function ensureEmergencyToken(petId: string, userId: string): Promise<string> {
  const supabase = createClient();
  const { data } = await supabase.from("share_tokens").select("token").eq("pet_id", petId).eq("scope", "emergency").limit(1).maybeSingle();
  if (data?.token) return data.token as string;
  const token = crypto.randomUUID().replace(/-/g, "").slice(0, 20);
  const { error } = await supabase.from("share_tokens").insert({ pet_id: petId, token, scope: "emergency", user_id: userId, expires_at: "2099-12-31T00:00:00.000Z" });
  if (error) throw error;
  return token;
}
