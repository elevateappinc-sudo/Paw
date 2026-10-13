"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { Home, PawPrint, Compass, CalendarDays, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "home", label: "Inicio", href: "/home", icon: Home, prefixes: ["/home"] },
  { id: "pets", label: "Mascotas", href: "/mascotas", icon: PawPrint, prefixes: ["/mascotas", "/salud", "/alimentacion", "/higiene", "/actividad", "/gastos", "/galeria", "/videos"] },
  { id: "explore", label: "Explorar", href: "/explorar", icon: Compass, prefixes: ["/explorar", "/marketplace"] },
  { id: "bookings", label: "Citas", href: "/citas", icon: CalendarDays, prefixes: ["/citas"] },
] as const;

/**
 * Tab bar flotante (Liquid Glass) con cuatro destinos y botón de búsqueda.
 * Etiquetas siempre visibles (usuarios no técnicos). 44 pt de alto mínimo.
 */
export function TabBar() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-[640px] items-end gap-2.5 px-4 pb-[max(14px,env(safe-area-inset-bottom))]">
      <nav aria-label="Navegación principal" className="glass pointer-events-auto flex flex-1 rounded-full border border-outline-variant p-1 shadow-2">
        {TABS.map((t) => {
          const active = t.prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
          const Icon = t.icon;
          return (
            <Link
              key={t.id}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={cn("relative flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-bold", active ? "text-primary" : "text-on-variant")}
            >
              {active && (
                <motion.span
                  layoutId="tab-pill"
                  className="absolute inset-x-1 inset-y-1 rounded-full bg-primary-container/70"
                  transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
                  aria-hidden="true"
                />
              )}
              <motion.span whileTap={reduce ? undefined : { scale: 1.15 }} className="relative">
                <Icon size={24} strokeWidth={active ? 2.4 : 1.9} />
              </motion.span>
              <span className="relative">{t.label}</span>
            </Link>
          );
        })}
      </nav>
      <Link
        href="/explorar?buscar=1"
        aria-label="Buscar servicios"
        className="pointer-events-auto flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full bg-primary text-on-primary shadow-2 active:scale-95"
      >
        <Search size={24} />
      </Link>
    </div>
  );
}
