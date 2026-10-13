import { createClient } from "@/lib/supabase/client";
import type { Business, BusinessCategory, BusinessService, NearbyBusiness, Review } from "@/types/db";

export interface NearbyParams {
  lat: number;
  lng: number;
  radiusM?: number;
  categories?: BusinessCategory[];
  openNow?: boolean;
  minRating?: number;
  limit?: number;
}

export async function fetchNearbyBusinesses(p: NearbyParams): Promise<NearbyBusiness[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("nearby_businesses", {
    p_lat: p.lat,
    p_lng: p.lng,
    p_radius_m: p.radiusM ?? 2000,
    p_categories: p.categories && p.categories.length ? p.categories : null,
    p_open_now: p.openNow ?? false,
    p_min_rating: p.minRating ?? null,
    p_limit: p.limit ?? 50,
  });
  if (error) throw error;
  return (data ?? []) as NearbyBusiness[];
}

/** Sin ubicación: populares de la ciudad */
export async function fetchPopularBusinesses(city?: string, limit = 20): Promise<Business[]> {
  const supabase = createClient();
  let q = supabase.from("businesses").select("*").eq("active", true).order("rating_count", { ascending: false }).limit(limit);
  if (city) q = q.eq("city", city);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Business[];
}

export async function searchBusinesses(text: string, limit = 20): Promise<Business[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("active", true)
    .or(`name.ilike.%${text}%,description.ilike.%${text}%,neighborhood.ilike.%${text}%`)
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Business[];
}

export async function fetchBusiness(id: string): Promise<Business | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("businesses").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as Business) ?? null;
}

export async function fetchBusinessServices(businessId: string): Promise<BusinessService[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("business_services")
    .select("*")
    .eq("business_id", businessId)
    .eq("active", true)
    .order("sort", { ascending: true });
  if (error) throw error;
  return (data ?? []) as BusinessService[];
}

export async function fetchReviews(businessId: string, limit = 20): Promise<Review[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*, users(display_name), pets(name, breed)")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Review[];
}

export async function upsertReview(input: { business_id: string; user_id: string; pet_id?: string | null; rating: number; body?: string }): Promise<Review> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("reviews")
    .upsert({ ...input, body: input.body ?? null, pet_id: input.pet_id ?? null }, { onConflict: "business_id,user_id" })
    .select()
    .single();
  if (error) throw error;
  return data as Review;
}

export async function replyReview(reviewId: string, reply: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("reviews").update({ reply, replied_at: new Date().toISOString() }).eq("id", reviewId);
  if (error) throw error;
}

export async function fetchNearestEmergency(lat: number, lng: number, limit = 3): Promise<Business[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("nearest_emergency", { p_lat: lat, p_lng: lng, p_limit: limit });
  if (error) throw error;
  return (data ?? []) as Business[];
}

export async function fetchSavedBusinessIds(userId: string): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("saved_businesses").select("business_id").eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((r: { business_id: string }) => r.business_id);
}

export async function toggleSavedBusiness(userId: string, businessId: string, saved: boolean): Promise<void> {
  const supabase = createClient();
  if (saved) {
    const { error } = await supabase.from("saved_businesses").insert({ user_id: userId, business_id: businessId });
    if (error && error.code !== "23505") throw error;
  } else {
    const { error } = await supabase.from("saved_businesses").delete().eq("user_id", userId).eq("business_id", businessId);
    if (error) throw error;
  }
}

// ── Negocio propio (panel) ──────────────────────────────────────────────────
export async function fetchMyBusiness(userId: string): Promise<Business | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("businesses").select("*").eq("owner_user_id", userId).order("created_at").limit(1).maybeSingle();
  if (error) throw error;
  return (data as Business) ?? null;
}

export async function upsertBusiness(input: Partial<Business> & { owner_user_id: string; name: string; type: BusinessCategory }): Promise<Business> {
  const supabase = createClient();
  const { data, error } = await supabase.from("businesses").upsert(input).select().single();
  if (error) throw error;
  return data as Business;
}

export async function upsertService(input: Partial<BusinessService> & { business_id: string; name: string }): Promise<BusinessService> {
  const supabase = createClient();
  const { data, error } = await supabase.from("business_services").upsert(input).select().single();
  if (error) throw error;
  return data as BusinessService;
}

export async function deleteService(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("business_services").update({ active: false }).eq("id", id);
  if (error) throw error;
}

// ── Utilidades ──────────────────────────────────────────────────────────────
export function distanceLabel(m: number): string {
  if (m < 1000) return `${Math.round(m / 10) * 10} m`;
  return `${(m / 1000).toLocaleString("es-CO", { maximumFractionDigits: 1 })} km`;
}

export function isOpenNow(hours: Business["hours"] | null | undefined, emergency = false, now = new Date()): boolean {
  if (emergency) return true;
  if (!hours) return false;
  const key = (["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const)[now.getDay()];
  const slots = hours[key];
  if (!slots) return false;
  const t = now.toTimeString().slice(0, 5);
  return slots.some(([a, b]) => t >= a && t <= b);
}

export function closesAtLabel(hours: Business["hours"] | null | undefined, now = new Date()): string | null {
  if (!hours) return null;
  const key = (["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const)[now.getDay()];
  const slots = hours[key];
  if (!slots) return null;
  const t = now.toTimeString().slice(0, 5);
  const cur = slots.find(([a, b]) => t >= a && t <= b);
  if (cur) return `cierra ${cur[1]}`;
  const next = slots.find(([a]) => t < a);
  return next ? `abre ${next[0]}` : null;
}

export const DAY_LABEL: Record<string, string> = { mon: "L", tue: "M", wed: "X", thu: "J", fri: "V", sat: "S", sun: "D" };
