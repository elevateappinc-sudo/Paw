"use client";
/**
 * PhotoCard — Tarjeta individual con miniatura, insignias de contexto y skeleton.
 */
import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { BADGE_ICON, type ContextualBadge } from "./badges";

export type { ContextualBadge } from "./badges";

export interface PhotoCardPhoto {
  id: string;
  photo_url: string | null;
  storage_path: string | null;
  created_at: string | null;
  signedUrl?: string;
}

interface PhotoCardProps {
  photo: PhotoCardPhoto;
  badges: ContextualBadge[];
  onClick: () => void;
}

export function PhotoCard({ photo, badges, onClick }: PhotoCardProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const src = photo.signedUrl || photo.photo_url || "";
  const label = badges.length > 0 ? `Abrir foto · ${badges.map((b) => b.label).join(", ")}` : "Abrir foto";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="relative aspect-square overflow-hidden rounded-card bg-surface-2 transition-transform active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-primary"
    >
      {!loaded && !errored && <div className="skeleton absolute inset-0 rounded-none" aria-hidden="true" />}

      {errored && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-on-variant">
          <ImageOff size={20} aria-hidden="true" />
          <span className="text-[10px] font-semibold">No se pudo cargar</span>
        </div>
      )}

      {src && !errored && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => {
            setErrored(true);
            setLoaded(true);
          }}
          className={cn("block h-full w-full object-cover transition-opacity duration-200", loaded ? "opacity-100" : "opacity-0")}
        />
      )}

      {loaded && !errored && badges.length > 0 && (
        <div className="absolute bottom-1.5 left-1.5 flex flex-wrap gap-1" aria-hidden="true">
          {badges.slice(0, 3).map((b) => {
            const Icon = BADGE_ICON[b.kind];
            return (
              <span key={b.kind} title={b.label} className="flex h-5 w-5 items-center justify-center rounded-full bg-on/75 text-bg">
                <Icon size={12} />
              </span>
            );
          })}
          {badges.length > 3 && (
            <span className="flex h-5 items-center rounded-full bg-on/75 px-1.5 text-[10px] font-bold text-bg">+{badges.length - 3}</span>
          )}
        </div>
      )}
    </button>
  );
}
