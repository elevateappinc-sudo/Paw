import { createClient } from "@/lib/supabase/client";
import type { ClaseEntrenamiento, TareaEntrenamiento, TaskStatus } from "@/types";

function mapTask(row: Record<string, unknown>): TareaEntrenamiento {
  return {
    id: row.id as string,
    descripcion: row.descripcion as string,
    estado: row.estado as TaskStatus,
  };
}

function mapRow(
  row: Record<string, unknown>,
  tasks: TareaEntrenamiento[] = []
): ClaseEntrenamiento {
  return {
    id: row.id as string,
    petId: row.pet_id as string,
    fecha: row.fecha as string,
    entrenador: (row.entrenador as string) ?? undefined,
    temas: (row.temas as string) ?? "",
    ejercicios: (row.ejercicios as string) ?? "",
    avances: (row.avances as string) ?? "",
    tareas: tasks,
    createdAt: row.created_at as string,
  };
}

export async function fetchTraining(petId: string): Promise<ClaseEntrenamiento[]> {
  const supabase = createClient();
  const { data: sessions, error } = await supabase
    .from("training_sessions")
    .select("*, training_tasks(*)")
    .eq("pet_id", petId)
    .order("fecha", { ascending: false });
  if (error) throw error;

  return (sessions ?? []).map((s) => {
    const tasks = ((s.training_tasks as Record<string, unknown>[]) ?? []).map(mapTask);
    return mapRow(s as Record<string, unknown>, tasks);
  });
}

export async function createTrainingSession(
  c: Omit<ClaseEntrenamiento, "id" | "petId" | "createdAt">,
  petId: string,
  userId: string
): Promise<ClaseEntrenamiento> {
  const supabase = createClient();

  const { data: session, error } = await supabase
    .from("training_sessions")
    .insert({
      pet_id: petId,
      user_id: userId,
      tipo_ejercicio: "fisico",
      modalidad: "clase",
      fecha: c.fecha,
      entrenador: c.entrenador ?? null,
      temas: c.temas,
      ejercicios: c.ejercicios,
      avances: c.avances,
      notas: null,
    })
    .select()
    .single();
  if (error) throw error;

  const sessionId = (session as Record<string, unknown>).id as string;
  let tasks: TareaEntrenamiento[] = [];

  if (c.tareas && c.tareas.length > 0) {
    const { data: insertedTasks, error: taskError } = await supabase
      .from("training_tasks")
      .insert(
        c.tareas.map((t) => ({
          session_id: sessionId,
          descripcion: t.descripcion,
          estado: t.estado,
        }))
      )
      .select();
    if (taskError) throw taskError;
    tasks = ((insertedTasks ?? []) as Record<string, unknown>[]).map(mapTask);
  }

  return mapRow(session as Record<string, unknown>, tasks);
}

export async function updateTrainingSession(
  id: string,
  c: Partial<ClaseEntrenamiento>
): Promise<ClaseEntrenamiento> {
  const supabase = createClient();
  const patch: Record<string, unknown> = {};
  if (c.fecha !== undefined) patch.fecha = c.fecha;
  if (c.entrenador !== undefined) patch.entrenador = c.entrenador;
  if (c.temas !== undefined) patch.temas = c.temas;
  if (c.ejercicios !== undefined) patch.ejercicios = c.ejercicios;
  if (c.avances !== undefined) patch.avances = c.avances;
  patch.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("training_sessions")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;

  // Fetch tasks
  const { data: tasksData } = await supabase
    .from("training_tasks")
    .select("*")
    .eq("session_id", id);
  const tasks = ((tasksData ?? []) as Record<string, unknown>[]).map(mapTask);

  return mapRow(data as Record<string, unknown>, tasks);
}

export async function deleteTrainingSession(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("training_sessions").delete().eq("id", id);
  if (error) throw error;
}

export async function updateTrainingTask(
  taskId: string,
  estado: TaskStatus
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("training_tasks")
    .update({ estado })
    .eq("id", taskId);
  if (error) throw error;
}
