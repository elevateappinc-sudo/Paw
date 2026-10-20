import { type LucideIcon } from "lucide-react";
import { PetBath, PetDental, PetEar, PetGrooming, PetNails } from "@/components/icons/pet";
import type { CareCycle, CareCycleKind } from "@/types/db";
import { daysUntil } from "@/lib/api/careCycles";
import { SEVERITY, severityFromDays, type Severity } from "@/components/ui/Chip";

export const HYGIENE_ICON: Partial<Record<CareCycleKind, LucideIcon>> = {
  bath: PetBath,
  grooming: PetGrooming,
  nails: PetNails,
  ears: PetEar,
  dental: PetDental,
};

export type UrgencyTone = "overdue" | "warn" | "ok";

/**
 * Estado del ciclo con la escala de severidad: vencido (overdue), vence en
 * 7 días o menos (warning) y al día (success).
 */
export function hygieneStatus(c: Pick<CareCycle, "next_due_at" | "interval_days">): { label: string; severity: Severity; tone: UrgencyTone; textClass: string; days: number } {
  const d = daysUntil(c.next_due_at);
  const severity = severityFromDays(d);
  const textClass = SEVERITY[severity].text;
  if (d < 0) return { label: "Vencido", severity, tone: "overdue", textClass, days: d };
  if (d === 0) return { label: "Hoy", severity, tone: "warn", textClass, days: d };
  if (d <= 7) return { label: `${d} ${d === 1 ? "día" : "días"}`, severity, tone: "warn", textClass, days: d };
  return { label: `${d} días`, severity, tone: "ok", textClass, days: d };
}
