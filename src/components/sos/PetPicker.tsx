"use client";
import { ChipRow } from "@/components/ui";
import { PetAvatar } from "@/components/pets/PetAvatar";
import type { Pet } from "@/types";
import { cn } from "@/lib/utils";

/** Chips con mini avatar para cambiar de mascota dentro de la hoja. */
export function PetPicker({ pets, activeId, onSelect }: { pets: Pet[]; activeId: string | null; onSelect: (id: string) => void }) {
  if (pets.length <= 1) return null;
  return (
    <ChipRow className="mt-3">
      {pets.map((p) => {
        const active = p.id === activeId;
        return (
          <button
            key={p.id}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(p.id)}
            className={cn(
              "inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full pl-1 pr-3.5 text-[14px] font-bold transition-[background-color,transform] active:scale-95",
              active ? "bg-primary text-on-primary" : "bg-surface-2 text-on"
            )}
          >
            <span className={cn("overflow-hidden rounded-full border-2", active ? "border-on-primary/40" : "border-transparent")}>
              <PetAvatar pet={p} size="sm" style={{ width: 32, height: 32, borderRadius: "50%" }} />
            </span>
            {p.name}
          </button>
        );
      })}
    </ChipRow>
  );
}
