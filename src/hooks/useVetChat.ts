'use client';
import { useState, useCallback, useRef } from 'react';
import { ChatMessage, VetChatError, VetChatErrorCode } from '@/types/vet-chat';

const ERROR_MESSAGES: Record<VetChatErrorCode, string> = {
  RATE_LIMIT_EXCEEDED: 'Alcanzaste el límite de 20 consultas diarias. Vuelve mañana 🌙',
  CIRCUIT_BREAKER_OPEN: 'El chat está temporalmente suspendido. Inténtalo más tarde.',
  PET_NOT_FOUND: 'No encontramos el perfil de tu mascota. Recarga la página.',
  AI_ERROR: 'Algo salió mal. Intenta de nuevo en un momento.',
  UNKNOWN: 'Ocurrió un error inesperado.',
};

export function useVetChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const [emergencySymptoms, setEmergencySymptoms] = useState<string[]>([]);
  const [dailyRemaining, setDailyRemaining] = useState(20);
  const [error, setError] = useState<VetChatError | null>(null);
  const sessionId = useRef(crypto.randomUUID()).current;

  const sendMessage = useCallback(async (text: string, petId: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: text.trim(), timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    try {
      const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/vet-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), petId, sessionId, history }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError({ code: data.code ?? 'UNKNOWN', message: ERROR_MESSAGES[data.code as VetChatErrorCode] ?? data.message });
        setMessages(prev => prev.filter(m => m.id !== userMsg.id));
        return;
      }

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(), role: 'assistant',
        content: data.reply, timestamp: Date.now(),
        isEmergency: data.isEmergency,
      };
      setMessages(prev => [...prev, assistantMsg]);
      setDailyRemaining(data.dailyMessagesRemaining ?? 0);
      if (data.isEmergency) {
        setIsEmergency(true);
        setEmergencySymptoms(data.emergencySymptoms ?? []);
      }
    } catch {
      setError({ code: 'UNKNOWN', message: ERROR_MESSAGES.UNKNOWN });
      setMessages(prev => prev.filter(m => m.id !== userMsg.id));
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, sessionId]);

  const clearMessages = useCallback(() => { setMessages([]); setIsEmergency(false); setEmergencySymptoms([]); }, []);
  const dismissError = useCallback(() => setError(null), []);
  const dismissEmergency = useCallback(() => { setIsEmergency(false); setEmergencySymptoms([]); }, []);

  return { messages, isLoading, isEmergency, emergencySymptoms, dailyRemaining, error, sendMessage, clearMessages, dismissError, dismissEmergency };
}
