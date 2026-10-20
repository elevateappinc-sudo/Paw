"use client";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Camera, ChevronRight, PawPrint, Wallet } from "lucide-react";
import { PetFood, PetHealth, PetTraining, PetWeight } from "@/components/icons/pet";
import { Sheet } from "@/components/ui";

interface Option {
  id: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  href?: string;
}

/**
 * Destino del FAB "Registrar" de Inicio: atajos a flujos que ya existen.
 * "Peso" abre la hoja de peso en la misma pantalla (onWeight).
 */
export function RegistrarSheet({ open, onClose, petId, onWeight }: { open: boolean; onClose: () => void; petId: string | null; onWeight?: () => void }) {
  const options: Option[] = petId
    ? [
        { id: "salud", label: "Cuidado de salud", hint: "Vacuna, antiparasitario o visita", icon: PetHealth, href: `/salud?pet=${petId}` },
        { id: "peso", label: "Peso", hint: "Un registro al mes basta", icon: PetWeight },
        { id: "comida", label: "Comida", hint: "Porciones y horarios", icon: PetFood, href: "/alimentacion" },
        { id: "gasto", label: "Gasto", hint: "Veterinaria, comida, accesorios", icon: Wallet, href: "/gastos?nuevo=1" },
        { id: "entrenamiento", label: "Entrenamiento", hint: "Sesión y comandos practicados", icon: PetTraining, href: "/actividad/entrenamiento?nuevo=1" },
        { id: "foto", label: "Foto", hint: "Guárdala en la galería", icon: Camera, href: "/galeria" },
      ]
    : [{ id: "mascota", label: "Mascota", hint: "Primero añade a tu mascota", icon: PawPrint, href: "/mascotas/nueva" }];

  return (
    <Sheet open={open} onClose={onClose} title="Registrar" subtitle="¿Qué quieres anotar?">
      <ul className="enter-list flex flex-col gap-2">
        {options.map((o) => {
          const Icon = o.icon;
          const content = (
            <>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-primary-soft text-primary-text">
                <Icon size={18} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-subtitle font-semibold text-text">{o.label}</span>
                <span className="block truncate text-small text-text-secondary">{o.hint}</span>
              </span>
              <ChevronRight size={20} className="shrink-0 text-text-secondary" aria-hidden="true" />
            </>
          );
          const cls = "pressable flex min-h-16 w-full items-center gap-3 rounded-md border border-border bg-surface px-4 py-3 text-left";
          return (
            <li key={o.id}>
              {o.href ? (
                <Link href={o.href} className={cls}>
                  {content}
                </Link>
              ) : (
                <button type="button" onClick={onWeight} className={cls}>
                  {content}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}
