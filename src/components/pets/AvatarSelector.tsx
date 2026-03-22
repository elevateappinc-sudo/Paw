"use client";
import { useState, useEffect } from "react";
import type { Pet, AvatarConfig } from "@/types";
import { SPECIES_VARIANTS, getDefaultAvatarConfig } from "@/lib/avatar";

interface AvatarSelectorProps {
  pet: Partial<Pick<Pet, "id" | "species" | "emoji" | "color" | "avatar_config">>;
  value: AvatarConfig | null;
  onChange: (config: AvatarConfig) => void;
}

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";

/**
 * AvatarSelector — grid of DiceBear avatar variants for the pet's species.
 * Renders inline SVG previews and lets the user pick one.
 */
export function AvatarSelector({ pet, value, onChange }: AvatarSelectorProps) {
  const species = (pet.species ?? "otro") as Pet["species"];
  const variants = SPECIES_VARIANTS[species] ?? SPECIES_VARIANTS.otro;
  const accentColor = pet.color ?? "#0a84ff";

  // SVG cache per variant index
  const [svgs, setSvgs] = useState<Record<number, string>>({});

  useEffect(() => {
    setSvgs({}); // reset on species change
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
          // skip failed variant
        }
      }

      if (!cancelled) setSvgs(results);
    }

    void loadAll();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [species]);

  // When species changes and no value set, auto-select first variant
  useEffect(() => {
    if (!value || !variants.find((v) => v.seed === value.seed)) {
      if (variants[0]) onChange({ style: variants[0].style, seed: variants[0].seed });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [species]);

  return (
    <div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 10,
      }}>
        {variants.map((v, i) => {
          const isSelected = value?.seed === v.seed;
          return (
            <button
              key={v.seed}
              type="button"
              onClick={() => onChange({ style: v.style, seed: v.seed })}
              title={v.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: 10,
                borderRadius: 14,
                background: isSelected ? `${accentColor}22` : "rgba(255,255,255,0.05)",
                border: `2px solid ${isSelected ? accentColor : "transparent"}`,
                cursor: "pointer",
                transition: "all 0.15s",
                fontFamily: FONT,
              }}
            >
              {svgs[i] ? (
                <div
                  style={{ width: 56, height: 56, borderRadius: 12, overflow: "hidden" }}
                  dangerouslySetInnerHTML={{ __html: svgs[i] }}
                />
              ) : (
                <div style={{
                  width: 56, height: 56, borderRadius: 12,
                  background: `${accentColor}18`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22,
                }}>
                  {pet.emoji ?? "🐾"}
                </div>
              )}
              <span style={{ fontSize: 10, color: isSelected ? accentColor : "rgba(235,235,245,0.5)", fontWeight: 600 }}>
                {v.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

async function importStyle(style: string) {
  switch (style) {
    case "adventurer": return await import("@dicebear/adventurer");
    case "adventurer-neutral": return await import("@dicebear/adventurer-neutral");
    case "fun-emoji": return await import("@dicebear/fun-emoji");
    case "lorelei": return await import("@dicebear/lorelei");
    case "bottts": return await import("@dicebear/bottts");
    default: return null;
  }
}
