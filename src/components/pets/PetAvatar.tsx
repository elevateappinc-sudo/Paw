"use client";
import { useState, useEffect } from "react";
import type { Pet } from "@/types";
import { getDefaultAvatarConfig } from "@/lib/avatar";

interface PetAvatarProps {
  pet: Pet;
  size?: "sm" | "md" | "lg";
  className?: string;
  style?: React.CSSProperties;
  onAvatarInit?: (config: Pet["avatar_config"]) => void; // called when lazy-init assigns a config
}

const SIZE_PX: Record<string, number> = { sm: 32, md: 48, lg: 96 };

/**
 * PetAvatar — renders a DiceBear SVG avatar for a pet.
 * If avatar_config is null/undefined, it auto-assigns the default config for the species
 * and calls onAvatarInit so the caller can persist to DB.
 * Falls back to the pet emoji if DiceBear fails.
 */
export function PetAvatar({ pet, size = "md", className, style: styleOverride, onAvatarInit }: PetAvatarProps) {
  const px = SIZE_PX[size] ?? 48;
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  // Resolve the config (lazy init if needed)
  const config = pet.avatar_config ?? getDefaultAvatarConfig(pet);

  // Notify parent about lazy init so it can save to DB
  useEffect(() => {
    if (!pet.avatar_config && onAvatarInit) {
      onAvatarInit(config);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pet.id]);

  useEffect(() => {
    let cancelled = false;
    setSvgContent(null);
    setFailed(false);

    async function generate() {
      try {
        const { createAvatar } = await import("@dicebear/core");

        // Dynamically import the style module
        const styleModule = await importStyle(config.style);
        if (!styleModule) throw new Error("Unknown style");

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const avatar = createAvatar(styleModule as any, {
          seed: config.seed,
          size: px,
        });

        const svg = avatar.toString();
        if (!cancelled) setSvgContent(svg);
      } catch (err) {
        console.warn("[PetAvatar] DiceBear failed, using fallback:", err);
        if (!cancelled) setFailed(true);
      }
    }

    void generate();
    return () => { cancelled = true; };
  }, [config.style, config.seed, px]);

  const containerStyle: React.CSSProperties = {
    width: px,
    height: px,
    borderRadius: px * 0.25,
    overflow: "hidden",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: `${pet.color ?? "#0a84ff"}22`,
    ...styleOverride,
  };

  // Fallback: emoji or SVG silhouette
  if (failed) {
    return (
      <div className={className} style={containerStyle}>
        {pet.emoji ? (
          <span style={{ fontSize: px * 0.5 }}>{pet.emoji}</span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/avatars/fallback.svg"
            alt="avatar"
            width={px}
            height={px}
            style={{ width: px, height: px }}
          />
        )}
      </div>
    );
  }

  // Loading placeholder
  if (!svgContent) {
    return (
      <div className={className} style={containerStyle}>
        <div style={{
          width: px * 0.4,
          height: px * 0.4,
          borderRadius: "50%",
          background: `${pet.color ?? "#0a84ff"}44`,
          animation: "pulse 1.5s ease-in-out infinite",
        }} />
      </div>
    );
  }

  return (
    <div
      className={className}
      style={containerStyle}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}

// Dynamic style importer — avoids bundling all styles
// DiceBear style modules export named exports (create, meta, schema) — no default
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
