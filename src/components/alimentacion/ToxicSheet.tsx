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
        <div className="flex items-start gap-2 rounded-control bg-danger-container px-3 py-2.5 text-[13px] leading-snug text-on-danger-container">
          <TriangleAlert size={16} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
          <span>Si come algo de esta lista, llama a tu veterinario o usa el botón SOS. No esperes a ver síntomas.</span>
        </div>
        <ul className="flex flex-col gap-1.5">
          {foods.map((f) => (
            <li key={f} className="flex items-center gap-2 rounded-control bg-surface-2 px-3 py-2.5 text-[15px] text-on">
              <span className="h-2 w-2 shrink-0 rounded-full bg-danger" aria-hidden="true" />
              {f}
            </li>
          ))}
        </ul>
        {allergies.length > 0 && (
          <div>
            <h4 className="mb-2 text-[13px] font-bold uppercase tracking-wide text-on-variant">Alergias registradas</h4>
            <div className="flex flex-wrap gap-1.5">
              {allergies.map((a) => <Tag key={a} tone="warn">{a}</Tag>)}
            </div>
          </div>
        )}
        <p className="text-[13px] leading-relaxed text-on-variant">
          Esta lista es orientativa. Cada mascota es distinta: ante cualquier duda sobre un alimento, consulta con tu veterinario.
        </p>
      </div>
    </Sheet>
  );
}
