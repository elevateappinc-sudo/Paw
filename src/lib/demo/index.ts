/**
 * Modo demo: la app funciona con datos e imágenes de ejemplo en memoria,
 * sin Supabase. Se activa con la cookie `paw_demo=1` (ruta /demo) o con
 * NEXT_PUBLIC_PAW_DEMO=1.
 */
export const DEMO_COOKIE = "paw_demo";
export const DEMO_USER_ID = "demo-user-andrea";

export function isDemoEnv(): boolean {
  return process.env.NEXT_PUBLIC_PAW_DEMO === "1";
}

export function isDemoClient(): boolean {
  if (isDemoEnv()) return true;
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((c) => c.trim() === `${DEMO_COOKIE}=1`);
}

export function enableDemoCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${DEMO_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
}

export function disableDemoCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${DEMO_COOKIE}=; path=/; max-age=0; samesite=lax`;
  try {
    localStorage.removeItem("paw.demo.db");
  } catch {
    /* ignore */
  }
}
