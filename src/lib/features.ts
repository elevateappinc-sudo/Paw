/**
 * Funciones apagadas para el lanzamiento. Con `false` no se muestran en la
 * app y sus rutas responden 404. Para retomarlas: docs/pendientes.md.
 */
export const FEATURES = {
  /** Integración con Google Calendar: solo conecta la cuenta; falta la sincronización */
  googleCalendar: false,
  /** Asistente con Claude (/asistente, /api/assistant): requiere ANTHROPIC_API_KEY */
  assistant: false,
} as const;
