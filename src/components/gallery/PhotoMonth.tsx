"use client";
/**
 * PhotoMonth — Sección de un mes con header y grid de fotos.
 */
import { PhotoCard, type PhotoCardPhoto, type ContextualBadge } from "./PhotoCard";

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";

export interface MonthGroup {
  month_key: string;
  month_label: string;
  photo_count: number;
  photos: PhotoCardPhoto[];
}

interface PhotoMonthProps {
  group: MonthGroup;
  getBadges: (photo: PhotoCardPhoto) => ContextualBadge[];
  onPhotoClick: (photo: PhotoCardPhoto, group: MonthGroup) => void;
}

// Capitalize first letter (PostgreSQL sometimes lowercases month names)
function capitalizeMonth(label: string): string {
  return label.trim().replace(/^\w/, (c) => c.toUpperCase());
}

export function PhotoMonth({ group, getBadges, onPhotoClick }: PhotoMonthProps) {
  return (
    <div style={{ marginBottom: 32 }}>
      {/* Month header */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 8,
          marginBottom: 10,
          padding: "0 4px",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 700,
            color: "#fff",
            fontFamily: FONT,
          }}
        >
          {capitalizeMonth(group.month_label)}
        </h3>
        <span
          style={{
            fontSize: 13,
            color: "rgba(235,235,245,0.4)",
            fontFamily: FONT,
          }}
        >
          · {group.photo_count} {group.photo_count === 1 ? "foto" : "fotos"}
        </span>
      </div>

      {/* Photo grid: 3 cols mobile, 4 cols desktop */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 3,
        }}
        className="photo-grid"
      >
        {group.photos.map((photo) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            badges={getBadges(photo)}
            onClick={() => onPhotoClick(photo, group)}
          />
        ))}
      </div>

      <style>{`
        @media (min-width: 768px) {
          .photo-grid { grid-template-columns: repeat(4, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}
