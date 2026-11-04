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
      className="relative aspect-square overflow-hidden rounded-md bg-surface-elevated transition-transform active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-primary"
    >
      {!loaded && !errored && <div className="skeleton absolute inset-0 rounded-none" aria-hidden="true" />}

      {errored && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-text-secondary">
          <ImageOff size={20} aria-hidden="true" />
          <span className="text-label font-semibold">No se pudo cargar</span>
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
        <div className="absolute bottom-2 left-2 flex flex-wrap gap-1" aria-hidden="true">
          {badges.slice(0, 3).map((b) => {
            const Icon = BADGE_ICON[b.kind];
            return (
              <span key={b.kind} title={b.label} className="flex h-5 w-5 items-center justify-center rounded-full bg-text/75 text-bg">
                <Icon size={12} />
              </span>
            );
          })}
          {badges.length > 3 && (
            <span className="flex h-5 items-center rounded-full bg-text/75 px-2 text-label font-semibold text-bg">+{badges.length - 3}</span>
          )}
        </div>
      )}
    </button>
  );
}
