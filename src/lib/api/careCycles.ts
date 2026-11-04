import { createClient } from "@/lib/supabase/client";
import type { CareCycle, CareCycleLog, CareCycleKind, IntervalUnit } from "@/types/db";
import { today } from "@/lib/utils";

export async function fetchCareCycles(petId: string): Promise<CareCycle[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("care_cycles")
    .select("*")
    .eq("pet_id", petId)
    .eq("active", true)
    .order("next_due_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as CareCycle[];
}

/** Próximos ciclos de todas las mascotas del usuario (para Inicio) */
export async function fetchUpcomingCycles(petIds: string[], limit = 6): Promise<CareCycle[]> {
  if (petIds.length === 0) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("care_cycles")
    .select("*")
    .in("pet_id", petIds)
    .eq("active", true)
    .neq("kind", "dental")
    .order("next_due_at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as CareCycle[];
}

export async function fetchCycleLogs(petId: string, opts?: { kinds?: CareCycleKind[]; limit?: number }): Promise<(CareCycleLog & { care_cycles: Pick<CareCycle, "name" | "kind"> | null })[]> {
  const supabase = createClient();
  const q = supabase
    .from("care_cycle_logs")
    .select("*, care_cycles(name, kind)")
    .eq("pet_id", petId)
    .order("done_at", { ascending: false })
    .limit(opts?.limit ?? 100);
  const { data, error } = await q;
  if (error) throw error;
  let rows = (data ?? []) as (CareCycleLog & { care_cycles: Pick<CareCycle, "name" | "kind"> | null })[];
  if (opts?.kinds) rows = rows.filter((r) => r.care_cycles && opts.kinds!.includes(r.care_cycles.kind));
  return rows;
}

export async function completeCareCycle(cycleId: string, input?: { done_at?: string; product?: string; dose?: string; cost?: number; notes?: string; business_id?: string }): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("complete_care_cycle", {
    p_cycle_id: cycleId,
    p_done_at: input?.done_at ?? today(),
    p_product: input?.product ?? null,
    p_dose: input?.dose ?? null,
    p_cost: input?.cost ?? null,
    p_notes: input?.notes ?? null,
    p_business_id: input?.business_id ?? null,
  });
  if (error) throw error;
  return data as string;
}

/** Ciclos incluidos los desactivados (para reactivar) */
export async function fetchAllCareCycles(petId: string): Promise<CareCycle[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("care_cycles").select("*").eq("pet_id", petId).order("next_due_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as CareCycle[];
}

export const UNIT_DAYS: Record<IntervalUnit, number> = { days: 1, weeks: 7, months: 30 };

export function intervalToDays(value: number, unit: IntervalUnit): number {
  return Math.max(1, Math.round(value * UNIT_DAYS[unit]));
}

/** "Cada 3 meses", "Cada 2 semanas", "Diario" */
export function intervalLabel(c: Pick<CareCycle, "interval_days" | "interval_value" | "interval_unit">): string {
  const v = c.interval_value ?? c.interval_days;
  const u = c.interval_value ? c.interval_unit : "days";
  if (u === "days" && v === 1) return "Diario";
  const word = u === "months" ? (v === 1 ? "mes" : "meses") : u === "weeks" ? (v === 1 ? "semana" : "semanas") : v === 1 ? "día" : "días";
  return `Cada ${v} ${word}`;
}

export async function createCareCycle(input: {
  pet_id: string;
  user_id: string;
  kind: CareCycleKind;
  name: string;
  interval_days: number;
  interval_value?: number;
  interval_unit?: IntervalUnit;
  next_due_at: string;
  last_done_at?: string;
  product?: string;
  dose?: string;
  notes?: string;
}): Promise<CareCycle> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("care_cycles")
    .insert({ ...input, source: "manual" })
    .select()
    .single();
  if (error) throw error;
  return data as CareCycle;
}

export async function updateCareCycle(id: string, patch: Partial<Pick<CareCycle, "name" | "interval_days" | "interval_value" | "interval_unit" | "next_due_at" | "product" | "dose" | "notes" | "active">>): Promise<CareCycle> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("care_cycles")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as CareCycle;
}

export async function deleteCareCycle(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("care_cycles").update({ active: false }).eq("id", id);
  if (error) throw error;
}

export async function regenerateCycles(petId: string): Promise<number> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("generate_care_cycles_for_pet", { p_pet_id: petId });
  if (error) throw error;
  return (data as number) ?? 0;
}

/** Días hasta la próxima fecha (negativo si venció) */
export function daysUntil(dateStr: string, from = new Date()): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  const due = new Date(y, m - 1, d);
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}

export type CycleUrgency = "overdue" | "soon" | "upcoming" | "ok";

export function cycleUrgency(c: Pick<CareCycle, "next_due_at" | "interval_days">): CycleUrgency {
  const d = daysUntil(c.next_due_at);
  if (d < 0) return "overdue";
  if (d <= 7) return "soon"; // design-system: vence pronto = 7 días o menos
  if (d <= 14) return "upcoming";
  return "ok";
}

/** Progreso del ciclo 0..1 (1 = vence hoy) */
export function cycleProgress(c: Pick<CareCycle, "next_due_at" | "interval_days">): number {
  const d = daysUntil(c.next_due_at);
  if (d <= 0) return 1;
  return Math.max(0, Math.min(1, 1 - d / c.interval_days));
}

export function dueLabel(dateStr: string): string {
  const d = daysUntil(dateStr);
  if (d < -1) return `Venció hace ${-d} días`;
  if (d === -1) return "Venció ayer";
  if (d === 0) return "Hoy";
  if (d === 1) return "Mañana";
  if (d <= 6) return `En ${d} días`;
  const [y, m, day] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, day).toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short" });
}
