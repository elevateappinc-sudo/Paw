"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronRight, Plus, ShieldCheck, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui";
import { PetAvatar } from "@/components/pets/PetAvatar";
import { CARE_KIND_ICON } from "@/components/pets/petHelpers";
import { daysUntil, dueLabel, fetchCareCycles } from "@/lib/api/careCycles";
import { SPECIES_LABEL } from "@/lib/api/pets";
import { formatPetAge } from "@/lib/age";
import { cn } from "@/lib/utils";
import type { Pet } from "@/types";
import type { CareCycle } from "@/types/db";

/** Fondo pastel propio de cada mascota: su color mezclado con la superficie */
function pastelOf(pet: Pet): string {
  return `color-mix(in oklab, ${pet.color || "var(--color-primary)"} 22%, var(--color-surface))`;
}

/** Ancho de cada tarjeta (px): coincide con w-72 */
const CARD_W = 288;

/**
 * Carrusel 3D (coverflow) de tarjetas de mascota: la centrada queda de
 * frente y las vecinas giran sobre su eje, se achican y se atenúan según su
 * distancia al centro. Solo se animan transform y opacity; con movimiento
 * reducido no hay giro. Al soltar, la tarjeta centrada pasa a ser la activa.
 */
export function PetHeroCarousel({ pets, activeId, onSelect }: { pets: Pet[]; activeId: string | null; onSelect: (id: string) => void }) {
  const scroller = useRef<HTMLDivElement | null>(null);
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;
  const activeRef = useRef(activeId);
  activeRef.current = activeId;
  // Hasta ubicar la tarjeta activa, el desplazamiento no cambia la selección
  const ready = useRef(false);

  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;
    let settle: ReturnType<typeof setTimeout> | undefined;

    const paint = () => {
      raf = 0;
      const box = root.getBoundingClientRect();
      const center = box.left + box.width / 2;
      let closest: { id: string | undefined; d: number } = { id: undefined, d: Infinity };
      root.querySelectorAll<HTMLElement>("[data-card]").forEach((el) => {
        const r = el.getBoundingClientRect();
        const d = (r.left + r.width / 2 - center) / (r.width + 16);
        const a = Math.min(Math.abs(d), 1.5);
        if (Math.abs(d) < closest.d) closest = { id: el.dataset.petId, d: Math.abs(d) };
        if (reduce.matches) {
          el.style.transform = "";
          el.style.opacity = a > 0.5 ? "0.7" : "1";
          return;
        }
        const rotate = Math.max(-1, Math.min(1, d)) * 32; // hacia afuera: el borde exterior se aleja
        el.style.transform = `perspective(900px) rotateY(${rotate}deg) scale(${1 - Math.min(a, 1) * 0.14})`;
        el.style.opacity = String(1 - Math.min(a, 1) * 0.35);
        el.style.zIndex = String(10 - Math.round(a * 4));
      });
      // Al terminar de deslizar, la tarjeta centrada es la mascota activa
      clearTimeout(settle);
      settle = setTimeout(() => {
        if (ready.current && closest.id && closest.id !== activeRef.current) selectRef.current(closest.id);
      }, 140);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(paint);
    };

    schedule();
    root.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    reduce.addEventListener("change", schedule);
    return () => {
      root.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      reduce.removeEventListener("change", schedule);
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(settle);
    };
  }, [pets]);

  // Al cambiar la activa desde otro lado (o al entrar), centrar su tarjeta
  useEffect(() => {
    const root = scroller.current;
    const el = root?.querySelector<HTMLElement>(`[data-pet-id="${activeId}"]`);
    if (!root || !el) {
      ready.current = true;
      return;
    }
    const target = el.offsetLeft + el.offsetWidth / 2 - root.clientWidth / 2;
    if (Math.abs(root.scrollLeft - target) > 4) root.scrollTo({ left: target, behavior: ready.current ? "smooth" : "auto" });
    if (!ready.current) {
      const t = setTimeout(() => (ready.current = true), 300);
      return () => clearTimeout(t);
    }
  }, [activeId]);

  return (
    <div
      ref={scroller}
      className="no-scrollbar flex snap-x snap-mandatory items-center gap-4 overflow-x-auto py-2"
      // Relleno lateral para que la primera y la última tarjeta puedan quedar centradas
      style={{ paddingInline: `calc(50% - ${CARD_W / 2}px)` }}
      aria-label="Tus mascotas"
      role="region"
    >
      {pets.map((p) => (
        <PetHeroCard key={p.id} pet={p} />
      ))}
      <div data-card className="w-36 shrink-0 snap-center transition-[transform,opacity] duration-[var(--duration-fast)] ease-[var(--ease-standard)]" style={{ transformStyle: "preserve-3d" }}>
        <Link
          href="/mascotas/nueva"
          aria-label="Añadir mascota"
          className="pressable flex h-44 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-label font-semibold text-primary-text"
        >
          <Plus size={22} aria-hidden="true" />
          Añadir
        </Link>
      </div>
    </div>
  );
}

