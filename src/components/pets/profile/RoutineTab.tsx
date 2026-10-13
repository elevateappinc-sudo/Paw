"use client";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { CalendarCheck, ChevronRight, Droplets, GraduationCap, Utensils } from "lucide-react";
import { Card } from "@/components/ui";

export function RoutineTab({ petId }: { petId: string }) {
  const links: { title: string; line: string; href: string; icon: LucideIcon }[] = [
    { title: "Alimentación", line: "Ración diaria y recompra de alimento", href: `/alimentacion?pet=${petId}`, icon: Utensils },
    { title: "Higiene", line: "Baño, uñas, oídos y dientes", href: `/higiene?pet=${petId}`, icon: Droplets },
    { title: "Itinerario", line: "Comidas y salidas de cada día", href: "/actividad/itinerario", icon: CalendarCheck },
    { title: "Entrenamiento", line: "Clases, ejercicios y avances", href: "/actividad/entrenamiento", icon: GraduationCap },
  ];
  return (
    <div className="flex flex-col gap-3 px-4 pt-4">
      {links.map((l) => {
        const Icon = l.icon;
        return (
          <Link key={l.href} href={l.href} className="block">
            <Card padded={false} interactive className="flex min-h-[64px] items-center gap-3 px-4 py-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-primary-container text-on-primary-container">
                <Icon size={22} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[16px] font-bold text-on">{l.title}</span>
                <span className="block truncate text-[13px] text-on-variant">{l.line}</span>
              </span>
              <ChevronRight size={20} className="shrink-0 text-on-variant" aria-hidden="true" />
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
