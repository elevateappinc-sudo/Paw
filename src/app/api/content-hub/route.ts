import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logUsage } from '@/lib/server/vet-chat-utils';
import { ContentHubRequest, CHAR_LIMITS } from '@/types/content-hub';

const DAILY_LIMIT = 30;
const MODEL_GROQ = 'llama-3.3-70b-versatile';
const MODEL_SONNET = 'claude-sonnet-4-5';
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

async function checkContentHubLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const supabase = await createClient();
  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  const { count } = await supabase
    .from('ai_usage_log')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('feature', 'content-hub')
    .gte('created_at', today.toISOString());
  const used = count ?? 0;
  const remaining = Math.max(0, DAILY_LIMIT - used);
  return { allowed: remaining > 0, remaining };
}

function buildPrompt(body: ContentHubRequest, petName: string, petSpecies: string, petBreed: string): string {
  const langLabel = body.language === 'es' ? 'español' : 'inglés';
  const occasion = body.celebrationReason ? ` (motivo: ${body.celebrationReason})` : '';

  switch (body.contentType) {
    case 'instagram_post':
      return `Genera un caption de Instagram de 100 a 200 caracteres para ${petName} (${petSpecies}, ${petBreed}). Tono: ${body.tone}${occasion}. Incluye una llamada a la acción al final. Luego en una nueva línea escribe exactamente "HASHTAGS:" seguido de 10 a 15 hashtags relevantes en ${langLabel}.`;
    case 'instagram_story':
      return `Genera un texto overlay para una Instagram Story de ${petName} (${petSpecies}). Tono: ${body.tone}${occasion}. IMPORTANTE: máximo 40 caracteres, pensado para superponer sobre una foto. Solo el texto, sin hashtags, sin explicaciones.`;
    case 'tiktok_caption':
      return `Genera un caption de TikTok de 50 a 100 caracteres para ${petName} (${petSpecies}, ${petBreed}). Tono: ${body.tone}${occasion}. Luego en una nueva línea escribe exactamente "HASHTAGS:" seguido de 5 a 8 hashtags en ${langLabel} con mix de nicho y trending de mascotas.`;
  }
}

function parseResponse(raw: string, contentType: string): { caption: string; hashtags: string[] } {
  if (contentType === 'instagram_story') return { caption: raw.trim().slice(0, 40), hashtags: [] };
  const parts = raw.split(/HASHTAGS:/i);
  const caption = parts[0].trim();
  const hashtags = parts[1]
    ? parts[1].trim().split(/\s+/).filter(h => h.startsWith('#')).map(h => h.trim())
    : [];
  return { caption, hashtags };
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const body: ContentHubRequest = await req.json();
    if (!body.petId || !body.contentType || !body.tone || !body.language) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    const { allowed, remaining } = await checkContentHubLimit(user.id);
    if (!allowed) return NextResponse.json({ error: 'Alcanzaste el límite de 30 generaciones diarias.' }, { status: 429 });

    const { data: pet } = await supabase.from('pets').select('name, species, breed').eq('id', body.petId).single();
    if (!pet) return NextResponse.json({ error: 'Mascota no encontrada' }, { status: 404 });

    const prompt = buildPrompt(body, pet.name, pet.species, pet.breed);
    const useSonnet = body.tone === 'emotivo' || body.tone === 'cumpleanos';
    let rawResponse = '';
    let modelUsed = '';
    let inputTokens = 0, outputTokens = 0;

    if (!useSonnet) {
      // Groq
      const res = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: MODEL_GROQ, messages: [{ role: 'user', content: prompt }], max_tokens: 300, temperature: 0.8 }),
      });
      const data = await res.json();
      rawResponse = data.choices?.[0]?.message?.content ?? '';
      modelUsed = MODEL_GROQ;
      inputTokens = data.usage?.prompt_tokens ?? 0;
      outputTokens = data.usage?.completion_tokens ?? 0;
    } else {
      // Sonnet directo para emotivo/cumpleanos
      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const response = await anthropic.messages.create({
        model: MODEL_SONNET, max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      });
      rawResponse = response.content[0].type === 'text' ? response.content[0].text : '';
      modelUsed = MODEL_SONNET;
      inputTokens = response.usage.input_tokens;
      outputTokens = response.usage.output_tokens;
    }

    const { caption, hashtags } = parseResponse(rawResponse, body.contentType);
    const maxChars = CHAR_LIMITS[body.contentType].max;

    // Guardar en content_generations
    const socialNetwork = body.contentType.startsWith('instagram') ? 'instagram' : 'tiktok';
    await supabase.from('content_generations').insert({
      user_id: user.id, pet_id: body.petId, content_type: body.contentType,
      tone: body.tone, social_network: socialNetwork, caption, hashtags,
      language: body.language, model_used: modelUsed,
    });

    // Log usage
    await logUsage({ userId: user.id, petId: body.petId, sessionId: crypto.randomUUID(), modelUsed, inputTokens, outputTokens, feature: 'content-hub' });

    return NextResponse.json({ caption, hashtags, modelUsed, charCount: caption.length, maxChars, dailyRemaining: remaining - 1 });
  } catch (err) {
    console.error('[content-hub] error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