function PetHeroCard({ pet }: { pet: Pet }) {
  const [cycles, setCycles] = useState<CareCycle[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchCareCycles(pet.id)
      .then((c) => !cancelled && setCycles(c))
      .catch(() => !cancelled && setCycles([]));
    return () => {
      cancelled = true;
    };
  }, [pet.id]);

  const pending = cycles?.filter((c) => daysUntil(c.next_due_at) <= 7) ?? [];
  const upToDate = cycles ? cycles.length - pending.length : 0;
  const next = cycles?.length ? [...cycles].sort((a, b) => a.next_due_at.localeCompare(b.next_due_at))[0] : null;
  const NextIcon = next ? CARE_KIND_ICON[next.kind] : null;
  const age = formatPetAge(pet.birthDate);

  return (
    <article
      data-card
      data-pet-id={pet.id}
      className="w-72 shrink-0 snap-center rounded-xl p-4 transition-[transform,opacity] duration-[var(--duration-fast)] ease-[var(--ease-standard)]"
      style={{ background: pastelOf(pet) }}
      aria-label={pet.name}
    >
      <div className="flex items-center gap-3">
        <span className="shrink-0 rounded-full bg-pastel-glass p-[2px]">
          <PetAvatar pet={pet} size="lg" style={{ width: 48, height: 48, borderRadius: "var(--radius-full)" }} />
        </span>
        <Link href={`/mascotas/${pet.id}`} className="min-w-0 flex-1">
          <span className="block truncate text-subtitle font-semibold text-text">{pet.name}</span>
          <span className="block truncate text-small text-text-secondary">{pet.breed || SPECIES_LABEL[pet.species]}</span>
          {age && <span className="block text-small text-text-secondary">{age}</span>}
        </Link>
        {cycles === null ? (
          <Skeleton className="h-7 w-20 rounded-full" />
        ) : cycles.length === 0 ? null : pending.length === 0 ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success px-3 py-1 text-small font-semibold text-on-primary">
            Al día <ShieldCheck size={14} aria-hidden="true" />
          </span>
        ) : (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-pastel-glass px-3 py-1 text-small font-semibold text-warning-text">
            <Clock size={14} aria-hidden="true" /> {pending.length}
            <span className="sr-only">{pending.length === 1 ? "cuidado pendiente" : "cuidados pendientes"}</span>
          </span>
        )}
      </div>

      <div className="mt-3 text-small text-text-secondary">Próximo cuidado</div>
      {cycles === null ? (
        <Skeleton className="mt-2 h-18 w-full rounded-lg" />
      ) : next && NextIcon ? (
        <Link href={`/salud?pet=${pet.id}`} className="pressable mt-2 flex items-center gap-3 rounded-lg bg-pastel-glass p-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-surface text-primary-text">
            <NextIcon size={22} aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-body font-semibold text-text">{next.name}</span>
            <span className={cn("mt-1 flex items-center gap-1 text-small", daysUntil(next.next_due_at) < 0 ? "text-overdue-text" : "text-text-secondary")}>
              <CalendarDays size={14} aria-hidden="true" /> {dueLabel(next.next_due_at)}
            </span>
          </span>
          <ChevronRight size={18} className="shrink-0 text-text-secondary" aria-hidden="true" />
        </Link>
      ) : (
        <Link href={`/salud?pet=${pet.id}`} className="pressable mt-2 flex min-h-14 items-center gap-2 rounded-lg bg-pastel-glass px-3 text-body font-semibold text-primary-text">
          <Plus size={18} aria-hidden="true" /> Armar su plan de cuidados
        </Link>
      )}

      {cycles && cycles.length > 0 && (
        <div className="mt-3 flex items-center gap-3">
          <span className="shrink-0 text-small tabular-nums text-text-secondary">
            {upToDate} de {cycles.length} al día
          </span>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-pastel-glass" role="progressbar" aria-valuenow={upToDate} aria-valuemin={0} aria-valuemax={cycles.length} aria-label="Cuidados al día">
            <span className="block h-full rounded-full bg-success transition-transform duration-[var(--duration-slow)] ease-[var(--ease-standard)]" style={{ width: "100%", transform: `scaleX(${upToDate / cycles.length})`, transformOrigin: "left" }} />
          </span>
        </div>
      )}
    </article>
  );
}

export function PetHeroSkeleton() {
  return (
    <div className="flex justify-center py-2" aria-hidden="true">
      <div className="w-72 rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-36" />
          </div>
        </div>
        <Skeleton className="mt-4 h-18 w-full rounded-lg" />
        <Skeleton className="mt-3 h-2 w-full rounded-full" />
      </div>
    </div>
  );
}
