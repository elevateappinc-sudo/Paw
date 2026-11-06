"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/** Título de sección del inicio con un botón de flecha (sin texto "Ver todo"); `badge` muestra un conteo */
export function HomeSectionHeader({ id, title, href, linkLabel, badge }: { id: string; title: string; href: string; linkLabel: string; badge?: number }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4">
      <h2 id={id} className="flex items-center gap-2 text-title font-semibold text-text">
        {title}
        {badge !== undefined && (
          <span className="rounded-full bg-primary-soft px-2 text-small font-semibold tabular-nums text-primary-text">
            {badge}
            <span className="sr-only"> pendientes</span>
          </span>
        )}
      </h2>
      <Link href={href} aria-label={linkLabel} className="pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-primary-text shadow-1">
        <ArrowRight size={18} aria-hidden="true" />
      </Link>
    </div>
  );
}
