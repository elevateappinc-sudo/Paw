import { createClient } from '@/lib/supabase/server';
import { PetContext } from '@/types/vet-chat';
import { calculateCostUsd } from '@/types/ai-usage';
import { EMERGENCY_REGEX, VET_CHAT_CONFIG } from './vet-chat-constants';

export async function buildSystemPrompt(petId: string): Promise<{ systemPrompt: string; petContext: PetContext }> {
  const supabase = await createClient();

  const { data: pet, error } = await supabase
    .from('pets')
    .select('id, name, species, breed, birth_date, weight_kg')
    .eq('id', petId)
    .single();

  if (error || !pet) throw new Error('PET_NOT_FOUND');

  const ageYears = Math.floor((Date.now() - new Date(pet.birth_date).getTime()) / (1000 * 60 * 60 * 24 * 365));

  let medications: string[] = [];
  try {
    const { data: meds } = await supabase
      .from('medications')
      .select('name, dose_amount, dose_unit, frequency_value, frequency_unit')
      .eq('pet_id', petId)
      .eq('active', true);
    medications = (meds ?? []).map((m: { name: string; dose_amount: number; dose_unit: string; frequency_value: number; frequency_unit: string }) => `${m.name} ${m.dose_amount}${m.dose_unit} cada ${m.frequency_value} ${m.frequency_unit}`);
  } catch { /* graceful degradation */ }

  const petContext: PetContext = { petId: pet.id, name: pet.name, species: pet.species, breed: pet.breed, ageYears, weightKg: pet.weight_kg, medications };

  const base = `Eres un asistente veterinario de PAW. Responde siempre en español, de forma clara y empática.\n\nMASCOTA:\n- Nombre: ${pet.name}\n- Especie: ${pet.species}\n- Raza: ${pet.breed}\n- Edad: ${ageYears} años\n- Peso: ${pet.weight_kg} kg`;
  const meds = medications.length > 0 ? `\n\nMEDICAMENTOS ACTIVOS:\n${medications.slice(0, 10).join('\n')}` : '';
  const instructions = `\n\nINSTRUCCIONES:\n1. Refiere siempre al veterinario para diagnósticos definitivos.\n2. Si detectas emergencia, inicia tu respuesta con [EMERGENCIA].\n3. Máximo 300 palabras por respuesta.\n4. No inventes datos del historial clínico.`;

  const systemPrompt = (base + meds + instructions).slice(0, VET_CHAT_CONFIG.MAX_SYSTEM_PROMPT_CHARS);
  return { systemPrompt, petContext };
}

export async function checkDailyMessageLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const supabase = await createClient();
  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  const { count } = await supabase
    .from('ai_usage_log')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('feature', 'vet-chat')
    .gte('created_at', today.toISOString());
  const used = count ?? 0;
  const remaining = Math.max(0, VET_CHAT_CONFIG.MAX_MESSAGES_PER_DAY - used);
  return { allowed: remaining > 0, remaining };
}

export async function checkCircuitBreaker(): Promise<{ open: boolean; spentToday: number }> {
  const supabase = await createClient();
  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  const { data } = await supabase
    .from('ai_usage_log')
    .select('cost_usd')
    .gte('created_at', today.toISOString());
  const spentToday = (data ?? []).reduce((sum: number, r: { cost_usd: number }) => sum + (r.cost_usd ?? 0), 0);
  return { open: spentToday >= VET_CHAT_CONFIG.CIRCUIT_BREAKER_USD, spentToday };
}

export async function logUsage(params: {
  userId: string; petId?: string; sessionId: string;
  modelUsed: string; inputTokens: number; outputTokens: number; feature: 'vet-chat' | 'content-hub';
}): Promise<void> {
  const supabase = await createClient();
  const costUsd = calculateCostUsd(params.modelUsed, params.inputTokens, params.outputTokens);
  await supabase.from('ai_usage_log').insert({
    user_id: params.userId, pet_id: params.petId ?? null, session_id: params.sessionId,
    model_used: params.modelUsed, input_tokens: params.inputTokens, output_tokens: params.outputTokens,
    cost_usd: costUsd, feature: params.feature,
  });
}

export function detectEmergencySymptoms(text: string): string[] {
  const matches: string[] = [];
  let match;
  const regex = new RegExp(EMERGENCY_REGEX.source, 'gi');
  while ((match = regex.exec(text)) !== null) {
    if (!matches.includes(match[0].toLowerCase())) matches.push(match[0].toLowerCase());
  }
  return matches;
}
