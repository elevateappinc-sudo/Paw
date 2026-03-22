import { createClient } from "@/lib/supabase/client";
import type { Vacuna } from "@/types";

function mapRow(row: Record<string, unknown>): Vacuna {
  return {
    id: row.id as string,
    petId: row.pet_id as string,
    nombre: row.nombre as string,
    fecha: row.fecha_aplicacion as string,
    proximaFecha: (row.proxima_fecha as string) ?? undefined,
    veterinario: (row.veterinario as string) ?? undefined,
    notas: (row.notas as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}

export async function fetchVaccines(petId: string): Promise<Vacuna[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vaccines")
    .select("*")
    .eq("pet_id", petId)
    .order("fecha_aplicacion", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function createVaccine(
  v: Omit<Vacuna, "id" | "petId" | "createdAt">,
  petId: string,
  userId: string
): Promise<Vacuna> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vaccines")
    .insert({
      pet_id: petId,
      user_id: userId,
      nombre: v.nombre,
      fecha_aplicacion: v.fecha,
      proxima_fecha: v.proximaFecha ?? null,
      veterinario: v.veterinario ?? null,
      notas: v.notas ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapRow(data as Record<string, unknown>);
}

export async function updateVaccine(id: string, v: Partial<Vacuna>): Promise<Vacuna> {
  const supabase = createClient();
  const patch: Record<string, unknown> = {};
  if (v.nombre !== undefined) patch.nombre = v.nombre;
  if (v.fecha !== undefined) patch.fecha_aplicacion = v.fecha;
  if (v.proximaFecha !== undefined) patch.proxima_fecha = v.proximaFecha;
  if (v.veterinario !== undefined) patch.veterinario = v.veterinario;
  if (v.notas !== undefined) patch.notas = v.notas;
  patch.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("vaccines")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapRow(data as Record<string, unknown>);
}

export async function deleteVaccine(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("vaccines").delete().eq("id", id);
  if (error) throw error;
}
