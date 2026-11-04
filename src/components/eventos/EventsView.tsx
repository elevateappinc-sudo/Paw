"use client";
import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Button, Chip, ChipRow, EmptyState, PageHeader, showToast } from "@/components/ui";
import { useActivePet } from "@/hooks/useActivePet";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useStore } from "@/store";
import { fetchUpcomingEvents, rsvpEvent } from "@/lib/api/events";
import { fetchCareCycles } from "@/lib/api/careCycles";
import { fadeUp, stagger } from "@/lib/motion";
import type { EventCategory, PetEvent } from "@/types/db";
import { friendlyError, haversineM, toastOnce } from "@/components/explorar/lib";
import { EventCard } from "./EventCard";
import { EventsSkeleton } from "./EventsSkeleton";

const CITY = "Bogotá";
type Filter = "all" | "week" | EventCategory;
const CHIPS: { id: Filter; label: string }[] = [
  { id: "week", label: "Esta semana" },
  { id: "adopcion", label: "Adopción" },
  { id: "clase", label: "Clases" },
  { id: "carrera", label: "Carreras" },
  { id: "feria", label: "Ferias" },
  { id: "salud", label: "Salud" },
];

/** Si la mascota es perro y no tiene vacunas vencidas, el evento tipo carrera le aplica. */
export function useVaccinesOk(petId: string | null, species: string | null): boolean | null {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    if (!petId || species !== "perro") {
      setOk(null);
      return;
    }
    let cancelled = false;
    fetchCareCycles(petId)
      .then((cycles) => {
        if (cancelled) return;
        const today = new Date().toISOString().slice(0, 10);
        const overdue = cycles.some((c) => c.kind === "vaccine" && c.next_due_at < today);
        setOk(!overdue);
      })
      .catch(() => !cancelled && setOk(null));
    return () => {
      cancelled = true;
    };
  }, [petId, species]);
  return ok;
}

export function EventsView() {
  const reduce = useReducedMotion();
  const userId = useStore((s) => s.currentUserId);
  const { pet } = useActivePet();
  const geo = useGeolocation();
  const [filter, setFilter] = useState<Filter>("all");
  const [events, setEvents] = useState<PetEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const vaccinesOk = useVaccinesOk(pet?.id ?? null, pet?.species ?? null);

  const category: EventCategory | undefined = filter === "all" || filter === "week" ? undefined : filter;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchUpcomingEvents({ city: CITY, category, userId: userId ?? undefined, limit: 40 })
      .then((rows) => !cancelled && setEvents(rows))
      .catch((e) => {
        if (cancelled) return;
        const msg = friendlyError(e);
        setError(msg);
        toastOnce("eventos.lista", msg);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [category, userId, reload]);

  const list = useMemo(() => {
    if (filter !== "week") return events;
    const limit = Date.now() + 7 * 86400000;
    return events.filter((e) => new Date(e.starts_at).getTime() <= limit);
  }, [events, filter]);

  const distanceFor = (e: PetEvent): number | null => (geo.lat != null && geo.lng != null && e.lat != null && e.lng != null ? haversineM(geo.lat, geo.lng, e.lat, e.lng) : null);

  const noteFor = (e: PetEvent): string | null => (pet && pet.species === "perro" && e.category === "carrera" && vaccinesOk ? `${pet.name} cumple los requisitos · vacunas al día` : null);

  const onRsvp = async (e: PetEvent) => {
    if (!userId) {
      showToast("Inicia sesión para apuntarte", undefined, "error");
      return;
    }
    const going = e.my_status === "going";
    const next: PetEvent = { ...e, my_status: going ? "cancelled" : "going", going_count: Math.max(0, (e.going_count ?? 0) + (going ? -1 : 1)) };
    setEvents((prev) => prev.map((x) => (x.id === e.id ? next : x)));
    setBusyId(e.id);
    try {
      await rsvpEvent(e.id, userId, going ? "cancelled" : "going", pet?.id ?? null);
      showToast(going ? "Ya no vas a este evento" : "Apuntado. Te esperamos", undefined, "success");
    } catch (err) {
      setEvents((prev) => prev.map((x) => (x.id === e.id ? e : x)));
      showToast(friendlyError(err), () => onRsvp(e), "error");
    } finally {
      setBusyId(null);
    }
  };

  if (loading && events.length === 0) return <EventsSkeleton />;

  return (
    <div className="min-h-dvh bg-bg pb-[calc(32px+env(safe-area-inset-bottom))]">
      <PageHeader title="Eventos" eyebrow={`${CITY} · a menos de 10 km`} back backHref="/home" />
      <div className="px-4 pt-1">
        <ChipRow>
          {CHIPS.map((c) => (
            <Chip key={c.id} selected={filter === c.id} onClick={() => setFilter(filter === c.id ? "all" : c.id)}>
              {c.label}
            </Chip>
          ))}
        </ChipRow>
      </div>
      <div className="px-4 pt-4">
        {error && list.length === 0 ? (
          <EmptyState title="No pudimos cargar los eventos" description={error} action={<Button full variant="secondary" onClick={() => setReload((n) => n + 1)}>Reintentar</Button>} />
        ) : list.length === 0 ? (
          <EmptyState
            title="Nada por ahora"
            description={filter === "week" ? "No hay eventos esta semana cerca de ti. Mira las próximas fechas." : "Estamos sumando eventos en tu ciudad. Vuelve pronto."}
            action={filter !== "all" ? <Button full variant="secondary" onClick={() => setFilter("all")}>Ver todos</Button> : undefined}
          />
        ) : (
          <motion.ul variants={reduce ? undefined : stagger()} initial="hidden" animate="show" className="flex flex-col gap-3" aria-label="Eventos">
            {list.map((e, i) => (
              <motion.li key={e.id} variants={reduce ? undefined : fadeUp}>
                <EventCard event={e} distanceM={distanceFor(e)} onRsvp={onRsvp} rsvpBusy={busyId === e.id} eligibleNote={noteFor(e)} variant={i === 0 ? "large" : "compact"} />
              </motion.li>
            ))}
          </motion.ul>
        )}
      </div>
    </div>
  );
}
