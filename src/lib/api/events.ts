import { createClient } from "@/lib/supabase/client";
import type { PetEvent, EventCategory } from "@/types/db";

export const EVENT_CATEGORY_LABEL: Record<EventCategory, string> = {
  adopcion: "Adopción",
  clase: "Clases",
  carrera: "Carreras",
  feria: "Ferias",
  salud: "Salud",
  social: "Social",
  otro: "Otro",
};

export async function fetchUpcomingEvents(opts?: { city?: string; category?: EventCategory; limit?: number; userId?: string }): Promise<PetEvent[]> {
  const supabase = createClient();
  let q = supabase
    .from("events")
    .select("*, event_rsvps(user_id, status)")
    .eq("active", true)
    .gte("starts_at", new Date(Date.now() - 6 * 3600000).toISOString())
    .order("starts_at", { ascending: true })
    .limit(opts?.limit ?? 30);
  if (opts?.city) q = q.eq("city", opts.city);
  if (opts?.category) q = q.eq("category", opts.category);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((e: PetEvent & { event_rsvps?: { user_id: string; status: string }[] }) => ({
    ...e,
    going_count: (e.event_rsvps ?? []).filter((r) => r.status === "going").length,
    my_status: opts?.userId ? ((e.event_rsvps ?? []).find((r) => r.user_id === opts.userId)?.status as PetEvent["my_status"]) ?? null : null,
  }));
}

export async function fetchEvent(id: string, userId?: string): Promise<PetEvent | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("events").select("*, event_rsvps(user_id, status)").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const e = data as PetEvent & { event_rsvps?: { user_id: string; status: string }[] };
  return {
    ...e,
    going_count: (e.event_rsvps ?? []).filter((r) => r.status === "going").length,
    my_status: userId ? ((e.event_rsvps ?? []).find((r) => r.user_id === userId)?.status as PetEvent["my_status"]) ?? null : null,
  };
}

export async function rsvpEvent(eventId: string, userId: string, status: "going" | "interested" | "cancelled", petId?: string | null): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("event_rsvps").upsert({ event_id: eventId, user_id: userId, status, pet_id: petId ?? null }, { onConflict: "event_id,user_id" });
  if (error) throw error;
}

export async function createEvent(input: Partial<PetEvent> & { title: string; category: EventCategory; starts_at: string; created_by: string }): Promise<PetEvent> {
  const supabase = createClient();
  const { data, error } = await supabase.from("events").insert(input).select().single();
  if (error) throw error;
  return data as PetEvent;
}

export function eventDateLabel(iso: string): { dow: string; day: string; time: string } {
  const d = new Date(iso);
  return {
    dow: d.toLocaleDateString("es-CO", { weekday: "short" }).replace(".", ""),
    day: String(d.getDate()),
    time: d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
  };
}

/** Enlace a Google Calendar (sin integración) */
export function calendarLink(e: PetEvent): string {
  const fmt = (iso: string) => new Date(iso).toISOString().replace(/[-:]|\.\d{3}/g, "");
  const end = e.ends_at ?? new Date(new Date(e.starts_at).getTime() + 2 * 3600000).toISOString();
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${fmt(e.starts_at)}/${fmt(end)}`,
    details: e.description ?? "",
    location: e.address ?? "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
