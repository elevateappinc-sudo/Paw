"use client";
import { PetAvatarRing } from "@/components/ui";
import type { Pet } from "@/types";
import { cn } from "@/lib/utils";

/** Selector mínimo de mascota: solo avatares; la activa lleva el anillo de acento */
export function PetPicker({ pets, activeId, onSelect }: { pets: Pet[]; activeId: string | null; onSelect: (id: string) => void }) {
  if (pets.length <= 1) return null;
  return (
    <div className="flex justify-center gap-3" role="radiogroup" aria-label="Mascota en urgencia">
      {pets.map((p) => {
        const active = p.id === activeId;
        return (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={p.name}
            onClick={() => onSelect(p.id)}
            className={cn("pressable flex flex-col items-center gap-1", !active && "opacity-60")}
          >
            <PetAvatarRing pet={p} active={active} size={48} />
            <span className={cn("text-label font-semibold", active ? "text-text" : "text-text-secondary")}>{p.name}</span>
          </button>
        );
      })}
    </div>
  );
}
