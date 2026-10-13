"use client";
import { Scale } from "lucide-react";
import { Card, CardHeader, InfoCell, Button, Skeleton } from "@/components/ui";
import PetMembersPanel from "@/components/pets/PetMembersPanel";
import { statusCell } from "@/components/pets/petHelpers";
import { daysUntil } from "@/lib/api/careCycles";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { CareCycle, PetRow, WeightLog } from "@/types/db";
import { WeightChart } from "./WeightChart";

const DOT: Record<"ok" | "warn" | "danger" | "neutral", string> = {
  ok: "bg-ok",
  warn: "bg-warn",
  danger: "bg-danger",
  neutral: "bg-outline",
};

function weightCell(logs: WeightLog[] | null, pet: PetRow) {
  const last = logs && logs.length > 0 ? logs[logs.length - 1] : null;
  const kg = last ? Number(last.weight_kg) : pet.weight;
  if (!kg) return { label: "Sin registrar", tone: "neutral" as const, detail: "Pésalo hoy" };
  const value = `${kg.toLocaleString("es-CO", { maximumFractionDigits: 1 })} kg`;
  if (!last) return { label: value, tone: "neutral" as const, detail: "Sin fecha" };
  const ago = -daysUntil(last.measured_at.slice(0, 10));
  if (ago > 45) return { label: value, tone: "warn" as const, detail: `Hace ${ago} días` };
  return { label: value, tone: "ok" as const, detail: ago === 0 ? "Hoy" : `Hace ${ago} días` };
}

export function SummaryTab({ pet, cycles, weights, onAddWeight }: { pet: PetRow; cycles: CareCycle[] | null; weights: WeightLog[] | null; onAddWeight: () => void }) {
  const cells = cycles
    ? [
        { title: "Vacunas", ...statusCell(cycles, ["vaccine"]) },
        { title: "Antipulgas", ...statusCell(cycles, ["deworm_external"]) },
        { title: "Peso", ...weightCell(weights, pet) },
      ]
    : null;

  return (
    <div className="flex flex-col gap-4 px-4 pt-4">
      <div className="grid grid-cols-3 gap-2">
        {cells
          ? cells.map((c) => (
              <div key={c.title} className="rounded-control bg-surface-2 px-3 py-2.5">
                <div className="text-[11px] font-semibold text-on-variant">{c.title}</div>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", DOT[c.tone])} aria-hidden="true" />
                  <span className="truncate text-[14px] font-bold text-on">{c.label}</span>
                </div>
                <div className="mt-0.5 truncate text-[11px] text-on-variant">{c.detail}</div>
              </div>
            ))
          : [0, 1, 2].map((i) => <Skeleton key={i} className="h-[72px] rounded-control" />)}
      </div>

      <Card>
        <CardHeader title="Peso" subtitle={weights && weights.length > 1 ? `${weights.length} registros` : "Lleva el control de su peso"} />
        {weights === null ? (
          <Skeleton className="h-[120px] w-full" />
        ) : weights.length === 0 ? (
          <div className="flex items-center gap-3 rounded-control bg-surface-2 px-3 py-3 text-[14px] text-on-variant">
            <Scale size={20} className="shrink-0" aria-hidden="true" />
            Aún no hay registros de peso.
          </div>
        ) : (
          <WeightChart logs={weights} />
        )}
        <Button variant="tonal" full className="mt-3" onClick={onAddWeight} leading={<Scale size={18} aria-hidden="true" />}>
          Registrar peso de hoy
        </Button>
      </Card>

      <Card>
        <CardHeader title="Datos clave" />
        <div className="grid grid-cols-2 gap-2">
          <InfoCell label="Nacimiento" value={pet.birth_date ? formatDate(pet.birth_date) : "Sin registrar"} />
          <InfoCell label="Microchip" value={pet.microchip || "Sin registrar"} />
          <InfoCell label="Alergias" tone={pet.allergies?.length ? "warn" : undefined} value={pet.allergies?.length ? pet.allergies.join(", ") : "Ninguna conocida"} />
          <InfoCell label="Grupo sanguíneo" value={pet.blood_type || "Sin registrar"} />
          {pet.conditions?.length > 0 && <InfoCell label="Condiciones" tone="info" value={pet.conditions.join(", ")} className="col-span-2" />}
          {pet.emergency_contact?.phone && <InfoCell label="Contacto de emergencia" value={`${pet.emergency_contact.name} · ${pet.emergency_contact.phone}`} className="col-span-2" />}
        </div>
      </Card>

      <Card padded={false}>
        <CardHeader title="Cuidadores" subtitle="Quién puede ver y editar su ficha" className="px-4 pt-4" />
        {/* PetMembersPanel usa estilos oscuros en línea: se envuelve en un contenedor oscuro sin modificarlo */}
        <div className="mx-4 mb-4 overflow-hidden rounded-card bg-primary dark:bg-surface-2 [@media(prefers-color-scheme:dark)]:bg-surface-2">
          <PetMembersPanel petId={pet.id} />
        </div>
      </Card>
    </div>
  );
}
