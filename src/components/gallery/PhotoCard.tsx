"use client";
/**
 * PhotoCard — Tarjeta individual con thumbnail, badges contextuales y skeleton.
 */
import { useState } from "react";

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";

export interface ContextualBadge {
  icon: string;
  label: string;
}

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

  return (
    <div
      onClick={onClick}
      style={{
        position: "relative",
        aspectRatio: "1",
        overflow: "hidden",
        borderRadius: 10,
        cursor: "pointer",
        background: "#1c1c1e",
      }}
    >
      {/* Skeleton */}
      {!loaded && !errored && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, #1c1c1e 25%, #2c2c2e 50%, #1c1c1e 75%)",
            backgroundSize: "200% 100%",
            animation: "skeletonPulse 1.5s ease-in-out infinite",
          }}
        />
      )}

      {/* Error state */}
      {errored && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
        >
          <span style={{ fontSize: 22 }}>📷</span>
          <span style={{ fontSize: 9, color: "rgba(235,235,245,0.3)", fontFamily: FONT }}>
            No se pudo cargar la foto
          </span>
        </div>
      )}

      {/* Image */}
      {src && !errored && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          onLoad={() => setLoaded(true)}
          onError={() => { setErrored(true); setLoaded(true); }}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            opacity: loaded ? 1 : 0,
            transition: "opacity 0.2s",
          }}
        />
      )}

      {/* Badges overlay */}
      {loaded && !errored && badges.length > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: 5,
            left: 5,
            display: "flex",
            gap: 3,
            flexWrap: "wrap",
          }}
        >
          {badges.slice(0, 3).map((b, i) => (
            <span
              key={i}
              title={b.label}
              style={{
                fontSize: 14,
                lineHeight: 1,
                background: "rgba(0,0,0,0.65)",
                borderRadius: 6,
                padding: "2px 4px",
              }}
            >
              {b.icon}
            </span>
          ))}
          {badges.length > 3 && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: "#fff",
                background: "rgba(0,0,0,0.65)",
                borderRadius: 6,
                padding: "2px 4px",
                fontFamily: FONT,
                lineHeight: 1.4,
              }}
            >
              +{badges.length - 3}
            </span>
          )}
        </div>
      )}

      <style>{`
        @keyframes skeletonPulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
