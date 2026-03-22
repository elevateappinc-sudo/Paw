import { createClient } from "@/lib/supabase/client";
import type { ItinerarioItem, RegistroItinerario } from "@/types";

function mapItem(row: Record<string, unknown>): ItinerarioItem {
  return {
    id: row.id as string,
    petId: row.pet_id as string,
    tipo: row.tipo as "comida" | "salida",
    nombre: row.nombre as string,
    hora: row.hora as string,
    dias: row.dias as number[],
    cantidad: (row.cantidad as string) ?? undefined,
    notas: (row.notas as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}

function mapRecord(row: Record<string, unknown>): RegistroItinerario {
  return {
    id: row.id as string,
    petId: row.pet_id as string,
    itemId: row.item_id as string,
    fecha: row.fecha as string,
    completado: row.completado as boolean,
    completadoPor: (row.completado_por as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}

export async function fetchItinerary(petId: string): Promise<ItinerarioItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("itinerary")
    .select("*")
    .eq("pet_id", petId)
    .order("hora", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapItem);
}

export async function fetchItineraryRecords(
  petId: string,
  fechaFrom?: string
): Promise<RegistroItinerario[]> {
  const supabase = createClient();
  let query = supabase
    .from("itinerary_records")
    .select("*")
    .eq("pet_id", petId);
  if (fechaFrom) query = query.gte("fecha", fechaFrom);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapRecord);
}

export async function createItineraryItem(
  i: Omit<ItinerarioItem, "id" | "petId" | "createdAt">,
  petId: string,
  userId: string
): Promise<ItinerarioItem> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("itinerary")
    .insert({
      pet_id: petId,
      user_id: userId,
      tipo: i.tipo,
      nombre: i.nombre,
      hora: i.hora,
      dias: i.dias,
      cantidad: i.cantidad ?? null,
      notas: i.notas ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapItem(data as Record<string, unknown>);
}

export async function updateItineraryItem(
  id: string,
  i: Partial<ItinerarioItem>
): Promise<ItinerarioItem> {
  const supabase = createClient();
  const patch: Record<string, unknown> = {};
  if (i.tipo !== undefined) patch.tipo = i.tipo;
  if (i.nombre !== undefined) patch.nombre = i.nombre;
  if (i.hora !== undefined) patch.hora = i.hora;
  if (i.dias !== undefined) patch.dias = i.dias;
  if (i.cantidad !== undefined) patch.cantidad = i.cantidad;
  if (i.notas !== undefined) patch.notas = i.notas;
  patch.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("itinerary")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapItem(data as Record<string, unknown>);
}

export async function deleteItineraryItem(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("itinerary").delete().eq("id", id);
  if (error) throw error;
}

export async function toggleItineraryRecord(
  itemId: string,
  petId: string,
  fecha: string,
  userId: string
): Promise<RegistroItinerario> {
  const supabase = createClient();

  // Check if record exists
  const { data: existing } = await supabase
    .from("itinerary_records")
    .select("*")
    .eq("item_id", itemId)
    .eq("fecha", fecha)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("itinerary_records")
      .update({ completado: !(existing as Record<string, unknown>).completado })
      .eq("id", (existing as Record<string, unknown>).id)
      .select()
      .single();
    if (error) throw error;
    return mapRecord(data as Record<string, unknown>);
  } else {
    const { data, error } = await supabase
      .from("itinerary_records")
      .insert({
        pet_id: petId,
        item_id: itemId,
        fecha,
        completado: true,
        completado_por: userId,
      })
      .select()
      .single();
    if (error) throw error;
    return mapRecord(data as Record<string, unknown>);
  }
}
