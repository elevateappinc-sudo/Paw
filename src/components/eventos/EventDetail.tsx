"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Check, MapPin, Navigation, ShieldCheck, Users } from "lucide-react";
import { Button, Card, EmptyState, PageHeader, Tag, buttonVariants, showToast } from "@/components/ui";
import { useActivePet } from "@/hooks/useActivePet";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useStore } from "@/store";
import { EVENT_CATEGORY_LABEL, calendarLink, fetchEvent, rsvpEvent } from "@/lib/api/events";
import { distanceLabel } from "@/lib/api/businesses";
import type { PetEvent } from "@/types/db";
import { cn, formatCurrency } from "@/lib/utils";
import { directionsLink, formatDateLong, formatTime, friendlyError, haversineM, toastOnce } from "@/components/explorar/lib";
import { EventDetailSkeleton } from "./EventsSkeleton";
import { useVaccinesOk } from "./EventsView";

export function EventDetail({ id }: { id: string }) {
  const router = useRouter();
  const userId = useStore((s) => s.currentUserId);
  const { pet } = useActivePet();
  const geo = useGeolocation();
  const [event, setEvent] = useState<PetEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  const vaccinesOk = useVaccinesOk(pet?.id ?? null, pet?.species ?? null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchEvent(id, userId ?? undefined)
      .then((e) => !cancelled && setEvent(e))
      .catch((e) => {
        if (cancelled) return;
        const msg = friendlyError(e);
        setError(msg);
        toastOnce("eventos.detalle", msg);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id, userId, reload]);

  const onRsvp = async () => {
    if (!event) return;
    if (!userId) {
      showToast("Inicia sesión para apuntarte", undefined, "error");
      return;
    }
    const going = event.my_status === "going";
    const prev = event;
    setEvent({ ...event, my_status: going ? "cancelled" : "going", going_count: Math.max(0, (event.going_count ?? 0) + (going ? -1 : 1)) });
    setBusy(true);
    try {
      await rsvpEvent(event.id, userId, going ? "cancelled" : "going", pet?.id ?? null);
      showToast(going ? "Ya no vas a este evento" : "Apuntado. Te esperamos", undefined, "success");
    } catch (e) {
      setEvent(prev);
      showToast(friendlyError(e), onRsvp, "error");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <EventDetailSkeleton />;

  if (error || !event) {
    return (
      <div className="min-h-dvh bg-bg">
        <PageHeader title="Evento" back backHref="/eventos" />
        <EmptyState
          title={error ? "No pudimos cargar el evento" : "No encontramos este evento"}
          description={error ?? "Puede que ya haya pasado o se haya cancelado."}
          action={error ? <Button full variant="secondary" onClick={() => setReload((n) => n + 1)}>Reintentar</Button> : <Button full variant="secondary" onClick={() => router.push("/eventos")}>Ver eventos</Button>}
        />
      </div>
    );
  }

  const going = event.my_status === "going";
  const distance = geo.lat != null && geo.lng != null && event.lat != null && event.lng != null ? haversineM(geo.lat, geo.lng, event.lat, event.lng) : null;
  const dir = directionsLink(event.lat, event.lng, event.address);
  const eligible = pet && pet.species === "perro" && event.category === "carrera" && vaccinesOk;

  return (
    <div className="min-h-dvh bg-bg pb-[calc(120px+env(safe-area-inset-bottom))]">
      <PageHeader title={EVENT_CATEGORY_LABEL[event.category]} back backHref="/eventos" />
      <div className="flex flex-col gap-4 px-4 pt-2">
        <div className="relative h-[200px] overflow-hidden rounded-md bg-border">
          {event.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.cover_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary-soft via-surface-elevated to-info-soft" aria-hidden="true" />
          )}
          <div className="absolute right-3 top-3 shadow-2">{event.price > 0 ? <Tag tone="neutral">{formatCurrency(event.price)}</Tag> : <Tag tone="ok">Gratis</Tag>}</div>
        </div>

        <header>
          <h1 className="font-semibold text-display leading-[1.1] text-text">{event.title}</h1>
          <p className="mt-1 text-body font-semibold capitalize text-text">{formatDateLong(event.starts_at)}</p>
          <p className="text-body text-text-secondary">
            {formatTime(event.starts_at)}
            {event.ends_at ? ` – ${formatTime(event.ends_at)}` : ""}
            {distance != null ? ` · ${distanceLabel(distance)}` : ""}
          </p>
          {eligible && (
            <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-success-soft px-3 py-1 text-label font-semibold text-success-text">
              <ShieldCheck size={14} className="text-success-text" aria-hidden="true" /> {pet.name} cumple los requisitos · vacunas al día
            </p>
          )}
        </header>

        {event.description && (
          <Card>
            <p className="whitespace-pre-line text-body leading-relaxed text-text">{event.description}</p>
          </Card>
        )}

        {(event.address || dir) && (
          <Card className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-surface-elevated text-text-secondary">
              <MapPin size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-body font-semibold text-text">{event.address ?? "Lugar por confirmar"}</p>
              {event.city && <p className="text-small text-text-secondary">{event.city}</p>}
              {dir && (
                <a href={dir} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "mt-2")}>
                  <Navigation size={16} /> Cómo llegar
                </a>
              )}
            </div>
          </Card>
        )}

        <Card className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-primary-soft text-primary-text">
            <Users size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-body font-semibold text-text">{event.organizer_name ?? "Comunidad Paw"}</p>
            <p className="text-small text-text-secondary">
              Organiza · {(event.going_count ?? 0) > 0 ? `${event.going_count} van` : "sé la primera persona en ir"}
              {event.capacity ? ` · cupo ${event.capacity}` : ""}
            </p>
          </div>
        </Card>

        <a href={calendarLink(event)} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: "secondary" }), "w-full")}>
          <CalendarPlus size={18} /> Añadir al calendario
        </a>
      </div>

      <div className="glass fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[640px] border-t border-border px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">
        <Button full size="lg" variant={going ? "secondary" : "primary"} onClick={onRsvp} loading={busy} aria-pressed={going} leading={going ? <Check size={18} /> : undefined}>
          {going ? "Vas · cancelar asistencia" : "Voy"}
        </Button>
      </div>
    </div>
  );
}
