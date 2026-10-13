import { createClient } from "@/lib/supabase/client";
import { updateCareCycle } from "@/lib/api/careCycles";
import type { AssistantAction, AssistantMessage } from "@/types/db";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions: AssistantAction[];
  created_at: string;
  /** acción ya aplicada (índice) */
  done?: number[];
}

export const SUGGESTIONS = ["¿Cuánto debe pesar?", "Vacunas para viajar", "¿Puedo darle…?"];

export function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Carga el historial persistido. Devuelve null si la tabla no existe. */
export async function loadMessages(userId: string, petId: string): Promise<ChatMessage[] | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("assistant_messages")
    .select("*")
    .eq("user_id", userId)
    .eq("pet_id", petId)
    .order("created_at", { ascending: true })
    .limit(60);
  if (error) throw error;
  return ((data ?? []) as AssistantMessage[]).map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    actions: Array.isArray(m.actions) ? m.actions : [],
    created_at: m.created_at,
  }));
}

export async function clearMessages(userId: string, petId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("assistant_messages").delete().eq("user_id", userId).eq("pet_id", petId);
  if (error) throw error;
}

export interface AssistantReply {
  content: string;
  actions: AssistantAction[];
  persisted: boolean;
}

export async function askAssistant(petId: string, message: string, history: ChatMessage[]): Promise<AssistantReply> {
  const res = await fetch("/api/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pet_id: petId, message, history: history.slice(-12).map((h) => ({ role: h.role, content: h.content })) }),
  });
  const json = (await res.json().catch(() => ({}))) as Partial<AssistantReply> & { error?: string };
  if (!res.ok) throw new Error(json.error ?? "El asistente no respondió");
  return { content: json.content ?? "", actions: Array.isArray(json.actions) ? json.actions : [], persisted: !!json.persisted };
}

/** Próximo martes (o el que indique la acción) en YYYY-MM-DD */
export function nextTuesday(from = new Date()): string {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const delta = (2 - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

export async function applyRemind(action: Extract<AssistantAction, { type: "remind" }> & { date?: string }): Promise<string> {
  const date = action.date ?? nextTuesday();
  await updateCareCycle(action.cycle_id, { next_due_at: date });
  return date;
}

export async function applyLog(petId: string, userId: string, action: Extract<AssistantAction, { type: "log" }>): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("clinical_records").insert({
    pet_id: petId,
    user_id: userId,
    created_by_role: "owner",
    visit_date: new Date().toISOString().slice(0, 10),
    visit_type: "otro",
    notes: action.note ?? action.label,
  });
  if (error) throw error;
}
