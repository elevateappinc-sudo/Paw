import { createClient } from "@/lib/supabase/client";
import type { Gasto } from "@/types";

function mapRow(row: Record<string, unknown>): Gasto {
  return {
    id: row.id as string,
    petId: row.pet_id as string,
    concepto: row.categoria as string,
    monto: Number(row.monto),
    fecha: row.fecha as string,
    quien: (row.quien_pago as string) ?? "",
    notas: (row.descripcion as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}

function mapToDb(g: Omit<Gasto, "id" | "petId" | "createdAt">, petId: string, userId: string) {
  return {
    pet_id: petId,
    user_id: userId,
    monto: g.monto,
    fecha: g.fecha,
    categoria: g.concepto,
    descripcion: g.notas ?? null,
    quien_pago: g.quien ?? null,
  };
}

export async function fetchExpenses(petId: string): Promise<Gasto[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("pet_id", petId)
    .order("fecha", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function createExpense(
  g: Omit<Gasto, "id" | "petId" | "createdAt">,
  petId: string,
  userId: string
): Promise<Gasto> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("expenses")
    .insert(mapToDb(g, petId, userId))
    .select()
    .single();
  if (error) throw error;
  return mapRow(data);
}

export async function updateExpense(id: string, g: Partial<Gasto>): Promise<Gasto> {
  const supabase = createClient();
  const patch: Record<string, unknown> = {};
  if (g.monto !== undefined) patch.monto = g.monto;
  if (g.fecha !== undefined) patch.fecha = g.fecha;
  if (g.concepto !== undefined) patch.categoria = g.concepto;
  if (g.notas !== undefined) patch.descripcion = g.notas;
  if (g.quien !== undefined) patch.quien_pago = g.quien;
  patch.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("expenses")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapRow(data);
}

export async function deleteExpense(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw error;
}
