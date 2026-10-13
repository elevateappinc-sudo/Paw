"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { AlertTriangle, X, MapPin, Share2, SearchX } from "lucide-react";
import { Button, Card, Row, showToast } from "@/components/ui";
import { useActivePet } from "@/hooks/useActivePet";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useAuthContext } from "@/contexts/AuthContext";
import { ensureEmergencyToken } from "@/lib/api/lostPets";
import { ageLabel, SPECIES_LABEL } from "@/lib/api/pets";
import { isMissingSchema } from "@/lib/api/schemaErrors";
import { timeLabel } from "@/lib/relativeTime";
import { fadeUp, stagger } from "@/lib/motion";
import type { Business } from "@/types/db";
import { PetPicker } from "./PetPicker";
import { EmergencyCallButton } from "./EmergencyCallButton";
import { PetEmergencyCard } from "./PetEmergencyCard";
import { ContactsCard } from "./ContactsCard";
import { buildClinicalSummary, distanceM, loadEmergencies, loadSosPetDetails, readSosCache, shareOrCopy, writeSosCache, type SosPetDetails } from "./sosData";

/**
 * Hoja de urgencia a pantalla completa. Funciona sin conexión gracias a la
 * caché local de la última lista de urgencias.
 */
export function SosSheet() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const { user } = useAuthContext();
  const { pet, pets, selectPet } = useActivePet();
  const geo = useGeolocation(true);

  const [emergencies, setEmergencies] = useState<Business[]>([]);
  const [emLoading, setEmLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const [dataAt, setDataAt] = useState<Date | null>(null);
  const [details, setDetails] = useState<SosPetDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const toasted = useRef(false);

  // Urgencias: red → caché
  useEffect(() => {
    let cancelled = false;
    const cached = readSosCache();
    if (cached) {
      setEmergencies(cached.items);
      setDataAt(new Date(cached.at));
      setFromCache(true);
    }
    (async () => {
      setEmLoading(true);
      try {
        const items = await loadEmergencies(geo.lat, geo.lng);
        if (cancelled) return;
        const c = writeSosCache(items);
        setEmergencies(items);
        setDataAt(new Date(c.at));
        setFromCache(false);
      } catch (e) {
        if (cancelled) return;
        if (!cached && !toasted.current) {
          toasted.current = true;
          showToast(isMissingSchema(e) ? "El directorio de urgencias aún no está disponible" : "Sin conexión: mostrando datos guardados", undefined, "error");
        }
        setFromCache(true);
      } finally {
        if (!cancelled) setEmLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [geo.lat, geo.lng]);

  // Ficha de la mascota activa
  useEffect(() => {
    if (!pet) return;
    let cancelled = false;
    setDetailsLoading(true);
    loadSosPetDetails(pet.id)
      .then((d) => {
        if (!cancelled) setDetails(d);
      })
      .catch(() => {
        if (!cancelled) setDetails({ pet: null, medications: [], lastVaccine: null, ownerName: null });
      })
      .finally(() => {
        if (!cancelled) setDetailsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pet]);

  const nearest = emergencies[0] ?? null;
  const nearestDistance = useMemo(() => {
    if (!nearest || geo.lat === null || geo.lng === null || nearest.lat === null || nearest.lng === null) return null;
    return distanceM(geo.lat, geo.lng, nearest.lat, nearest.lng);
  }, [nearest, geo.lat, geo.lng]);

  const share = useCallback(async () => {
    if (!pet || !user) {
      showToast("Inicia sesión para compartir la ficha");
      return;
    }
    setSharing(true);
    try {
      const token = await ensureEmergencyToken(pet.id, user.id);
      const url = `${window.location.origin}/e/${token}`;
      const r = await shareOrCopy({ title: `Ficha de emergencia de ${pet.name}`, text: `Ficha de emergencia de ${pet.name} en Paw`, url });
      if (r === "copied") showToast("Enlace copiado", undefined, "success");
      if (r === "failed") showToast("No se pudo compartir", undefined, "error");
    } catch (e) {
      showToast(isMissingSchema(e) ? "La ficha pública aún no está disponible" : "No se pudo crear el enlace", undefined, "error");
    } finally {
      setSharing(false);
    }
  }, [pet, user]);

  const summary = useCallback(async () => {
    if (!details?.pet) return;
    setSummarizing(true);
    const text = buildClinicalSummary(details, { ageLabel: ageLabel(details.pet.birth_date), speciesLabel: SPECIES_LABEL[details.pet.species] });
    const r = await shareOrCopy({ title: `Resumen clínico de ${details.pet.name}`, text });
    if (r === "copied") showToast("Resumen copiado para pegar o enviar", undefined, "success");
    if (r === "failed") showToast("No se pudo compartir el resumen", undefined, "error");
    setSummarizing(false);
  }, [details]);

  const subtitle = `Funciona sin conexión${dataAt ? ` · datos de ${timeLabel(dataAt)}` : ""}`;

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <div className="h-[max(16px,env(safe-area-inset-top))] shrink-0" aria-hidden="true" />
      <motion.section
        initial={reduce ? { opacity: 0 } : { y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="mt-auto flex flex-1 flex-col rounded-t-sheet bg-surface shadow-3"
        aria-labelledby="sos-title"
      >
        <div className="flex justify-center pt-2 pb-1" aria-hidden="true">
          <div className="h-[5px] w-9 rounded-full bg-outline-variant" />
        </div>
        <header className="flex items-start justify-between gap-3 px-5 pb-2">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-danger-container text-danger">
              <AlertTriangle size={24} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h1 id="sos-title" className="font-display text-[26px] leading-tight text-on">Urgencia</h1>
              <p className="text-[13px] text-on-variant">{subtitle}</p>
            </div>
          </div>
          <button type="button" onClick={() => router.back()} aria-label="Cerrar" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-2 text-on active:scale-95">
            <X size={20} />
          </button>
        </header>

        <motion.div variants={stagger(0.05)} initial="hidden" animate="show" className="flex flex-col gap-4 px-5 pb-[max(24px,env(safe-area-inset-bottom))]">
          <motion.div variants={fadeUp}>
            <PetPicker pets={pets} activeId={pet?.id ?? null} onSelect={selectPet} />
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-col gap-2">
            <EmergencyCallButton business={nearest} distance={nearestDistance} loading={emLoading} fromCache={fromCache} />
            {geo.status === "idle" && (
              <button type="button" onClick={geo.request} className="flex min-h-[44px] items-center justify-center gap-1.5 text-[13px] font-semibold text-primary">
                <MapPin size={14} aria-hidden="true" /> Usar mi ubicación para la más cercana
              </button>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" leading={<SearchX size={18} aria-hidden="true" />} onClick={() => router.push("/explorar?cat=urgencias")}>
                Otra urgencia cerca
              </Button>
              <Button variant="secondary" leading={<Share2 size={18} aria-hidden="true" />} onClick={share} loading={sharing} disabled={!pet}>
                Compartir ficha
              </Button>
            </div>
          </motion.div>

          {pet ? (
            <>
              <motion.div variants={fadeUp}>
                <PetEmergencyCard pet={pet} details={details} loading={detailsLoading} onSummary={summary} summaryLoading={summarizing} />
              </motion.div>
              <motion.div variants={fadeUp}>
                <ContactsCard ownerName={details?.ownerName ?? null} contact={details?.pet?.emergency_contact} />
              </motion.div>
              <motion.div variants={fadeUp}>
                <Card padded={false}>
                  <Row icon={<SearchX size={20} aria-hidden="true" />} iconTone="warn" title={`Reportar a ${pet.name} como perdida`} subtitle="Avisamos a la comunidad Paw cerca de ti" onClick={() => router.push(`/perdida/nueva?pet=${pet.id}`)} />
                </Card>
              </motion.div>
            </>
          ) : (
            <motion.div variants={fadeUp}>
              <Card tone="container">
                <div className="text-[15px] font-bold text-on">Aún no tienes mascotas en Paw</div>
                <p className="mt-1 text-[13px] text-on-variant">Agrega una para tener su ficha de emergencia a mano.</p>
                <Button variant="tonal" className="mt-3" onClick={() => router.push("/mascotas/nueva")}>Agregar mascota</Button>
              </Card>
            </motion.div>
          )}

          <motion.p variants={fadeUp} className="px-1 text-center text-[13px] font-semibold text-on-variant">
            Si no puede respirar, sangra mucho o convulsiona, llama primero y ve en camino.
          </motion.p>
        </motion.div>
      </motion.section>
    </div>
  );
}
