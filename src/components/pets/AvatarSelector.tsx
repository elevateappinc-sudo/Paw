"use client";
import { useState, useEffect } from "react";
import { PawPrint } from "lucide-react";
import { cn } from "@/lib/utils";
import { SPECIES_VARIANTS } from "@/lib/avatar";
import type { Pet, AvatarConfig } from "@/types";

interface AvatarSelectorProps {
  pet: Partial<Pick<Pet, "id" | "species" | "emoji" | "color" | "avatar_config">>;
  value: AvatarConfig | null;
  onChange: (config: AvatarConfig) => void;
}

/**
 * AvatarSelector — rejilla de variantes DiceBear para la especie de la mascota.
 */
export function AvatarSelector({ pet, value, onChange }: AvatarSelectorProps) {
  const species = (pet.species ?? "otro") as Pet["species"];
  const variants = SPECIES_VARIANTS[species] ?? SPECIES_VARIANTS.otro;

  const [svgs, setSvgs] = useState<Record<number, string>>({});

  useEffect(() => {
    setSvgs({});
    let cancelled = false;

    async function loadAll() {
      const { createAvatar } = await import("@dicebear/core");
      const results: Record<number, string> = {};
      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        try {
          const styleModule = await importStyle(v.style);
          if (!styleModule) continue;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const avatar = createAvatar(styleModule as any, { seed: v.seed, size: 56 });
          results[i] = avatar.toString();
        } catch {
          // variante no disponible
        }
      }
      if (!cancelled) setSvgs(results);
    }

    void loadAll();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [species]);

  useEffect(() => {
    if (!value || !variants.find((v) => v.seed === value.seed)) {
      if (variants[0]) onChange({ style: variants[0].style, seed: variants[0].seed });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [species]);

  return (
    <div className="grid grid-cols-3 gap-2.5" role="radiogroup" aria-label="Avatar">
      {variants.map((v, i) => {
        const isSelected = value?.seed === v.seed;
        return (
          <button
            key={v.seed}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={v.label}
            onClick={() => onChange({ style: v.style, seed: v.seed })}
            className={cn(
              "flex flex-col items-center justify-center gap-1.5 rounded-card border-2 p-2.5 transition-[background-color,border-color] active:scale-95",
              isSelected ? "border-primary bg-primary-container" : "border-transparent bg-surface-2"
            )}
          >
            {svgs[i] ? (
              <div className="h-14 w-14 overflow-hidden rounded-control bg-surface" dangerouslySetInnerHTML={{ __html: svgs[i] }} aria-hidden="true" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-control bg-surface text-on-variant" aria-hidden="true">
                <PawPrint size={22} />
              </div>
            )}
            <span className={cn("text-[11px] font-bold", isSelected ? "text-on-primary-container" : "text-on-variant")}>{v.label}</span>
          </button>
        );
      })}
    </div>
  );
}

async function importStyle(style: string) {
  switch (style) {
    case "adventurer":
      return await import("@dicebear/adventurer");
    case "adventurer-neutral":
      return await import("@dicebear/adventurer-neutral");
    case "fun-emoji":
      return await import("@dicebear/fun-emoji");
    case "lorelei":
      return await import("@dicebear/lorelei");
    case "bottts":
      return await import("@dicebear/bottts");
    default:
      return null;
  }
}
