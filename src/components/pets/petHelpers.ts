import type { LucideIcon } from "lucide-react";
import { PawPrint } from "lucide-react";
import { PetBath, PetDental, PetDeworm, PetEar, PetFlea, PetGrooming, PetHealth, PetNails, PetShop, PetVaccine, PetWeight } from "@/components/icons/pet";
import type { Pet } from "@/types";
import type { BusinessCategory, CareCycle, CareCycleKind, PetRow } from "@/types/db";
import { daysUntil, dueLabel } from "@/lib/api/careCycles";
import { SEX_LABEL, SPECIES_LABEL } from "@/lib/api/pets";
import { formatPetAge } from "@/lib/age";
import { severityFromDays, type Severity } from "@/components/ui/Chip";

/** Icono lucide por tipo de ciclo */
export const CARE_KIND_ICON: Record<CareCycleKind, LucideIcon> = {
  vaccine: PetVaccine,
  deworm_internal: PetDeworm,
  deworm_external: PetFlea,
  bath: PetBath,
  grooming: PetGrooming,
  nails: PetNails,
  ears: PetEar,
  dental: PetDental,
  food_restock: PetShop,
  checkup: PetHealth,
  weight: PetWeight,
  other: PawPrint,
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
    photoUrl: row.photo_url ?? null,
    avatar_config: (row.avatar_config as Pet["avatar_config"]) ?? null,
    createdAt: row.created_at,
  };
}

/** "Perro · Labrador · 1 año y 8 meses" */
export function petMetaLine(p: { species: PetRow["species"]; breed?: string | null; birth_date?: string | null }): string {
  return [SPECIES_LABEL[p.species], p.breed || null, formatPetAge(p.birth_date)].filter(Boolean).join(" · ");
}

/** "Labrador · Macho · 3 años · 24 kg" */
export function petProfileMeta(p: PetRow): string {
  return [
    p.breed || SPECIES_LABEL[p.species],
    p.sex !== "unknown" ? SEX_LABEL[p.sex] : null,
    formatPetAge(p.birth_date),
    p.weight ? `${p.weight.toLocaleString("es-CO", { maximumFractionDigits: 1 })} kg` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** Severidad de un ciclo según la escala del design system (vencido / ≤ 7 días / al día) */
export function cycleSeverity(c: Pick<CareCycle, "next_due_at">): Severity {
  return severityFromDays(daysUntil(c.next_due_at));
}

export interface StatusChip {
  label: string;
  severity: Severity;
}

type Status = { severity: Severity; cycle: CareCycle } | null;

const SEVERITY_ORDER: Severity[] = ["overdue", "soon", "ok", "info"];

function worstOf(cycles: CareCycle[], kinds: CareCycleKind[]): Status {
  let worst: Status = null;
  for (const c of cycles) {
    if (!kinds.includes(c.kind)) continue;
    const s = cycleSeverity(c);
    if (!worst || SEVERITY_ORDER.indexOf(s) < SEVERITY_ORDER.indexOf(worst.severity)) worst = { severity: s, cycle: c };
  }
  return worst;
}

const CHIP_GROUPS: { kinds: CareCycleKind[]; ok: string; soon: string; overdue: string }[] = [
  { kinds: ["vaccine"], ok: "Vacunas al día", soon: "Vacuna vence pronto", overdue: "Vacuna vencida" },
  { kinds: ["deworm_external"], ok: "Antipulgas al día", soon: "Antipulgas vence pronto", overdue: "Antipulgas vencido" },
  { kinds: ["deworm_internal"], ok: "Desparasitación al día", soon: "Desparasitación pronto", overdue: "Desparasitación vencida" },
];

/**
 * Chips de estado para tarjetas y cabeceras (vacunas, antipulgas, desparasitación).
 * Lo urgente primero (vencido, luego vence pronto) y los "al día" en un solo chip.
 */
export function petStatusChips(cycles: CareCycle[]): StatusChip[] {
  const overdue: StatusChip[] = [];
  const soon: StatusChip[] = [];
  const ok: string[] = [];
  for (const g of CHIP_GROUPS) {
    const w = worstOf(cycles, g.kinds);
    if (!w) continue;
    if (w.severity === "overdue") overdue.push({ label: g.overdue, severity: "overdue" });
    else if (w.severity === "soon") soon.push({ label: g.soon, severity: "soon" });
    else ok.push(g.ok);
  }
  const chips = [...overdue, ...soon];
  if (ok.length === 1) chips.push({ label: ok[0], severity: "ok" });
  else if (ok.length > 1) chips.push({ label: `${ok.length} al día`, severity: "ok" });
  if (chips.length === 0) return [{ label: "Sin plan de cuidados", severity: "info" }];
  return chips;
}

/** Próxima tarea del plan: la de fecha más cercana (o la más vencida) */
export function nextTask(cycles: CareCycle[]): CareCycle | null {
  let next: CareCycle | null = null;
  for (const c of cycles) {
    if (c.active === false) continue;
    if (!next || c.next_due_at < next.next_due_at) next = c;
  }
  return next;
}

/** Celda de estado (ícono + etiqueta corta) para el resumen del perfil */
export function statusCell(cycles: CareCycle[], kinds: CareCycleKind[]): { label: string; severity: Severity | null; detail: string } {
  const s = worstOf(cycles, kinds);
  if (!s) return { label: "Sin datos", severity: null, detail: "Añade un ciclo" };
  if (!cycles.some((c) => kinds.includes(c.kind) && c.last_done_at)) return { label: "Sin registro", severity: null, detail: "Registra la última fecha" };
  const detail = dueLabel(s.cycle.next_due_at);
  if (s.severity === "overdue") return { label: "Vencida", severity: "overdue", detail };
  if (s.severity === "soon") return { label: "Pronto", severity: "soon", detail };
  return { label: "Al día", severity: "ok", detail };
}

/** Primer error "tabla/función no existe" (migraciones sin aplicar): el código debe degradar sin romper */
export function isMissingRelation(err: unknown): boolean {
  const code = (err as { code?: string } | null)?.code;
  return code === "42P01" || code === "42883" || code === "PGRST202" || code === "PGRST205";
}
