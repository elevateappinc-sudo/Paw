'use client';
import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useVetChat } from '@/hooks/useVetChat';

// NOTE: Importar constantes del archivo de constantes en cliente puede causar bundle issues.
// Duplicar los textos aquí como fallback si hay problema de import.
const DISCLAIMER = '⚠️ Este chat ofrece orientación general, NO es diagnóstico médico. Ante cualquier emergencia, ve al veterinario de inmediato.';
const EMERGENCY_BANNER = '🚨 POSIBLE EMERGENCIA — Lleva a tu mascota al veterinario INMEDIATAMENTE. No esperes.';

interface VetChatUIProps {
  petId: string;
  petName: string;
}

export function VetChatUI({ petId, petName }: VetChatUIProps) {
  const { messages, isLoading, isEmergency, dailyRemaining, error, sendMessage, dismissError, dismissEmergency } = useVetChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || dailyRemaining === 0) return;
    const text = input; setInput('');
    if (textareaRef.current) { textareaRef.current.style.height = 'auto'; }
    await sendMessage(text, petId);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[80vh] bg-[#0a0a0a] rounded-xl overflow-hidden">
      {/* Disclaimer fijo */}
      <div className="px-4 py-2 bg-amber-950 border-b border-amber-900 text-amber-200 text-xs leading-relaxed shrink-0">
        {DISCLAIMER}
      </div>

      {/* Banner emergencia */}
      {isEmergency && (
        <div className="px-4 py-3 bg-red-900 border-b border-red-700 text-white shrink-0">
          <p className="font-bold text-sm">{EMERGENCY_BANNER}</p>
          <button onClick={dismissEmergency} className="mt-1 text-xs underline opacity-80 hover:opacity-100">
            Entendido
          </button>
        </div>
      )}

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-gray-500 text-sm mt-8">
            Hola 🐾 Pregúntame algo sobre {petName}
          </p>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-[#FF7A45] text-black'
                : msg.isEmergency
                ? 'bg-red-900 text-white'
                : 'bg-[#1F1F1F] text-white'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#1F1F1F] rounded-2xl px-4 py-3 flex gap-1">
              {[0,1,2].map(i => (
                <span key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 px-3 py-2 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-xs flex justify-between items-center">
          <span>{error.message}</span>
          <button onClick={dismissError} className="ml-2 text-red-400 hover:text-red-200">✕</button>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-[#1F1F1F] bg-[#0a0a0a] shrink-0">
        <p className="text-xs text-gray-600 mb-2">{dailyRemaining} consultas restantes hoy</p>
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            disabled={isLoading || dailyRemaining === 0}
            placeholder={dailyRemaining === 0 ? 'Límite diario alcanzado' : `Pregunta sobre ${petName}...`}
            rows={1}
            className="flex-1 bg-[#111111] border border-[#1F1F1F] rounded-xl px-4 py-2 text-white text-sm resize-none focus:outline-none focus:border-[#FF7A45] disabled:opacity-40 placeholder-gray-600 max-h-32 overflow-y-auto"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim() || dailyRemaining === 0}
            className="bg-[#FF7A45] text-black font-medium px-4 py-2 rounded-xl text-sm disabled:opacity-40 hover:bg-[#e86a35] transition-colors shrink-0"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
