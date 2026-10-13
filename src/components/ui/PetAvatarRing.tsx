"use client";
import { cn } from "@/lib/utils";
import type { Pet } from "@/types";
import { PetAvatar } from "@/components/pets/PetAvatar";

/**
 * Avatar circular con anillo de acento cuando está activo.
 * Las fotos mandan: sin filtros ni texto encima.
 */
export function PetAvatarRing({ pet, active, size = 68, className }: { pet: Pet; active?: boolean; size?: number; className?: string }) {
  return (
    <div
      className={cn("rounded-full p-[3px] transition-colors", active ? "bg-primary" : "bg-outline-variant", className)}
      style={{ width: size, height: size }}
    >
      <div className="h-full w-full overflow-hidden rounded-full border-[3px] border-bg bg-surface-3">
        <PetAvatar pet={pet} size="lg" style={{ width: "100%", height: "100%", borderRadius: "50%" }} />
      </div>
    </div>
  );
}
