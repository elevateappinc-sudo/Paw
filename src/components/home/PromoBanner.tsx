"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export interface Promo {
  title: string;
  subtitle: string;
}

export const DEFAULT_PROMO: Promo = { title: "Primer baño con 20 % menos", subtitle: "En peluquerías cerca de ti esta semana" };

/** El único elemento fuerte de la pantalla */
export function PromoBanner({ promo }: { promo: Promo }) {
  return (
    <div className="relative overflow-hidden rounded-card-lg bg-primary p-5 text-on-primary shadow-2">
      <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-14 h-44 w-44 rounded-full bg-on-primary/15" />
      <span aria-hidden="true" className="pointer-events-none absolute -bottom-16 right-16 h-36 w-36 rounded-full bg-on-primary/10" />
      <span aria-hidden="true" className="pointer-events-none absolute -left-8 bottom-2 h-20 w-20 rounded-full bg-on-primary/10" />
      <div className="relative max-w-[78%]">
        <h2 className="font-display text-[24px] leading-[1.1] text-on-primary">{promo.title}</h2>
        <p className="mt-1.5 text-[14px] font-semibold text-on-primary/85">{promo.subtitle}</p>
        <Link
          href="/explorar?cat=peluqueria"
          className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-surface px-5 text-[14px] font-bold text-primary shadow-1 active:scale-95"
        >
          Ver groomers
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
