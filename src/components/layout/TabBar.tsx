"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { Home, PawPrint, Compass, CalendarDays, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/store";

const TABS = [
  { id: "home", label: "Inicio", href: "/home", icon: Home, prefixes: ["/home"] },
  { id: "pets", label: "Mascotas", href: "/mascotas", icon: PawPrint, prefixes: ["/mascotas", "/salud", "/alimentacion", "/higiene", "/actividad", "/gastos", "/galeria", "/videos"] },
  { id: "explore", label: "Explorar", href: "/explorar", icon: Compass, prefixes: ["/explorar", "/marketplace"] },
  { id: "bookings", label: "Citas", href: "/citas", icon: CalendarDays, prefixes: ["/citas"] },
] as const;

/**
 * FAB contextual: Registrar en Inicio y Añadir en Mascotas. En Explorar no
 * hay FAB (la búsqueda ya está en pantalla); Comunidad (/perdida) tiene el
 * suyo, "Reportar", porque es pantalla completa sin menú.
 */
const FAB: Record<string, { href: string; label: string } | undefined> = {
  "/home": { href: "/home?registrar=1", label: "Registrar" },
  "/mascotas": { href: "/mascotas/nueva", label: "Añadir mascota" },
};

/**
 * Menú inferior flotante: píldora con 4 destinos. El activo va con
 * --color-primary-soft y --color-primary-text. Etiquetas siempre visibles.
 */
export function TabBar() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const hasPets = useStore((s) => s.pets.length > 0);
  // Sin mascotas, la pantalla ya tiene su acción principal ("Añadir mi primera mascota")
  const fab = hasPets ? FAB[pathname] : undefined;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-[640px] items-center gap-3 px-4 pb-[max(12px,env(safe-area-inset-bottom))]">
      <nav aria-label="Navegación principal" className="pointer-events-auto flex h-18 flex-1 items-center rounded-xl border border-border bg-surface p-1 shadow-3">
        {TABS.map((t) => {
          const active = t.prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
          const Icon = t.icon;
          return (
            <Link
              key={t.id}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex h-full min-h-11 flex-1 flex-col items-center justify-center gap-1 text-label font-semibold transition-colors duration-[var(--duration-base)]",
                active ? "text-primary-text" : "text-text-secondary"
              )}
            >
              {/* Activo: ícono dentro de un cuadrado redondeado de color sólido */}
              <span className="relative flex h-9 w-9 items-center justify-center">
                {active && (
                  <motion.span
                    layoutId="tab-pill"
                    className="absolute inset-0 rounded-md bg-primary"
                    transition={reduce ? { duration: 0 } : { duration: 0.2, ease: [0.2, 0, 0, 1] }}
                    aria-hidden="true"
                  />
                )}
                <Icon size={20} strokeWidth={active ? 2.2 : 2} className={cn("relative", active ? "text-on-primary" : "text-text-secondary")} aria-hidden="true" />
              </span>
              <span className="relative">{t.label}</span>
            </Link>
          );
        })}
      </nav>
      {fab && (
        <Link
          href={fab.href}
          aria-label={fab.label}
          className="pressable pointer-events-auto flex h-13 w-13 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary shadow-2"
        >
          <Plus size={24} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
