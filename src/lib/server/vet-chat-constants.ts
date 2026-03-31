// SERVER-ONLY — No importar en componentes cliente

export const EMERGENCY_SYMPTOMS: readonly string[] = [
  'dificultad para respirar',
  'pérdida de conciencia',
  'convulsiones',
  'sangrado abundante',
  'vómito con sangre',
  'diarrea con sangre',
  'abdomen hinchado o distendido',
  'imposibilidad de orinar en 12 horas',
  'esfuerzo para orinar sin resultado en gatos machos',
  'trauma severo atropello caída golpe',
  'ingestión de tóxico veneno planta medicamento humano',
  'cuerpo extraño con obstrucción',
  'temperatura mayor 40 grados golpe de calor',
  'hipotermia severa',
  'parálisis imposibilidad mover extremidades',
  'ojos rojos con secreción abundante',
  'encías pálidas blancas azuladas grises',
  'lengua azulada o morada cianosis',
  'dolor extremo llanto continuo',
  'herida profunda hueso expuesto',
  'picadura de serpiente',
  'reacción alérgica severa hinchazón facial',
  'no come ni bebe 24 horas con síntomas',
  'cachorro o gatito menor de 8 semanas con síntomas',
  'animal mayor o enfermo con deterioro brusco',
  'parto con más de 2 horas sin progreso',
  'prolapso tejido saliendo',
  'mordedura con herida penetrante',
  'quemaduras en piel o mucosas',
  'cabeza inclinada círculos ataxia repentina',
  'atragantamiento en curso',
  'amarillamiento piel ojos ictericia',
] as const;

export const EMERGENCY_REGEX = new RegExp(
  EMERGENCY_SYMPTOMS.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
  'gi'
);

export const VET_CHAT_CONFIG = {
  MAX_MESSAGES_PER_DAY: 20,
  MAX_CONTEXT_MESSAGES: 10,
  MAX_SYSTEM_PROMPT_CHARS: 6000,
  GROQ_TIMEOUT_MS: 4000,
  CIRCUIT_BREAKER_USD: 2.00,
  MODEL_PRIMARY: 'llama-3.3-70b-versatile',
  MODEL_FALLBACK: 'claude-3-5-haiku-20241022',
  GROQ_BASE_URL: 'https://api.groq.com/openai/v1',
} as const;

export const DISCLAIMER_TEXT = '⚠️ Este chat ofrece orientación general, NO es diagnóstico médico. Ante cualquier emergencia, ve al veterinario de inmediato.';

export const EMERGENCY_BANNER_TEXT = '🚨 POSIBLE EMERGENCIA — Lleva a tu mascota al veterinario INMEDIATAMENTE. No esperes.';
