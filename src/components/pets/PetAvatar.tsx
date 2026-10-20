"use client";
import { useState, useEffect } from "react";
import type { Pet } from "@/types";
import { portraitUrl } from "@/lib/petPortrait";

interface PetAvatarProps {
  pet: Pet;
  size?: "sm" | "md" | "lg";
  className?: string;
  style?: React.CSSProperties;
  /** @deprecated los avatares ilustrados de DiceBear (caras humanas) ya no se usan */
  onAvatarInit?: (config: Pet["avatar_config"]) => void;
}

const SIZE_PX: Record<string, number> = { sm: 32, md: 48, lg: 96 };


/**
 * Avatar de mascota: su foto (las fotos mandan) o, si no tiene o no carga,
 * un retrato realista de su especie y raza (src/lib/petPortrait.ts).
 */
export function PetAvatar({ pet, size = "md", className, style: styleOverride }: PetAvatarProps) {
  const px = SIZE_PX[size] ?? 48;
  // Si la foto no carga (enlace roto, servicio caído) se muestra el retrato
  const [photoFailed, setPhotoFailed] = useState(false);
  useEffect(() => setPhotoFailed(false), [pet.photoUrl]);

  const tone = pet.color || "var(--color-primary)";
  const containerStyle: React.CSSProperties = {
    width: px,
    height: px,
    borderRadius: px * 0.25,
    overflow: "hidden",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: `color-mix(in oklab, ${tone} 16%, var(--color-surface))`,
    color: tone,
    ...styleOverride,
  };

  if (pet.photoUrl && !photoFailed) {
    return (
      <div className={className} style={containerStyle}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={pet.photoUrl} alt={pet.name} width={px} height={px} onError={() => setPhotoFailed(true)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }

  return (
    <div className={className} style={containerStyle}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={portraitUrl(pet.species, pet.breed)} alt={pet.name} draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
  );
}
