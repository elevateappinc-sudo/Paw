import { createClient } from "@/lib/supabase/client";
import type { Booking, BookingStatus } from "@/types/db";
import { today } from "@/lib/utils";

const SELECT = "*, businesses(id, name, address, cover_url, logo_url, whatsapp, phone, lat, lng), business_services(id, name, duration_min, price, care_cycle_kind), pets(id, name, avatar_config)";

export async function fetchMyBookings(userId: string): Promise<Booking[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("bookings").select(SELECT).eq("user_id", userId).order("starts_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Booking[];
}

export async function fetchPetBookings(petId: string): Promise<Booking[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("bookings").select(SELECT).eq("pet_id", petId).order("starts_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Booking[];
}

export async function fetchBusinessBookings(businessId: string, from?: string, to?: string): Promise<Booking[]> {
  const supabase = createClient();
  let q = supabase.from("bookings").select(SELECT).eq("business_id", businessId).order("starts_at", { ascending: true });
  if (from) q = q.gte("starts_at", from);
  if (to) q = q.lte("starts_at", to);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Booking[];
}

export async function createBooking(input: {
  business_id: string;
  service_id: string | null;
  pet_id: string;
  user_id: string;
  starts_at: string;
  duration_min?: number | null;
  price?: number | null;
  notes?: string;
}): Promise<Booking> {
  const supabase = createClient();
  const ends = input.duration_min ? new Date(new Date(input.starts_at).getTime() + input.duration_min * 60000).toISOString() : null;
  const { data, error } = await supabase
    .from("bookings")
    .insert({
      business_id: input.business_id,
      service_id: input.service_id,
      pet_id: input.pet_id,
      user_id: input.user_id,
      starts_at: input.starts_at,
      ends_at: ends,
      price: input.price ?? null,
      notes: input.notes ?? null,
      status: "requested",
    })
    .select(SELECT)
    .single();
  if (error) throw error;
  return data as Booking;
}

export async function updateBookingStatus(id: string, status: BookingStatus, businessNotes?: string): Promise<Booking> {
  const supabase = createClient();
  const patch: Record<string, unknown> = { status };
  if (businessNotes !== undefined) patch.business_notes = businessNotes;
  const { data, error } = await supabase.from("bookings").update(patch).eq("id", id).select(SELECT).single();
  if (error) throw error;
  return data as Booking;
}

/** Franjas disponibles de un día (30 min) a partir del horario y las reservas existentes */
export function availableSlots(opts: {
  date: string; // YYYY-MM-DD
  hours: [string, string][] | undefined;
  durationMin: number;
  taken: { starts_at: string; ends_at: string | null }[];
  stepMin?: number;
}): { time: string; available: boolean }[] {
  const { date, hours, durationMin, taken, stepMin = 30 } = opts;
  if (!hours || hours.length === 0) return [];
  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  const dayStart = new Date(`${date}T00:00:00`);
  const busy = taken.map((b) => {
    const s = new Date(b.starts_at);
    const e = b.ends_at ? new Date(b.ends_at) : new Date(s.getTime() + 30 * 60000);
    return [(s.getTime() - dayStart.getTime()) / 60000, (e.getTime() - dayStart.getTime()) / 60000] as [number, number];
  });
  const now = new Date();
  const isToday = date === today();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const out: { time: string; available: boolean }[] = [];
  for (const [a, b] of hours) {
    for (let m = toMin(a); m + durationMin <= toMin(b); m += stepMin) {
      const overlaps = busy.some(([s, e]) => m < e && m + durationMin > s);
      const past = isToday && m <= nowMin;
      out.push({ time: `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`, available: !overlaps && !past });
    }
  }
  return out;
}

export const STATUS_LABEL: Record<BookingStatus, string> = {
  requested: "Por confirmar",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
  no_show: "No asistió",
};
