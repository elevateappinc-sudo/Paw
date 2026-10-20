"use client";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

/** Título de sección del inicio con un botón de flecha (sin texto "Ver todo") */
export function HomeSectionHeader({ id, title, href, linkLabel }: { id: string; title: string; href: string; linkLabel: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4">
      <h2 id={id} className="text-title font-semibold text-text">
        {title}
      </h2>
      <Link href={href} aria-label={linkLabel} className="pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-elevated text-text-secondary">
        <ChevronRight size={20} aria-hidden="true" />
      </Link>
    </div>
  );
}
