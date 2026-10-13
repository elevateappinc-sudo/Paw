"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Share2, PartyPopper, XCircle, Eye, MapPin, Check } from "lucide-react";
import { Button, Card, CardHeader, EmptyState, PageHeader, Skeleton, Tag, showToast } from "@/components/ui";
import { ensureEmergencyToken, resolveLostAlert } from "@/lib/api/lostPets";
import { fetchPet } from "@/lib/api/pets";
import { useAuthContext } from "@/contexts/AuthContext";
import { isMissingSchema } from "@/lib/api/schemaErrors";
import { dateTimeLabel, relativeTime } from "@/lib/relativeTime";
import { pop } from "@/lib/motion";
import { shareOrCopy } from "@/components/sos/sosData";
import type { LostPetAlert, PetRow } from "@/types/db";
import { buildPosterText, fetchAlert, fetchSightings, radiusKm, type Sighting } from "./lostData";

const STATUS_TAG: Record<LostPetAlert["status"], { tone: "danger" | "ok" | "neutral"; label: string }> = {
  active: { tone: "danger", label: "Alerta activa" },
  found: { tone: "ok", label: "Encontrada" },
  cancelled: { tone: "neutral", label: "Cancelada" },
};

export function LostAlertStatus({ alertId }: { alertId: string }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const { user } = useAuthContext();
  const [alert, setAlert] = useState<LostPetAlert | null>(null);
  const [pet, setPet] = useState<PetRow | null>(null);
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [resolving, setResolving] = useState<"found" | "cancelled" | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const a = await fetchAlert(alertId);
      if (!a) {
        setError("Esta alerta no existe o no tienes acceso.");
        return;
      }
      setAlert(a);
      const [p, s] = await Promise.all([fetchPet(a.pet_id).catch(() => null), fetchSightings(a.id).catch(() => [] as Sighting[])]);
      setPet(p);
      setSightings(s);
    } catch (e) {
      setError(isMissingSchema(e) ? "Las alertas aún no están disponibles." : "No pudimos cargar la alerta.");
    } finally {
      setLoading(false);
    }
  }, [alertId]);

  useEffect(() => {
    void load();
  }, [load]);

  const petName = pet?.name ?? "tu mascota";
  const isOwner = !!user && !!alert && alert.user_id === user.id;

  async function share() {
    if (!alert || !user) return;
    setSharing(true);
    try {
      const token = await ensureEmergencyToken(alert.pet_id, user.id);
      const url = `${window.location.origin}/e/${token}`;
      const text = buildPosterText({ petName, breed: pet?.breed, address: alert.address, message: alert.message, phone: alert.contact_phone, reward: alert.reward ? Number(alert.reward) : null, url });
      const r = await shareOrCopy({ title: `Se busca: ${petName}`, text });
      if (r === "copied") showToast("Cartel copiado, pégalo donde quieras", undefined, "success");
      if (r === "failed") showToast("No se pudo compartir", undefined, "error");
    } catch {
      showToast("No pudimos generar el cartel", undefined, "error");
    } finally {
      setSharing(false);
    }
  }

  async function resolve(status: "found" | "cancelled") {
    if (!alert) return;
    setResolving(status);
    try {
      await resolveLostAlert(alert.id, status);
      setAlert({ ...alert, status, resolved_at: new Date().toISOString() });
      if (status === "found") {
        setCelebrate(true);
        setTimeout(() => setCelebrate(false), 2200);
      } else {
        showToast("Alerta cancelada");
      }
    } catch {
      showToast("No pudimos actualizar la alerta", () => void resolve(status), "error");
    } finally {
      setResolving(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh flex-col bg-bg">
        <PageHeader title="Alerta" back />
        <div className="flex flex-col gap-3 px-4">
          <Skeleton className="h-[150px] rounded-card-lg" />
          <Skeleton className="h-[52px] rounded-full" />
          <Skeleton className="h-[180px] rounded-card-lg" />
        </div>
      </div>
    );
  }

  if (error || !alert) {
    return (
      <div className="flex min-h-dvh flex-col bg-bg">
        <PageHeader title="Alerta" back />
        <EmptyState tone="danger" title="No encontramos la alerta" description={error ?? undefined} action={<Button full onClick={load}>Reintentar</Button>} secondary={<button type="button" onClick={() => router.push("/perdida")}>Ver alertas cerca</button>} />
      </div>
    );
  }

  const tag = STATUS_TAG[alert.status];

  return (
    <div className="relative flex min-h-dvh flex-col bg-bg pb-[max(24px,env(safe-area-inset-bottom))]">
      <PageHeader title={petName} eyebrow="Mascota perdida" back backHref="/home" />
      <div className="flex flex-col gap-4 px-4">
        <Card tone={alert.status === "active" ? "danger" : alert.status === "found" ? "primary" : "container"} elevation={0}>
          <div className="flex items-center gap-3">
            {alert.photo_url ?? pet?.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={(alert.photo_url ?? pet?.photo_url) as string} alt={petName} className="h-16 w-16 shrink-0 rounded-card object-cover" />
            ) : null}
            <div className="min-w-0 flex-1">
              <Tag tone={tag.tone}>{tag.label}</Tag>
              <div className="mt-1 font-display text-[18px] leading-tight">
                {alert.status === "active" ? `Alerta activa desde ${dateTimeLabel(alert.created_at)}` : alert.status === "found" ? `${petName} ya está en casa` : "Alerta cancelada"}
              </div>
              {alert.status === "active" && <p className="mt-0.5 text-[14px]">Avisamos a los usuarios de Paw en {radiusKm(alert.radius_m)}.</p>}
            </div>
          </div>
          {(alert.address || alert.message) && (
            <p className="mt-3 text-[14px]">
              {alert.address ? <span className="inline-flex items-center gap-1"><MapPin size={14} aria-hidden="true" /> {alert.address}</span> : null}
              {alert.address && alert.message ? " · " : ""}
              {alert.message}
            </p>
          )}
        </Card>

        {alert.status === "active" && (
          <Button size="lg" full leading={<Share2 size={20} aria-hidden="true" />} onClick={share} loading={sharing} disabled={!user}>
            Compartir cartel
          </Button>
        )}

        <Card padded={false}>
          <CardHeader title="Avistamientos" subtitle={sightings.length ? `${sightings.length} aviso${sightings.length === 1 ? "" : "s"}` : "Aún nadie la ha visto"} className="px-4 pt-4 mb-0" />
          {sightings.length === 0 ? (
            <p className="px-4 pb-4 pt-2 text-[14px] text-on-variant">Cuando alguien toque “La vi” aparecerá aquí con su mensaje y ubicación.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-outline-variant">
              {sightings.map((s) => (
                <li key={s.id} className="flex gap-3 px-4 py-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-info-container text-info"><Eye size={18} aria-hidden="true" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-on-variant">{relativeTime(s.created_at)}</div>
                    <div className="text-[15px] text-on">{s.message ?? "Sin mensaje"}</div>
                    {s.lat !== null && s.lng !== null && (
                      <a className="mt-1 inline-flex items-center gap-1 text-[13px] font-bold text-primary" href={`https://www.google.com/maps?q=${s.lat},${s.lng}`} target="_blank" rel="noreferrer">
                        <MapPin size={13} aria-hidden="true" /> Ver en el mapa
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {alert.status === "active" && isOwner && (
          <div className="flex flex-col gap-2">
            <Button size="lg" full variant="primary" leading={<PartyPopper size={20} aria-hidden="true" />} onClick={() => resolve("found")} loading={resolving === "found"}>
              La encontré
            </Button>
            <Button full variant="ghost" leading={<XCircle size={18} aria-hidden="true" />} onClick={() => resolve("cancelled")} loading={resolving === "cancelled"}>
              Cancelar alerta
            </Button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {celebrate && (
          <motion.div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} aria-live="polite">
            <motion.div variants={reduce ? undefined : pop} initial="hidden" animate="show" className="flex flex-col items-center gap-3 rounded-sheet bg-surface px-8 py-6 shadow-3">
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-on-primary">
                <Check size={44} strokeWidth={3} aria-hidden="true" />
              </span>
              <div className="font-display text-[22px] text-on">¡{petName} está en casa!</div>
            </motion.div>
            {!reduce &&
              [0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <motion.span
                  key={i}
                  className={i % 2 ? "absolute h-3 w-3 rounded-full bg-primary" : "absolute h-3 w-3 rounded-full bg-warn"}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 0.6 }}
                  animate={{ x: Math.cos((i / 8) * Math.PI * 2) * 140, y: Math.sin((i / 8) * Math.PI * 2) * 140, opacity: 0, scale: 1.2 }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                />
              ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
