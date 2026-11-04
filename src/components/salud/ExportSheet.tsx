"use client";
import { useMemo, useState } from "react";
import { Share2, Copy, Check } from "lucide-react";
import { Sheet, Button } from "@/components/ui";
import { showToast } from "@/components/ui/Toast";
import { ageLabel, SPECIES_LABEL } from "@/lib/api/pets";
import { CARE_KIND_LABEL, type CareCycle, type PetRow, type WeightLog } from "@/types/db";
import type { MedicationData } from "./api";
import type { HistoryItem } from "./HistoryList";
import { HISTORY_KIND_LABEL } from "./HistoryList";
import { longDate, shortDate } from "./shared";

export function buildClinicalSummary(input: {
  petName: string;
  species: string;
  profile: PetRow | null;
  cycles: CareCycle[];
  medications: MedicationData[];
  weights: WeightLog[];
  history: HistoryItem[];
}): string {
  const { petName, species, profile, cycles, medications, weights, history } = input;
  const lines: string[] = [];
  lines.push(`Resumen clínico de ${petName}`);
  lines.push(`Generado el ${longDate(new Date().toISOString().slice(0, 10))} con Paw`);
  lines.push("");
  const speciesLabel = (SPECIES_LABEL as Record<string, string>)[species] ?? species;
  const basics = [speciesLabel, profile?.breed, profile?.birth_date ? ageLabel(profile.birth_date) : null].filter(Boolean).join(" · ");
  lines.push(`Datos: ${basics || "sin datos"}`);
  const lastWeight = weights.length ? weights[weights.length - 1] : null;
  if (lastWeight) lines.push(`Peso: ${lastWeight.weight_kg} kg (${shortDate(lastWeight.measured_at)})`);
  else if (profile?.weight) lines.push(`Peso: ${profile.weight} kg`);
  if (profile?.neutered !== undefined) lines.push(`Esterilizado: ${profile?.neutered ? "sí" : "no"}`);
  if (profile?.microchip) lines.push(`Microchip: ${profile.microchip}`);
  if (profile?.allergies?.length) lines.push(`Alergias: ${profile.allergies.join(", ")}`);
  if (profile?.conditions?.length) lines.push(`Condiciones: ${profile.conditions.join(", ")}`);
  lines.push("");

  const activeMeds = medications.filter((m) => m.active);
  lines.push("Medicamentos activos:");
  if (activeMeds.length === 0) lines.push("  Ninguno");
  for (const m of activeMeds) lines.push(`  - ${m.name}: ${m.dose_amount} ${m.dose_unit}, cada ${m.frequency_value} ${m.frequency_unit === "hours" ? "h" : m.frequency_unit === "days" ? "días" : m.frequency_unit === "weekly" ? "semanas" : "veces al día"}`);
  lines.push("");

  lines.push("Próximos cuidados:");
  if (cycles.length === 0) lines.push("  Ninguno programado");
  for (const c of cycles) lines.push(`  - ${CARE_KIND_LABEL[c.kind]} · ${c.name}: ${shortDate(c.next_due_at)}${c.last_done_at ? ` (última ${shortDate(c.last_done_at)})` : ""}`);
  lines.push("");

  lines.push("Historial reciente:");
  const recent = [...history].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 12);
  if (recent.length === 0) lines.push("  Sin registros");
  for (const h of recent) lines.push(`  - ${shortDate(h.date)} · ${HISTORY_KIND_LABEL[h.kind]} · ${h.title}${h.subtitle ? ` (${h.subtitle})` : ""}`);
  return lines.join("\n");
}

export function ExportSheet({ open, onClose, summary, petName }: { open: boolean; onClose: () => void; summary: string; petName: string }) {
  const [copied, setCopied] = useState(false);
  const canShare = useMemo(() => typeof navigator !== "undefined" && typeof navigator.share === "function", []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      showToast("Resumen copiado", undefined, "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("No pudimos copiar. Selecciona el texto y cópialo.", undefined, "error");
    }
  }

  async function share() {
    try {
      await navigator.share({ title: `Resumen clínico de ${petName}`, text: summary });
    } catch (e) {
      // El usuario canceló o el navegador no permitió compartir: ofrecer copia
      if (e instanceof Error && e.name === "AbortError") return;
      await copy();
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Resumen clínico"
      subtitle="Para llevar a la veterinaria o compartir"
      footer={
        <div className="flex gap-2">
          <Button variant={canShare ? "secondary" : "primary"} onClick={() => void copy()} leading={copied ? <Check size={18} /> : <Copy size={18} />} className="flex-1">
            {copied ? "Copiado" : "Copiar"}
          </Button>
          {canShare && (
            <Button onClick={() => void share()} leading={<Share2 size={18} />} className="flex-[2]">Compartir</Button>
          )}
        </div>
      }
    >
      <pre className="whitespace-pre-wrap rounded-md bg-surface-elevated p-4 font-sans text-body leading-relaxed text-text">{summary}</pre>
    </Sheet>
  );
}
