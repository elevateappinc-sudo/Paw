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
    <div className="no-scrollbar flex gap-4 overflow-x-auto px-4" role="listbox" aria-label="Tus mascotas">
      {pets.map((p) => {
        const active = p.id === activeId;
        return (
          <button
            key={p.id}
            type="button"
            role="option"
            aria-selected={active}
            onClick={() => onSelect(p.id)}
            className="flex w-[72px] shrink-0 flex-col items-center gap-1.5 active:scale-95"
          >
            <PetAvatarRing pet={p} active={active} size={68} />
            <span className={cn("max-w-full truncate text-[12px] font-bold", active ? "text-on" : "text-on-variant")}>{p.name}</span>
          </button>
        );
      })}
      <Link href="/mascotas/nueva" className="flex w-[72px] shrink-0 flex-col items-center gap-1.5 active:scale-95" aria-label="Añadir mascota">
        <span className="flex h-[68px] w-[68px] items-center justify-center rounded-full border-2 border-dashed border-outline text-on-variant">
          <Plus size={24} aria-hidden="true" />
        </span>
        <span className="text-[12px] font-bold text-on-variant">Añadir</span>
      </Link>
    </div>
  );
}
