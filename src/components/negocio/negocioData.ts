import { createClient } from "@/lib/supabase/client";
import type { Booking, BookingStatus, Business, BusinessCategory, BusinessHours } from "@/types/db";

export type PlanName = "free" | "pro" | "business";
export const PLAN_LABEL: Record<PlanName, string> = { free: "Plan Free", pro: "Plan Pro", business: "Plan Business" };

export const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type DayKey = (typeof DAY_KEYS)[number];
export const DAY_FULL: Record<DayKey, string> = { mon: "Lunes", tue: "Martes", wed: "Miércoles", thu: "Jueves", fri: "Viernes", sat: "Sábado", sun: "Domingo" };

export const DEFAULT_HOURS: BusinessHours = {
  mon: [["08:00", "18:00"]],
  tue: [["08:00", "18:00"]],
  wed: [["08:00", "18:00"]],
  thu: [["08:00", "18:00"]],
  fri: [["08:00", "18:00"]],
  sat: [["09:00", "14:00"]],
};

export const STATUS_TONE: Record<BookingStatus, { bar: string; tag: "warn" | "info" | "ok" | "neutral" | "overdue" }> = {
  requested: { bar: "bg-warning", tag: "warn" },
  confirmed: { bar: "bg-primary", tag: "info" },
  completed: { bar: "bg-success", tag: "ok" },
  cancelled: { bar: "bg-border", tag: "neutral" },
  no_show: { bar: "bg-overdue", tag: "overdue" },
};

/** Plan actual del negocio (free si no hay suscripción o la tabla no existe). */
export async function fetchPlan(businessId: string): Promise<PlanName> {
  const supabase = createClient();
  const { data, error } = await supabase.from("business_subscriptions").select("status, marketplace_plans(name)").eq("business_id", businessId).maybeSingle();
  if (error || !data) return "free";
  const row = data as { status: string | null; marketplace_plans: { name: string } | { name: string }[] | null };
  if (row.status && row.status !== "active") return "free";
  const plan = Array.isArray(row.marketplace_plans) ? row.marketplace_plans[0] : row.marketplace_plans;
  const name = plan?.name;
  return name === "pro" || name === "business" ? name : "free";
}

export async function changePlan(businessId: string, plan: PlanName): Promise<void> {
  const supabase = createClient();
  const { data: planRow, error: planErr } = await supabase.from("marketplace_plans").select("id").eq("name", plan).maybeSingle();
  if (planErr) throw planErr;
  if (!planRow) throw new Error("Plan no disponible");
  const { error } = await supabase
    .from("business_subscriptions")
    .upsert({ business_id: businessId, plan_id: (planRow as { id: string }).id, status: "active", current_period_start: new Date().toISOString() }, { onConflict: "business_id" });
  if (error) throw error;
}

/** Vistas de los últimos 7 días (listing_analytics). null si la tabla no existe o falla. */
export async function fetchViews7d(businessId: string): Promise<number | null> {
  const supabase = createClient();
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const { count, error } = await supabase
    .from("listing_analytics")
    .select("id, marketplace_listings!inner(business_id)", { count: "exact", head: true })
    .eq("marketplace_listings.business_id", businessId)
    .eq("event_type", "view")
    .gte("created_at", since);
  if (error) return null;
  return count ?? 0;
}

export async function countBookings7d(businessId: string): Promise<number> {
  const supabase = createClient();
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const { count, error } = await supabase.from("bookings").select("id", { count: "exact", head: true }).eq("business_id", businessId).gte("created_at", since);
  if (error) return 0;
  return count ?? 0;
}

// ── Fechas ──────────────────────────────────────────────────────────────────
export function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function dayRange(day: string): { from: string; to: string } {
  const [y, m, d] = day.split("-").map(Number);
  const start = new Date(y, m - 1, d, 0, 0, 0, 0);
  const end = new Date(y, m - 1, d, 23, 59, 59, 999);
  return { from: start.toISOString(), to: end.toISOString() };
}

export function nextDays(n = 7): { key: string; weekday: string; day: number; isToday: boolean }[] {
  const out = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    out.push({ key: ymd(d), weekday: d.toLocaleDateString("es-CO", { weekday: "short" }).replace(".", ""), day: d.getDate(), isToday: i === 0 });
  }
  return out;
}

export function bookingTime(b: Booking): string {
  return new Date(b.starts_at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

export function bookingDuration(b: Booking): number | null {
  if (b.business_services?.duration_min) return b.business_services.duration_min;
  if (b.ends_at) return Math.round((new Date(b.ends_at).getTime() - new Date(b.starts_at).getTime()) / 60000);
  return null;
}

// ── Formulario ──────────────────────────────────────────────────────────────
export interface BusinessFormValues {
  name: string;
  type: BusinessCategory;
  categories: BusinessCategory[];
  description: string;
  address: string;
  neighborhood: string;
  city: string;
  lat: string;
  lng: string;
  phone: string;
  whatsapp: string;
  hours: BusinessHours;
  emergency_24h: boolean;
  writes_history: boolean;
}

export function toFormValues(b: Business | null): BusinessFormValues {
  return {
    name: b?.name ?? "",
    type: b?.type ?? "veterinaria",
    categories: b?.categories?.length ? b.categories : b?.type ? [b.type] : ["veterinaria"],
    description: b?.description ?? "",
    address: b?.address ?? "",
    neighborhood: b?.neighborhood ?? "",
    city: b?.city ?? "Bogotá",
    lat: b?.lat !== null && b?.lat !== undefined ? String(b.lat) : "",
    lng: b?.lng !== null && b?.lng !== undefined ? String(b.lng) : "",
    phone: b?.phone ?? "",
    whatsapp: b?.whatsapp ?? "",
    hours: b?.hours ?? DEFAULT_HOURS,
    emergency_24h: b?.emergency_24h ?? false,
    writes_history: b?.writes_history ?? true,
  };
}

export function toBusinessPatch(v: BusinessFormValues, ownerId: string, id?: string): Partial<Business> & { owner_user_id: string; name: string; type: BusinessCategory } {
  const lat = v.lat.trim() ? Number(v.lat) : null;
  const lng = v.lng.trim() ? Number(v.lng) : null;
  const categories = v.categories.includes(v.type) ? v.categories : [v.type, ...v.categories];
  return {
    ...(id ? { id } : {}),
    owner_user_id: ownerId,
    name: v.name.trim(),
    type: v.type,
    categories,
    description: v.description.trim() || null,
    address: v.address.trim() || null,
    neighborhood: v.neighborhood.trim() || null,
    city: v.city.trim() || null,
    lat: lat !== null && Number.isFinite(lat) ? lat : null,
    lng: lng !== null && Number.isFinite(lng) ? lng : null,
    phone: v.phone.trim() || null,
    whatsapp: v.whatsapp.trim() || null,
    hours: v.hours,
    emergency_24h: v.emergency_24h,
    writes_history: v.writes_history,
    claimed: true,
    active: true,
  };
}
