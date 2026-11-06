"use client";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { CalendarDays } from "lucide-react";
import { HomeSectionHeader } from "./HomeSectionHeader";
import { PetDaycare, PetGrooming, PetHealth, PetShop, PetTraining, PetWalk } from "@/components/icons/pet";

interface Category {
  label: string;
  href: string;
  icon: LucideIcon;
}

/** Urgencias no va aquí: el botón SOS ya está siempre visible arriba */
const CATEGORIES: Category[] = [
  { label: "Vet", href: "/explorar?cat=veterinaria", icon: PetHealth },
  { label: "Estética", href: "/explorar?cat=peluqueria", icon: PetGrooming },
  { label: "Tienda", href: "/explorar?cat=tienda", icon: PetShop },
  { label: "Paseo", href: "/explorar?cat=paseador", icon: PetWalk },
  { label: "Guardería", href: "/explorar?cat=guarderia", icon: PetDaycare },
  { label: "Entreno", href: "/explorar?cat=entrenador", icon: PetTraining },
  { label: "Eventos", href: "/eventos", icon: CalendarDays },
];

/** Servicios: título + fila de íconos en mosaicos blancos con etiqueta de una palabra */
export function CategoryGrid() {
  return (
    <nav aria-labelledby="home-services">
      <HomeSectionHeader id="home-services" title="Servicios y cuidados" href="/explorar" linkLabel="Ver todos los servicios" />
      <ul className="no-scrollbar fade-edge mt-1 flex gap-3 overflow-x-auto px-4 pb-2 pt-1">
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          return (
            <li key={c.label} className="shrink-0">
              <Link href={c.href} className="pressable flex w-16 flex-col items-center gap-2">
                <span className="invert-dark flex h-14 w-14 items-center justify-center rounded-lg border border-border bg-surface text-primary-text shadow-1">
                  <Icon size={24} aria-hidden="true" />
                </span>
                <span className="text-label font-semibold text-text">{c.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
