"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GalleryProps {
  photos: string[];
  name: string;
  saved: boolean;
  onToggleSaved: () => void;
  savedBusy?: boolean;
}

/** Galería de fotos con botones en vidrio y contador "1 de N". */
export function Gallery({ photos, name, saved, onToggleSaved, savedBusy }: GalleryProps) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const scroller = useRef<HTMLDivElement | null>(null);
  const total = Math.max(photos.length, 1);

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== index) setIndex(Math.min(Math.max(i, 0), total - 1));
  };

  return (
    <div className="relative h-[280px] w-full overflow-hidden bg-border">
      {photos.length > 0 ? (
        <div ref={scroller} onScroll={onScroll} className="no-scrollbar flex h-full w-full snap-x snap-mandatory overflow-x-auto" aria-roledescription="carrusel" aria-label={`Fotos de ${name}`}>
          {photos.map((src, i) => (
            <div key={`${src}-${i}`} className="h-full w-full shrink-0 snap-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={i === 0 ? name : `${name}, foto ${i + 1}`} className="h-full w-full object-cover" loading={i === 0 ? "eager" : "lazy"} />
            </div>
          ))}
        </div>
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-surface-elevated via-border to-primary-soft" aria-hidden="true" />
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-[max(12px,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Volver"
          className="glass pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-border text-text shadow-1 active:scale-95"
        >
          <ChevronLeft size={22} />
        </button>
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleSaved}
            disabled={savedBusy}
            aria-pressed={saved}
            aria-label={saved ? "Quitar de guardados" : "Guardar"}
            className={cn("glass flex h-11 w-11 items-center justify-center rounded-full border border-border shadow-1 active:scale-95", saved ? "text-primary-text" : "text-text")}
          >
            <Bookmark size={20} className={saved ? "fill-current" : undefined} />
          </button>
        </div>
      </div>

      {photos.length > 0 && (
        <span className="glass absolute bottom-3 right-4 rounded-full border border-border px-3 py-1 text-label font-semibold text-text" aria-live="polite">
          {index + 1} de {total}
        </span>
      )}
    </div>
  );
}
