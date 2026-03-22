import { createClient } from "@/lib/supabase/client";
import type { Notificacion } from "@/types";

function mapRow(row: Record<string, unknown>): Notificacion {
  return {
    id: row.id as string,
    petId: (row.pet_id as string) ?? "",
    autorId: row.user_id as string,
    tipo: row.tipo as "nota" | "alerta" | "logro",
    titulo: row.titulo as string,
    mensaje: (row.mensaje as string) ?? undefined,
    leida: row.leida as boolean,
    createdAt: row.created_at as string,
  };
}

export async function fetchNotifications(userId: string): Promise<Notificacion[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function createNotification(
  n: Omit<Notificacion, "id" | "petId" | "autorId" | "leida" | "createdAt">,
  petId: string,
  userId: string
): Promise<Notificacion> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      pet_id: petId || null,
      tipo: n.tipo,
      titulo: n.titulo,
      mensaje: n.mensaje ?? null,
      leida: false,
    })
    .select()
    .single();
  if (error) throw error;
  return mapRow(data as Record<string, unknown>);
}

export async function markNotificationRead(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ leida: true })
    .eq("id", id);
  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ leida: true })
    .eq("user_id", userId)
    .eq("leida", false);
  if (error) throw error;
}

export async function deleteNotification(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("notifications").delete().eq("id", id);
  if (error) throw error;
}
