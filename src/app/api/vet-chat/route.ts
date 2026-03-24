import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildSystemPrompt, checkDailyMessageLimit, checkCircuitBreaker, logUsage, detectEmergencySymptoms } from '@/lib/server/vet-chat-utils';
import { VET_CHAT_CONFIG } from '@/lib/server/vet-chat-constants';
import { VetChatRequest, VetChatResponse } from '@/types/vet-chat';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ code: 'UNKNOWN', message: 'No autenticado' }, { status: 401 });

    const body: VetChatRequest = await req.json();
    if (!body.message || !body.petId || !body.sessionId) {
      return NextResponse.json({ code: 'UNKNOWN', message: 'Datos incompletos' }, { status: 400 });
    }

    const { allowed, remaining } = await checkDailyMessageLimit(user.id);
    if (!allowed) return NextResponse.json({ code: 'RATE_LIMIT_EXCEEDED', message: 'Alcanzaste el límite de 20 consultas diarias. Vuelve mañana 🌙' }, { status: 429 });

    const { open } = await checkCircuitBreaker();
    if (open) return NextResponse.json({ code: 'CIRCUIT_BREAKER_OPEN', message: 'El chat está temporalmente suspendido. Inténtalo más tarde.' }, { status: 503 });

    let systemPrompt: string;
    try {
      const result = await buildSystemPrompt(body.petId);
      systemPrompt = result.systemPrompt;
    } catch {
      return NextResponse.json({ code: 'PET_NOT_FOUND', message: 'Mascota no encontrada' }, { status: 404 });
    }

    const history = (body.history ?? []).slice(-VET_CHAT_CONFIG.MAX_CONTEXT_MESSAGES);
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: body.message },
    ];

    let reply = '';
    let modelUsed = VET_CHAT_CONFIG.MODEL_PRIMARY;
    let inputTokens = 0, outputTokens = 0;

    // Try Groq first
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), VET_CHAT_CONFIG.GROQ_TIMEOUT_MS);
      const groqRes = await fetch(`${VET_CHAT_CONFIG.GROQ_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: VET_CHAT_CONFIG.MODEL_PRIMARY, messages, max_tokens: 500, temperature: 0.7 }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (groqRes.ok) {
        const data = await groqRes.json();
        reply = data.choices[0]?.message?.content ?? '';
        inputTokens = data.usage?.prompt_tokens ?? 0;
        outputTokens = data.usage?.completion_tokens ?? 0;
        modelUsed = VET_CHAT_CONFIG.MODEL_PRIMARY;
      } else throw new Error('Groq error');
    } catch {
      // Fallback to Claude Haiku
      modelUsed = VET_CHAT_CONFIG.MODEL_FALLBACK;
      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const response = await anthropic.messages.create({
        model: VET_CHAT_CONFIG.MODEL_FALLBACK,
        max_tokens: 500,
        system: systemPrompt,
        messages: [...history, { role: 'user', content: body.message }],
      });
      reply = response.content[0].type === 'text' ? response.content[0].text : '';
      inputTokens = response.usage.input_tokens;
      outputTokens = response.usage.output_tokens;
    }

    // Detect emergency
    const emergencySymptoms = detectEmergencySymptoms(reply + ' ' + body.message);
    const isEmergency = emergencySymptoms.length > 0 || reply.includes('[EMERGENCIA]');
    reply = reply.replace('[EMERGENCIA]', '').trim();

    // Log usage
    await logUsage({ userId: user.id, petId: body.petId, sessionId: body.sessionId, modelUsed, inputTokens, outputTokens, feature: 'vet-chat' });

    const response: VetChatResponse = {
      reply, isEmergency,
      emergencySymptoms: isEmergency ? emergencySymptoms : undefined,
      tokensUsed: { input: inputTokens, output: outputTokens },
      modelUsed,
      dailyMessagesRemaining: remaining - 1,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error('[vet-chat] error:', err);
    return NextResponse.json({ code: 'AI_ERROR', message: 'Algo salió mal. Intenta de nuevo.' }, { status: 500 });
  }
}
