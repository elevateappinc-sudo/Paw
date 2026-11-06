"use client";
import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { Home, PawPrint, Compass, CalendarDays, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/store";
import { DURATION, EASE_PLAYFUL, EASE_STANDARD } from "@/lib/motion";

const TABS = [
  { id: "home", label: "Inicio", href: "/home", icon: Home, prefixes: ["/home"] },
  { id: "pets", label: "Mascotas", href: "/mascotas", icon: PawPrint, prefixes: ["/mascotas", "/salud", "/alimentacion", "/higiene", "/actividad", "/gastos", "/galeria", "/videos"] },
  { id: "explore", label: "Explorar", href: "/explorar", icon: Compass, prefixes: ["/explorar", "/marketplace"] },
  { id: "bookings", label: "Citas", href: "/citas", icon: CalendarDays, prefixes: ["/citas"] },
] as const;

/**
 * Menú inferior flotante (design system · TabBar, Azul sereno):
 * - Barra blanca sólida de 72 px + safe area con sombra suave (--shadow-nav);
 *   en oscuro se separa por capa y borde.
 * - 4 destinos y, al centro, el botón "+" elevado con anillo de la superficie.
 * - Activo: bloque primario (azul marino) que se desliza entre destinos, con
 *   ícono y etiqueta en --color-on-primary. Inactivo: trazo y texto secundario.
 * - Al activarse, el ícono hace un rebote breve con --ease-playful (sin él
 *   con movimiento reducido).
 */
export function TabBar() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const hasPets = useStore((s) => s.pets.length > 0);
  // Sin mascotas, el "+" lleva a crear la primera
  const fab = hasPets ? { href: "/home?registrar=1", label: "Registrar" } : { href: "/mascotas/nueva", label: "Añadir mascota" };
  const half = TABS.length / 2;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[640px] px-4 pb-[max(12px,env(safe-area-inset-bottom))]">
      <nav
        aria-label="Navegación principal"
        className="pointer-events-auto flex h-18 items-stretch gap-1 rounded-xl border border-border bg-surface px-2 py-2"
        style={{ boxShadow: "var(--shadow-nav), var(--nav-highlight)" }}
      >
        {TABS.map((t, i) => {
          const active = t.prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
          const Icon = t.icon;
          return (
            <Fragment key={t.id}>
              {i === half && (
                <div className="flex w-16 shrink-0 justify-center">
                  <Link
                    href={fab.href}
                    aria-label={fab.label}
                    className="pressable -mt-8 flex h-16 w-16 items-center justify-center rounded-full border-4 border-bg bg-primary text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    style={{ boxShadow: "var(--shadow-nav)" }}
                  >
                    <Plus size={26} strokeWidth={2.4} aria-hidden="true" />
                  </Link>
                </div>
              )}
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className="group relative flex min-h-11 flex-1 flex-col items-center justify-center gap-1 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
              >
                {/* Indicador: bloque primario que se desliza entre destinos */}
                {active && (
                  <motion.span
                    layoutId="tab-indicator"
                    className="absolute inset-y-0 inset-x-1 rounded-lg bg-primary"
                    transition={reduce ? { duration: 0 } : { duration: DURATION.slow, ease: EASE_STANDARD }}
                    aria-hidden="true"
                  />
                )}
                <motion.span
                  key={active ? "on" : "off"}
                  initial={reduce || !active ? false : { scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: DURATION.slow, ease: EASE_PLAYFUL }}
                  className={cn(
                    "relative flex transition-transform duration-[var(--duration-fast)] group-active:scale-[0.9]",
                    active ? "text-on-primary" : "text-text-secondary"
                  )}
                >
                  <Icon size={20} strokeWidth={active ? 2.2 : 1.9} aria-hidden="true" />
                </motion.span>
                <span
                  className={cn(
                    "relative text-label transition-colors duration-[var(--duration-base)]",
                    active ? "font-semibold text-on-primary" : "font-normal text-text-secondary"
                  )}
                >
                  {t.label}
                </span>
              </Link>
            </Fragment>
          );
        })}
      </nav>
    </div>
  );
}
