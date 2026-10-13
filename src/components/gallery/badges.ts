import { Cake, Pill, Stethoscope, Syringe, type LucideIcon } from "lucide-react";

/** Tipo de contexto de una foto (vacuna, visita, medicamento, cumpleaños). */
export type BadgeKind = "vacuna" | "vet" | "medicamento" | "cumple";

export interface ContextualBadge {
  kind: BadgeKind;
  label: string;
}

export const BADGE_ICON: Record<BadgeKind, LucideIcon> = {
  vacuna: Syringe,
  vet: Stethoscope,
  medicamento: Pill,
  cumple: Cake,
};

export const BADGE_LABEL: Record<BadgeKind, string> = {
  vacuna: "Vacuna",
  vet: "Visita veterinaria",
  medicamento: "Medicamento",
  cumple: "Cumpleaños",
};
