"use client";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { CalendarCheck } from "lucide-react";
import { PetBath, PetFood, PetTraining } from "@/components/icons/pet";

/** Rutina: cuadrícula 2×2 de accesos con ícono y una línea (menos texto que una lista) */
export function RoutineTab({ petId }: { petId: string }) {
  const links: { title: string; line: string; href: string; icon: LucideIcon; tone: string }[] = [
    { title: "Alimentación", line: "Ración y recompra", href: `/alimentacion?pet=${petId}`, icon: PetFood, tone: "bg-pastel-mint text-success-text" },
    { title: "Higiene", line: "Baño, uñas y oídos", href: `/higiene?pet=${petId}`, icon: PetBath, tone: "bg-pastel-lilac text-primary-text" },
    { title: "Itinerario", line: "Comidas y salidas", href: "/actividad/itinerario", icon: CalendarCheck, tone: "bg-pastel-lilac text-primary-text" },
    { title: "Entreno", line: "Clases y avances", href: "/actividad/entrenamiento", icon: PetTraining, tone: "bg-pastel-mint text-success-text" },
  ];
  return (
    <div className="enter-soft-list grid grid-cols-2 gap-3 px-4 pt-4">
      {links.map((l) => {
        const Icon = l.icon;
        return (
          <Link key={l.href} href={l.href} className="pressable flex min-h-32 flex-col justify-between rounded-xl border border-border bg-surface p-4">
            <span className={`flex h-11 w-11 items-center justify-center rounded-md ${l.tone}`}>
              <Icon size={22} aria-hidden="true" />
            </span>
            <span>
              <span className="block text-body font-semibold text-text">{l.title}</span>
              <span className="block text-small text-text-secondary">{l.line}</span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
