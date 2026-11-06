"use client";
import { TriangleAlert } from "lucide-react";
import { Sheet, Tag } from "@/components/ui";

export function ToxicSheet({ open, onClose, speciesLabel, foods, allergies }: {
  open: boolean;
  onClose: () => void;
  speciesLabel: string;
  foods: string[];
  allergies: string[];
}) {
  return (
    <Sheet open={open} onClose={onClose} title={`Nunca para ${speciesLabel}`} subtitle="Alimentos que pueden hacerle daño">
      <div className="flex flex-col gap-4 pb-2">
        <div className="flex items-start gap-2 rounded-md bg-warning-soft px-3 py-3 text-small leading-snug text-warning-text">
          <TriangleAlert size={16} className="mt-1 shrink-0 text-warning-text" aria-hidden="true" />
          <span>Si come algo de esta lista, llama a tu veterinario o usa el botón SOS. No esperes a ver síntomas.</span>
        </div>
        <ul className="flex flex-col gap-2">
          {foods.map((f) => (
            <li key={f} className="flex items-center gap-2 rounded-md bg-surface-elevated px-3 py-3 text-body text-text">
              <span className="h-2 w-2 shrink-0 rounded-full bg-warning" aria-hidden="true" />
              {f}
            </li>
          ))}
        </ul>
        {allergies.length > 0 && (
          <div>
            <h4 className="mb-2 text-small font-semibold text-text-secondary">Alergias registradas</h4>
            <div className="flex flex-wrap gap-2">
              {allergies.map((a) => <Tag key={a} tone="warn">{a}</Tag>)}
            </div>
          </div>
        )}
        <p className="text-small leading-relaxed text-text-secondary">
          Esta lista es orientativa. Cada mascota es distinta: ante cualquier duda sobre un alimento, consulta con tu veterinario.
        </p>
      </div>
    </Sheet>
  );
}
