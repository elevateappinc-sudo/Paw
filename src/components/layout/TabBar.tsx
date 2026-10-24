"use client";
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
 * FAB contextual: Registrar en Inicio. En Explorar no hay FAB (la búsqueda ya
 * está en pantalla); Comunidad (/perdida) tiene el suyo, "Reportar", porque es
 * pantalla completa sin menú.
 */
const FAB: Record<string, { href: string; label: string } | undefined> = {
  "/home": { href: "/home?registrar=1", label: "Registrar" },
};

/**
 * Menú inferior flotante (design system · TabBar):
 * - 4 destinos, 72 px + safe area, vidrio translúcido con brillo superior y
 *   sombra lavanda suave en claro (--shadow-nav); en oscuro sin sombra, se
 *   separa por capa y borde. Con transparencia reducida, superficie sólida.
 * - Activo: píldora primaria que se desliza bajo el ícono, ícono relleno y
 *   etiqueta semibold. Inactivo: trazo y peso regular. El estado no depende
 *   solo del color.
 * - Al activarse, el ícono hace un rebote breve con --ease-playful (sin él
 *   con movimiento reducido).
 */
export function TabBar() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const hasPets = useStore((s) => s.pets.length > 0);
  // Sin mascotas, la pantalla ya tiene su acción principal ("Añadir mi primera mascota")
  const fab = hasPets ? FAB[pathname] : undefined;
  const elevation = { boxShadow: "var(--shadow-nav), var(--nav-highlight)" };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-[640px] items-center gap-3 px-4 pb-[max(12px,env(safe-area-inset-bottom))]">
      <nav
        aria-label="Navegación principal"
        className="glass pointer-events-auto flex h-18 flex-1 items-stretch rounded-xl border border-border px-1"
        style={elevation}
      >
        {TABS.map((t) => {
          const active = t.prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
          const Icon = t.icon;
          return (
            <Link
              key={t.id}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className="group relative flex min-h-11 flex-1 flex-col items-center justify-center gap-1 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
            >
              {/* Indicador: píldora primaria que se desliza entre destinos */}
              <span className="relative flex h-8 w-14 items-center justify-center">
                {active && (
                  <motion.span
                    layoutId="tab-indicator"
                    className="absolute inset-0 rounded-full bg-primary"
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
                  {/* Relleno solo en el ícono activo; navegación inactiva en trazo */}
                  <Icon size={20} strokeWidth={active ? 2.2 : 1.9} fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.22 : 0} aria-hidden="true" />
                </motion.span>
              </span>
              <span
                className={cn(
                  "relative text-label transition-colors duration-[var(--duration-base)]",
                  active ? "font-semibold text-primary-text" : "font-normal text-text-secondary"
                )}
              >
                {t.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {fab && (
        <Link
          href={fab.href}
          aria-label={fab.label}
          className="pressable pointer-events-auto flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          style={elevation}
        >
          <Plus size={24} strokeWidth={2.4} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
