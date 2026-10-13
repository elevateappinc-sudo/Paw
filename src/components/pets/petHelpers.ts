import type { LucideIcon } from "lucide-react";
import { Bath, Bug, Ear, Pill, Scale, Scissors, ShoppingBag, Smile, Sparkles, Stethoscope, Syringe, Footprints } from "lucide-react";
import type { Pet } from "@/types";
import type { BusinessCategory, CareCycle, CareCycleKind, PetRow } from "@/types/db";
import { cycleUrgency, dueLabel, type CycleUrgency } from "@/lib/api/careCycles";
import { SEX_LABEL, SPECIES_LABEL, ageLabel } from "@/lib/api/pets";
import type { ChipTone } from "@/components/ui/Chip";

/** Icono lucide por tipo de ciclo */
export const CARE_KIND_ICON: Record<CareCycleKind, LucideIcon> = {
  vaccine: Syringe,
  deworm_internal: Pill,
  deworm_external: Bug,
  bath: Bath,
  grooming: Scissors,
  nails: Footprints,
  ears: Ear,
  dental: Smile,
  food_restock: ShoppingBag,
  checkup: Stethoscope,
  weight: Scale,
  other: Sparkles,
};

/** Categoría de Explorar donde se puede reservar cada tipo de ciclo (si aplica) */
export const CARE_KIND_BOOKING: Partial<Record<CareCycleKind, BusinessCategory>> = {
  vaccine: "veterinaria",
  bath: "peluqueria",
  grooming: "peluqueria",
  nails: "peluqueria",
};

/** Convierte una fila de BD al modelo `Pet` del store (para avatares y anillos) */
export function rowToPet(row: PetRow): Pet {
  return {
    id: row.id,
    ownerId: row.user_id,
    sharedWith: [],
    name: row.name,
    species: row.species,
    breed: row.breed ?? undefined,
    birthDate: row.birth_date ?? undefined,
    weight: row.weight ?? undefined,
    emoji: row.emoji ?? "",
    color: row.color ?? "",
    photos: [],
    avatar_config: (row.avatar_config as Pet["avatar_config"]) ?? null,
    createdAt: row.created_at,
  };
}

/** "Perro · Labrador · 3 años" */
export function petMetaLine(p: { species: PetRow["species"]; breed?: string | null; birth_date?: string | null }): string {
  return [SPECIES_LABEL[p.species], p.breed || null, p.birth_date ? ageLabel(p.birth_date) : null].filter(Boolean).join(" · ");
}

/** "Labrador · Macho · 3 años · 24 kg" */
export function petProfileMeta(p: PetRow): string {
  return [
    p.breed || SPECIES_LABEL[p.species],
    p.sex !== "unknown" ? SEX_LABEL[p.sex] : null,
    p.birth_date ? ageLabel(p.birth_date) : null,
    p.weight ? `${p.weight.toLocaleString("es-CO", { maximumFractionDigits: 1 })} kg` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export interface StatusChip {
  label: string;
  tone: ChipTone;
}

type Status = { urgency: CycleUrgency; cycle: CareCycle } | null;

function worstOf(cycles: CareCycle[], kinds: CareCycleKind[]): Status {
  const order: CycleUrgency[] = ["overdue", "soon", "upcoming", "ok"];
  let worst: Status = null;
  for (const c of cycles) {
    if (!kinds.includes(c.kind)) continue;
    const u = cycleUrgency(c);
    if (!worst || order.indexOf(u) < order.indexOf(worst.urgency)) worst = { urgency: u, cycle: c };
  }
  return worst;
}

function chipFor(status: Status, labels: { ok: string; soon: string; overdue: string }): StatusChip | null {
  if (!status) return null;
  switch (status.urgency) {
    case "overdue":
      return { label: labels.overdue, tone: "danger" };
    case "soon":
    case "upcoming":
      return { label: labels.soon, tone: "warn" };
    default:
      return { label: labels.ok, tone: "ok" };
  }
}

/** Chips de estado para listas y cabeceras: vacunas, antipulgas, desparasitación */
export function petStatusChips(cycles: CareCycle[]): StatusChip[] {
  const chips = [
    chipFor(worstOf(cycles, ["vaccine"]), { ok: "Vacunas al día", soon: "Vacuna vence pronto", overdue: "Vacuna vencida" }),
    chipFor(worstOf(cycles, ["deworm_external"]), { ok: "Antipulgas al día", soon: "Antipulgas vence pronto", overdue: "Antipulgas vencido" }),
    chipFor(worstOf(cycles, ["deworm_internal"]), { ok: "Desparasitación al día", soon: "Desparasitación pronto", overdue: "Desparasitación vencida" }),
  ].filter((c): c is StatusChip => c !== null);
  if (chips.length === 0) return [{ label: "Sin plan de cuidados", tone: "neutral" }];
  return chips;
}

/** Celda de estado (punto + etiqueta corta) para el resumen del perfil */
export function statusCell(cycles: CareCycle[], kinds: CareCycleKind[]): { label: string; tone: "ok" | "warn" | "danger" | "neutral"; detail: string } {
  const s = worstOf(cycles, kinds);
  if (!s) return { label: "Sin datos", tone: "neutral", detail: "Añade un ciclo" };
  if (!cycles.some((c) => kinds.includes(c.kind) && c.last_done_at)) return { label: "Sin registro", tone: "neutral", detail: "Registra la última fecha" };
  const detail = dueLabel(s.cycle.next_due_at);
  if (s.urgency === "overdue") return { label: "Vencida", tone: "danger", detail };
  if (s.urgency === "soon" || s.urgency === "upcoming") return { label: "Pronto", tone: "warn", detail };
  return { label: "Al día", tone: "ok", detail };
}

export const URGENCY_TAG: Record<CycleUrgency, { label: string; tone: ChipTone }> = {
  overdue: { label: "Vencida", tone: "danger" },
  soon: { label: "Esta semana", tone: "warn" },
  upcoming: { label: "Próxima", tone: "warn" },
  ok: { label: "Al día", tone: "ok" },
};

/** Primer error "tabla/función no existe" (migraciones sin aplicar): el código debe degradar sin romper */
export function isMissingRelation(err: unknown): boolean {
  const code = (err as { code?: string } | null)?.code;
  return code === "42P01" || code === "42883" || code === "PGRST202" || code === "PGRST205";
}
