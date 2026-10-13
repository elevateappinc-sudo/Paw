import { Bath, Scissors, Hand, Ear, Sparkles, type LucideIcon } from "lucide-react";
import type { CareCycle, CareCycleKind } from "@/types/db";
import { daysUntil } from "@/lib/api/careCycles";

export const HYGIENE_ICON: Partial<Record<CareCycleKind, LucideIcon>> = {
  bath: Bath,
  grooming: Scissors,
  nails: Hand,
  ears: Ear,
  dental: Sparkles,
};

export type UrgencyTone = "danger" | "warn" | "primary" | "ok";

export function hygieneStatus(c: Pick<CareCycle, "next_due_at" | "interval_days">): { label: string; tone: UrgencyTone; textClass: string; days: number } {
  const d = daysUntil(c.next_due_at);
  if (d < 0) return { label: "Vencido", tone: "danger", textClass: "text-danger", days: d };
  if (d === 0) return { label: "Hoy", tone: "warn", textClass: "text-warn", days: d };
  if (d <= 3) return { label: `${d} ${d === 1 ? "día" : "días"}`, tone: "warn", textClass: "text-warn", days: d };
  if (d <= 14) return { label: `${d} días`, tone: "primary", textClass: "text-primary", days: d };
  return { label: `${d} días`, tone: "ok", textClass: "text-on-variant", days: d };
}
