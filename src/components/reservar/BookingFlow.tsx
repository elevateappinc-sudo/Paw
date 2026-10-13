"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, ClipboardCheck, MessageCircle, X } from "lucide-react";
import { Button, Card, EmptyState, PetAvatarRing, Sheet, Skeleton, buttonVariants } from "@/components/ui";
import { useActivePet } from "@/hooks/useActivePet";
import { useStore } from "@/store";
import { fetchBusiness, fetchBusinessServices } from "@/lib/api/businesses";
import { availableSlots, createBooking, fetchBusinessBookings } from "@/lib/api/bookings";
import { fadeUp } from "@/lib/motion";
import { CARE_KIND_LABEL, type Business, type BusinessHours, type BusinessService } from "@/types/db";
import { cn, formatCurrency } from "@/lib/utils";
import { formatDayShort, friendlyError, whatsappLink } from "@/components/explorar/lib";

type Step = 0 | 1 | 2;
const STEPS = ["Servicio", "Mascota", "Fecha"] as const;
const DAY_KEYS: (keyof BusinessHours)[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function nextDays(n: number): Date[] {
  const out: Date[] = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let i = 0; i < n; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    out.push(d);
  }
  return out;
}

function shortCode(): string {
  return `PW-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function BookingFlow() {
  const router = useRouter();
  const sp = useSearchParams();
  const reduce = useReducedMotion();
  const businessId = sp.get("business");
  const serviceParam = sp.get("service");
  const { pet: activePet, pets } = useActivePet();
  const userId = useStore((s) => s.currentUserId);

  const [biz, setBiz] = useState<Business | null>(null);
  const [services, setServices] = useState<BusinessService[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(serviceParam);
  const [petId, setPetId] = useState<string | null>(null);
  const [step, setStep] = useState<Step>(serviceParam ? 1 : 0);
  const days = useMemo(() => nextDays(10), []);
  const [dateKey, setDateKey] = useState<string>(() => toDateKey(days[0]));
  const [time, setTime] = useState<string | null>(null);
  const [taken, setTaken] = useState<{ starts_at: string; ends_at: string | null }[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<{ reason: string; code: string } | null>(null);

  // Mascota por defecto
  useEffect(() => {
    if (petId) return;
    if (activePet) setPetId(activePet.id);
  }, [activePet, petId]);

  // Negocio y servicios
  useEffect(() => {
    if (!businessId) {
      setLoading(false);
      setLoadError("Falta el negocio de la reserva.");
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all([fetchBusiness(businessId), fetchBusinessServices(businessId)])
      .then(([b, s]) => {
        if (cancelled) return;
        setBiz(b);
        setServices(s);
        if (!b) setLoadError("No encontramos este negocio.");
      })
      .catch((e) => !cancelled && setLoadError(friendlyError(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  // Reservas del día elegido
  useEffect(() => {
    if (!businessId || step !== 2) return;
    let cancelled = false;
    setSlotsLoading(true);
    const from = new Date(`${dateKey}T00:00:00`).toISOString();
    const to = new Date(`${dateKey}T23:59:59`).toISOString();
    fetchBusinessBookings(businessId, from, to)
      .then((rows) => !cancelled && setTaken(rows.filter((r) => r.status !== "cancelled").map((r) => ({ starts_at: r.starts_at, ends_at: r.ends_at }))))
      .catch(() => !cancelled && setTaken([]))
      .finally(() => !cancelled && setSlotsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [businessId, dateKey, step]);

  const service = services.find((s) => s.id === serviceId) ?? null;
  const pet = pets.find((p) => p.id === petId) ?? null;
  const durationMin = service?.duration_min ?? 30;
  const dayHours = useMemo(() => {
    if (!biz) return undefined;
    const d = new Date(`${dateKey}T12:00:00`);
    const key = DAY_KEYS[d.getDay()];
    const h = biz.hours?.[key];
    if (h && h.length) return h;
    return biz.emergency_24h ? ([["00:00", "23:30"]] as [string, string][]) : undefined;
  }, [biz, dateKey]);
  const slots = useMemo(() => availableSlots({ date: dateKey, hours: dayHours, durationMin, taken }), [dateKey, dayHours, durationMin, taken]);

  const cycleName = service?.care_cycle_name ?? (service?.care_cycle_kind ? CARE_KIND_LABEL[service.care_cycle_kind] : null) ?? service?.name ?? "el servicio";
  const wa = whatsappLink(biz?.whatsapp ?? biz?.phone, `Hola, quiero reservar ${service?.name ?? "un servicio"}${pet ? ` para ${pet.name}` : ""}`);

  const goNext = useCallback(() => setStep((s) => (s < 2 ? ((s + 1) as Step) : s)), []);

  const confirm = async () => {
    if (!biz || !pet || !time || !userId) {
      setFailure({ reason: !userId ? "Necesitas iniciar sesión para reservar." : "Faltan datos de la reserva.", code: shortCode() });
      return;
    }
    setSubmitting(true);
    try {
      const starts = new Date(`${dateKey}T${time}:00`).toISOString();
      const created = await createBooking({
        business_id: biz.id,
        service_id: service?.id ?? null,
        pet_id: pet.id,
        user_id: userId,
        starts_at: starts,
        duration_min: service?.duration_min ?? null,
        price: service?.price ?? null,
      });
      router.replace(`/citas/${created.id}?nueva=1`);
    } catch (e) {
      setFailure({ reason: friendlyError(e), code: shortCode() });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDay = days.find((d) => toDateKey(d) === dateKey) ?? days[0];
  const dayLabel = formatDayShort(selectedDay);
  const stepTitle = step === 0 ? "Elige un servicio" : step === 1 ? "¿Para quién es?" : "Elige fecha y hora";

  if (loading) {
    return (
      <div className="min-h-dvh bg-bg px-4 pt-[max(14px,env(safe-area-inset-top))]" aria-busy="true">
        <Skeleton className="h-8 w-48" />
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Skeleton className="h-1.5 rounded-full" />
          <Skeleton className="h-1.5 rounded-full" />
          <Skeleton className="h-1.5 rounded-full" />
        </div>
        <Skeleton className="mt-6 h-16 w-full rounded-card-lg" />
        <Skeleton className="mt-3 h-16 w-full rounded-card-lg" />
        <Skeleton className="mt-3 h-16 w-full rounded-card-lg" />
      </div>
    );
  }

  if (loadError || !biz) {
    return (
      <div className="min-h-dvh bg-bg">
        <EmptyState
          tone="danger"
          title="No pudimos abrir la reserva"
          description={loadError ?? "Inténtalo de nuevo."}
          action={<Button full variant="secondary" onClick={() => router.push("/explorar")}>Ver otros negocios</Button>}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="flex items-center justify-between gap-3 px-4 pt-[max(14px,env(safe-area-inset-top))] pb-2">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-on-variant">{biz.name}</p>
          <h1 className="truncate font-display text-[24px] leading-tight text-on">{stepTitle}</h1>
        </div>
        <button type="button" onClick={() => router.back()} aria-label="Cerrar" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-2 text-on active:scale-95">
          <X size={20} />
        </button>
      </header>

      {/* Indicador de pasos */}
      <ol className="grid grid-cols-3 gap-2 px-4 pb-3" aria-label="Pasos">
        {STEPS.map((label, i) => {
          const state = i < step ? "done" : i === step ? "current" : "todo";
          return (
            <li key={label} aria-current={state === "current" ? "step" : undefined}>
              <button
                type="button"
                disabled={i > step}
                onClick={() => setStep(i as Step)}
                className="flex w-full flex-col gap-1.5 text-left disabled:cursor-default"
              >
                <span className={cn("h-1.5 w-full rounded-full", state === "todo" ? "bg-surface-3" : "bg-primary")} />
                <span className={cn("text-[12px] font-bold", state === "todo" ? "text-on-variant" : "text-on")}>{label}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="flex-1 px-4 pb-[calc(110px+env(safe-area-inset-bottom))]">
        <AnimatePresence mode="wait" initial={false}>
          {step === 0 && (
            <motion.div key="s0" variants={reduce ? undefined : fadeUp} initial="hidden" animate="show" exit="hidden">
              {services.length === 0 ? (
                <EmptyState
                  compact
                  tone="neutral"
                  title="Sin servicios publicados"
                  description="Pide tu cita por WhatsApp y el negocio te confirma."
                  action={
                    wa ? (
                      <a href={wa} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: "primary" }), "w-full")}>
                        <MessageCircle size={18} /> Reservar por WhatsApp
                      </a>
                    ) : undefined
                  }
                />
              ) : (
                <ul className="flex flex-col gap-2" role="radiogroup" aria-label="Servicios">
                  {services.map((s) => {
                    const sel = s.id === serviceId;
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={sel}
                          onClick={() => {
                            setServiceId(s.id);
                            setTime(null);
                            goNext();
                          }}
                          className={cn("flex min-h-[64px] w-full items-center gap-3 rounded-card-lg border bg-surface px-4 py-3 text-left", sel ? "border-primary" : "border-outline-variant")}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block text-[16px] font-bold text-on">{s.name}</span>
                            <span className="block text-[13px] text-on-variant">{s.duration_min ? `${s.duration_min} min` : "Duración a convenir"}</span>
                          </span>
                          <span className="shrink-0 text-[15px] font-bold text-on">{s.price != null ? formatCurrency(s.price) : "Consultar"}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="s1" variants={reduce ? undefined : fadeUp} initial="hidden" animate="show" exit="hidden">
              {pets.length === 0 ? (
                <EmptyState compact title="Aún no tienes mascotas" description="Crea el perfil de tu mascota para reservar a su nombre." action={<Button full onClick={() => router.push("/mascotas/nueva")}>Añadir mascota</Button>} />
              ) : (
                <div className="flex flex-wrap gap-4" role="radiogroup" aria-label="Mascota">
                  {pets.map((p) => {
                    const sel = p.id === petId;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        role="radio"
                        aria-checked={sel}
                        onClick={() => {
                          setPetId(p.id);
                          goNext();
                        }}
                        className="flex w-[84px] flex-col items-center gap-1.5 active:scale-95"
                      >
                        <PetAvatarRing pet={p} active={sel} size={76} />
                        <span className={cn("max-w-full truncate text-[14px] font-bold", sel ? "text-on" : "text-on-variant")}>{p.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" variants={reduce ? undefined : fadeUp} initial="hidden" animate="show" exit="hidden" className="flex flex-col gap-4">
              <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" role="radiogroup" aria-label="Día">
                {days.map((d) => {
                  const key = toDateKey(d);
                  const sel = key === dateKey;
                  const { dow, day } = formatDayShort(d);
                  return (
                    <button
                      key={key}
                      type="button"
                      role="radio"
                      aria-checked={sel}
                      onClick={() => {
                        setDateKey(key);
                        setTime(null);
                      }}
                      className={cn("flex h-[64px] w-[56px] shrink-0 flex-col items-center justify-center rounded-card border transition-colors", sel ? "border-primary bg-primary text-on-primary" : "border-outline-variant bg-surface text-on")}
                    >
                      <span className={cn("text-[11px] font-bold uppercase", sel ? "text-on-primary" : "text-on-variant")}>{dow}</span>
                      <span className="font-display text-[20px] leading-none">{day}</span>
                    </button>
                  );
                })}
              </div>

              {slotsLoading ? (
                <div className="grid grid-cols-4 gap-2" aria-busy="true">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-11 rounded-full" />
                  ))}
                </div>
              ) : slots.length === 0 ? (
                <Card tone="container" elevation={0}>
                  <p className="text-[15px] font-bold text-on">{dayHours ? "No quedan horas este día" : "Cerrado este día"}</p>
                  <p className="mt-1 text-[13px] text-on-variant">Prueba otro día o pide una hora al negocio.</p>
                  {wa && (
                    <a href={wa} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "mt-3")}>
                      <MessageCircle size={16} /> Pedir otra
                    </a>
                  )}
                </Card>
              ) : (
                <>
                  <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Hora">
                    {slots.map((s) => {
                      const sel = s.time === time;
                      return (
                        <button
                          key={s.time}
                          type="button"
                          role="radio"
                          aria-checked={sel}
                          disabled={!s.available}
                          onClick={() => setTime(s.time)}
                          className={cn(
                            "min-h-[44px] rounded-full border text-[14px] font-bold transition-colors",
                            sel ? "border-primary bg-primary text-on-primary" : s.available ? "border-outline-variant bg-surface text-on active:bg-surface-2" : "border-dashed border-outline-variant text-on-variant line-through"
                          )}
                        >
                          {s.time}
                        </button>
                      );
                    })}
                  </div>
                  {wa && (
                    <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center gap-1.5 self-start text-[14px] font-bold text-primary">
                      <MessageCircle size={16} /> ¿Ninguna te sirve? Pedir otra
                    </a>
                  )}
                </>
              )}

              <Card tone="info" elevation={0} className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-surface text-ok">
                  <ClipboardCheck size={20} />
                </div>
                <p className="text-[13px] leading-relaxed">
                  Al terminar, el negocio marca el servicio y en el historial de {pet?.name ?? "tu mascota"} queda {cycleName} con fecha, precio y foto. El gasto se registra solo.
                </p>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {step === 2 && (
        <div className="glass fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[640px] border-t border-outline-variant px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">
          <Button full size="lg" onClick={confirm} loading={submitting} disabled={!time || !pet} leading={<Check size={18} />}>
            {time ? `Confirmar ${dayLabel.dow} ${dayLabel.day} · ${time}${service?.price != null ? ` · ${formatCurrency(service.price)}` : ""}` : "Elige una hora"}
          </Button>
        </div>
      )}

      <Sheet
        open={!!failure}
        onClose={() => setFailure(null)}
        title="No pudimos confirmar la reserva"
        subtitle={failure?.reason}
        footer={
          <div className="flex flex-col gap-2">
            <Button full onClick={() => { setFailure(null); void confirm(); }}>
              Reintentar
            </Button>
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: "secondary" }), "w-full")}>
                <MessageCircle size={18} /> Reservar por WhatsApp
              </a>
            )}
            <Button full variant="ghost" onClick={() => router.push("/explorar")}>
              Ver otros negocios
            </Button>
          </div>
        }
      >
        <p className="text-[13px] text-on-variant">
          Si necesitas ayuda, indica este código: <span className="font-mono font-bold text-on">{failure?.code}</span>
        </p>
      </Sheet>
    </div>
  );
}
