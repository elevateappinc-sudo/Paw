"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check, X, CalendarCheck, Eye, Star } from "lucide-react";
import { Button, Card, CardHeader, EmptyState, Skeleton, Tag, showToast } from "@/components/ui";
import { fetchBusinessBookings, updateBookingStatus, STATUS_LABEL } from "@/lib/api/bookings";
import { isMissingSchema } from "@/lib/api/schemaErrors";
import { fadeUp, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { Booking, Business } from "@/types/db";
import { bookingDuration, bookingTime, countBookings7d, dayRange, fetchViews7d, nextDays, STATUS_TONE, ymd } from "./negocioData";

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-card bg-surface-2 px-3 py-2.5">
      <span className="flex items-center gap-1 text-[11px] font-semibold text-on-variant">{icon} {label}</span>
      <span className="font-display text-[22px] leading-none text-on">{value}</span>
    </div>
  );
}

export function AgendaTab({ business }: { business: Business }) {
  const reduce = useReducedMotion();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [day, setDay] = useState(() => ymd(new Date()));
  const [views, setViews] = useState<{ value: number; source: "views" | "bookings" } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const toasted = useRef(false);
  const days = useMemo(() => nextDays(7), []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const from = new Date(Date.now() - 30 * 86400000).toISOString();
      const rows = await fetchBusinessBookings(business.id, from);
      setBookings(rows);
    } catch (e) {
      if (isMissingSchema(e)) {
        setBookings([]);
        if (!toasted.current) {
          toasted.current = true;
          showToast("Las reservas aún no están disponibles");
        }
      } else setError("No pudimos cargar la agenda");
    } finally {
      setLoading(false);
    }
  }, [business.id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const v = await fetchViews7d(business.id);
      if (cancelled) return;
      if (v !== null) setViews({ value: v, source: "views" });
      else setViews({ value: await countBookings7d(business.id), source: "bookings" });
    })();
    return () => {
      cancelled = true;
    };
  }, [business.id]);

  const todayKey = ymd(new Date());
  const todayCount = bookings.filter((b) => ymd(new Date(b.starts_at)) === todayKey && b.status !== "cancelled" && b.status !== "no_show").length;
  const pending = bookings.filter((b) => b.status === "requested" && new Date(b.starts_at).getTime() >= Date.now() - 86400000);
  const range = dayRange(day);
  const ofDay = bookings.filter((b) => b.starts_at >= range.from && b.starts_at <= range.to).sort((a, b) => a.starts_at.localeCompare(b.starts_at));

  async function setStatus(b: Booking, status: Booking["status"]) {
    setBusy(b.id);
    const prev = bookings;
    setBookings((rows) => rows.map((x) => (x.id === b.id ? { ...x, status } : x)));
    try {
      await updateBookingStatus(b.id, status);
      if (status === "completed") showToast(`Quedó en el historial de ${b.pets?.name ?? "la mascota"}`, undefined, "success");
      if (status === "confirmed") showToast("Cita confirmada", undefined, "success");
      if (status === "cancelled") showToast("Solicitud rechazada");
    } catch {
      setBookings(prev);
      showToast("No pudimos actualizar la cita", () => void setStatus(b, status), "error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2">
        <Kpi icon={<CalendarCheck size={12} aria-hidden="true" />} label="Citas hoy" value={loading ? "–" : String(todayCount)} />
        <Kpi icon={<Eye size={12} aria-hidden="true" />} label={views?.source === "bookings" ? "Reservas 7 días" : "Vistas 7 días"} value={views ? String(views.value) : "–"} />
        <Kpi icon={<Star size={12} aria-hidden="true" />} label="Rating" value={business.rating_count ? Number(business.rating_avg).toFixed(1) : "–"} />
      </div>

      {loading ? (
        <>
          <Skeleton className="h-[72px] rounded-card-lg" />
          <Skeleton className="h-[220px] rounded-card-lg" />
        </>
      ) : error ? (
        <EmptyState tone="danger" compact title="Algo salió mal" description={error} action={<Button full onClick={load}>Reintentar</Button>} />
      ) : (
        <>
          {pending.length > 0 && (
            <Card tone="warn" elevation={0}>
              <CardHeader title={`${pending.length} ${pending.length === 1 ? "solicitud por confirmar" : "solicitudes por confirmar"}`} className="mb-2" />
              <ul className="flex flex-col gap-2">
                {pending.map((b) => (
                  <li key={b.id} className="flex items-center gap-2 rounded-control bg-surface px-3 py-2 text-on">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] font-bold">{b.pets?.name ?? "Mascota"} · {b.business_services?.name ?? "Servicio"}</div>
                      <div className="text-[12px] text-on-variant">{new Date(b.starts_at).toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short" })} · {bookingTime(b)}</div>
                    </div>
                    <Button size="icon" variant="primary" aria-label="Confirmar" onClick={() => setStatus(b, "confirmed")} loading={busy === b.id}><Check size={18} /></Button>
                    <Button size="icon" variant="dangerTonal" aria-label="Rechazar" onClick={() => setStatus(b, "cancelled")} disabled={busy === b.id}><X size={18} /></Button>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4" role="tablist" aria-label="Día">
            {days.map((d) => {
              const active = d.key === day;
              return (
                <button
                  key={d.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setDay(d.key)}
                  className={cn("flex min-h-[52px] min-w-[52px] shrink-0 flex-col items-center justify-center rounded-card px-2 text-[12px] font-bold capitalize transition-colors", active ? "bg-primary text-on-primary" : "bg-surface-2 text-on-variant")}
                >
                  <span>{d.isToday ? "Hoy" : d.weekday}</span>
                  <span className="text-[16px]">{d.day}</span>
                </button>
              );
            })}
          </div>

          {ofDay.length === 0 ? (
            <EmptyState compact tone="neutral" title="Sin citas este día" description="Las reservas que te hagan aparecerán aquí." />
          ) : (
            <motion.ul variants={reduce ? undefined : stagger()} initial="hidden" animate="show" className="flex flex-col gap-2">
              {ofDay.map((b) => {
                const tone = STATUS_TONE[b.status];
                const dur = bookingDuration(b);
                return (
                  <motion.li key={b.id} variants={reduce ? undefined : fadeUp} className="flex overflow-hidden rounded-card-lg border border-outline-variant bg-surface">
                    <span className={cn("w-1.5 shrink-0", tone.bar)} aria-hidden="true" />
                    <div className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3">
                      <div className="w-14 shrink-0">
                        <div className="font-display text-[17px] leading-none text-on">{bookingTime(b)}</div>
                        {dur && <div className="mt-0.5 text-[11px] text-on-variant">{dur} min</div>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[15px] font-bold text-on">{b.pets?.name ?? "Mascota"} · {b.business_services?.name ?? "Servicio"}</div>
                        <Tag tone={tone.tag} size="xs" className="mt-1">{STATUS_LABEL[b.status]}</Tag>
                      </div>
                      {b.status === "confirmed" && (
                        <Button size="sm" variant="tonal" onClick={() => setStatus(b, "completed")} loading={busy === b.id}>Completar</Button>
                      )}
                      {b.status === "requested" && (
                        <Button size="sm" variant="primary" onClick={() => setStatus(b, "confirmed")} loading={busy === b.id}>Confirmar</Button>
                      )}
                    </div>
                  </motion.li>
                );
              })}
            </motion.ul>
          )}
        </>
      )}
    </div>
  );
}
