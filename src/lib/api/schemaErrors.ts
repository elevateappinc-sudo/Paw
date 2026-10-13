/**
 * Detecta errores de Supabase/PostgREST que indican que una tabla, columna o
 * función aún no existe en el proyecto remoto (migraciones sin aplicar).
 * Las pantallas deben degradar a estado vacío + un único toast.
 */
const MISSING_CODES = new Set(["42P01", "42883", "42703", "PGRST202", "PGRST204", "PGRST205"]);

export function isMissingSchema(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const err = e as { code?: string; message?: string };
  if (err.code && MISSING_CODES.has(err.code)) return true;
  const msg = (err.message ?? "").toLowerCase();
  return msg.includes("does not exist") || msg.includes("could not find") || msg.includes("schema cache");
}

export function errorMessage(e: unknown, fallback = "Algo salió mal"): string {
  if (e instanceof Error && e.message) return e.message;
  if (e && typeof e === "object" && "message" in e && typeof (e as { message: unknown }).message === "string") {
    return (e as { message: string }).message;
  }
  return fallback;
}
