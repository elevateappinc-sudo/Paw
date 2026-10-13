import { showToast } from "@/components/ui/Toast";
import type { CareCycleKind } from "@/types/db";
import type { ChipTone } from "@/components/ui/Chip";

/** Fecha local YYYY-MM-DD */
export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(dateStr: string, days: number): string {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** "7 oct" */
export function shortDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return parseDate(dateStr).toLocaleDateString("es-CO", { day: "numeric", month: "short" }).replace(".", "");
}

/** "7 de octubre de 2026" */
export function longDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return parseDate(dateStr).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
}

/** "Octubre 2026" (el año solo si no es el actual) */
export function monthLabel(dateStr: string): string {
  const d = parseDate(dateStr);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  const label = d.toLocaleDateString("es-CO", sameYear ? { month: "long" } : { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

/** Día de la semana en minúsculas: "sábado" */
export function weekdayLabel(dateStr: string): string {
  return parseDate(dateStr).toLocaleDateString("es-CO", { weekday: "long" });
}

/** Une nombres con comas y "y" */
export function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`;
}

/** Tono visual por tipo de ciclo */
export function kindTone(kind: CareCycleKind): ChipTone {
  switch (kind) {
    case "vaccine":
      return "info";
    case "deworm_internal":
    case "deworm_external":
      return "neutral";
    case "checkup":
      return "primary";
    case "weight":
      return "ok";
    default:
      return "neutral";
  }
}

/** Detecta error de tabla/función inexistente en el remoto (migración sin aplicar) */
export function isMissingRelation(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; message?: string };
  if (e.code === "42P01" || e.code === "42883" || e.code === "PGRST205" || e.code === "PGRST202") return true;
  const msg = (e.message ?? "").toLowerCase();
  return msg.includes("does not exist") || msg.includes("schema cache") || msg.includes("could not find the table") || msg.includes("could not find the function");
}

const shownOnce = new Set<string>();

/** Muestra un aviso una sola vez por sesión */
export function toastOnce(key: string, message: string, tone: "default" | "error" = "default"): void {
  if (shownOnce.has(key)) return;
  shownOnce.add(key);
  showToast(message, undefined, tone);
}

export function errorMessage(err: unknown, fallback = "Algo salió mal. Intenta de nuevo."): string {
  if (err && typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string") {
    return (err as { message: string }).message;
  }
  return fallback;
}
