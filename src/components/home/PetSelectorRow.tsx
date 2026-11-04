"use client";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PetAvatarRing, SkeletonPets } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Pet } from "@/types";

/** Fila horizontal de mascotas; la activa lleva anillo. Nombre debajo, nunca sobre la foto. */
export function PetSelectorRow({ pets, activeId, onSelect, loading }: { pets: Pet[]; activeId: string | null; onSelect: (id: string) => void; loading: boolean }) {
  if (loading) return <SkeletonPets />;
  return (
    <div className="no-scrollbar fade-edge enter-soft-list flex gap-4 overflow-x-auto px-4" role="listbox" aria-label="Tus mascotas">
      {pets.map((p) => {
        const active = p.id === activeId;
        return (
          <button
            key={p.id}
            type="button"
            role="option"
            aria-selected={active}
            onClick={() => onSelect(p.id)}
            className="pressable flex w-18 shrink-0 flex-col items-center gap-2"
          >
            <PetAvatarRing pet={p} active={active} size={68} />
            <span className={cn("max-w-full truncate text-label font-semibold", active ? "text-text" : "text-text-secondary")}>{p.name}</span>
          </button>
        );
      })}
      <Link href="/mascotas/nueva" className="pressable flex w-18 shrink-0 flex-col items-center gap-2" aria-label="Añadir mascota">
        <span className="flex h-17 w-17 items-center justify-center rounded-full border-2 border-dashed border-text-secondary text-text-secondary">
          <Plus size={24} aria-hidden="true" />
        </span>
        <span className="text-label font-semibold text-text-secondary">Añadir</span>
      </Link>
    </div>
  );
}
