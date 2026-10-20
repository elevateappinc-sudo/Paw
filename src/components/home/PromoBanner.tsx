"use client";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PetGrooming } from "@/components/icons/pet";

export interface Promo {
  title: string;
  subtitle: string;
}

export const DEFAULT_PROMO: Promo = { title: "Primer baño con 20 % menos", subtitle: "En peluquerías cerca de ti" };

/**
 * Promoción compacta: una línea con ícono, sin competir con el contenido.
 * Fondo primario suave (no sólido) para no invadir.
 */
export function PromoBanner({ promo }: { promo: Promo }) {
  return (
    <Link href="/explorar?cat=peluqueria" className="pressable flex min-h-16 items-center gap-3 rounded-lg bg-primary-soft px-4 py-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
        <PetGrooming size={20} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body font-semibold text-primary-text">{promo.title}</span>
        <span className="block truncate text-small text-text-secondary">{promo.subtitle}</span>
      </span>
      <ChevronRight size={18} className="shrink-0 text-primary-text" aria-hidden="true" />
    </Link>
  );
}
