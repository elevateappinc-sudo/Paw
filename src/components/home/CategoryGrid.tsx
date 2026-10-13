"use client";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { CalendarDays, Footprints, GraduationCap, House, Scissors, ShoppingBag, Siren, Stethoscope } from "lucide-react";
import { SectionTitle } from "@/components/ui";
import { cn } from "@/lib/utils";

interface Category {
  label: string;
  href: string;
  icon: LucideIcon;
  tone?: "danger";
}

const CATEGORIES: Category[] = [
  { label: "Veterinaria", href: "/explorar?cat=veterinaria", icon: Stethoscope },
  { label: "Peluquería", href: "/explorar?cat=peluqueria", icon: Scissors },
  { label: "Tienda", href: "/explorar?cat=tienda", icon: ShoppingBag },
  { label: "Paseador", href: "/explorar?cat=paseador", icon: Footprints },
  { label: "Guardería", href: "/explorar?cat=guarderia", icon: House },
  { label: "Entrenador", href: "/explorar?cat=entrenador", icon: GraduationCap },
  { label: "Urgencias", href: "/sos", icon: Siren, tone: "danger" },
  { label: "Eventos", href: "/eventos", icon: CalendarDays },
];

/** Grilla 4×2 de categorías: cuadrado tintado de 64 px, radio 20 */
export function CategoryGrid() {
  return (
    <section className="px-4" aria-labelledby="home-cats">
      <SectionTitle>
        <span id="home-cats">¿Qué necesitas?</span>
      </SectionTitle>
      <div className="mt-3 grid grid-cols-4 gap-x-2 gap-y-4">
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.label} href={c.href} className="flex flex-col items-center gap-1.5 active:scale-95">
              <span
                className={cn(
                  "flex h-16 w-16 items-center justify-center rounded-[20px]",
                  c.tone === "danger" ? "bg-danger-container text-danger" : "bg-primary-container text-on-primary-container"
                )}
              >
                <Icon size={26} aria-hidden="true" />
              </span>
              <span className="text-[12px] font-bold text-on">{c.label}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
