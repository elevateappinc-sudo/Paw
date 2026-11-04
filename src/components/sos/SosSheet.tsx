"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LocateFixed, MapPin, Share2, SearchX, WifiOff, X } from "lucide-react";
import { showToast } from "@/components/ui";
import { useActivePet } from "@/hooks/useActivePet";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useAuthContext } from "@/contexts/AuthContext";
import { ensureEmergencyToken } from "@/lib/api/lostPets";
import { ageLabel, SPECIES_LABEL } from "@/lib/api/pets";
import { isMissingSchema } from "@/lib/api/schemaErrors";
import { timeLabel } from "@/lib/relativeTime";
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

  const actions = [
    { label: "Otras", icon: MapPin, onClick: () => router.push("/explorar?cat=urgencias"), aria: "Ver otras urgencias cerca" },
    { label: "Compartir", icon: Share2, onClick: share, aria: "Compartir la ficha de emergencia", disabled: !pet || sharing },
    ...(pet ? [{ label: "Perdida", icon: SearchX, onClick: () => router.push(`/perdida/nueva?pet=${pet.id}`), aria: `Reportar a ${pet.name} como perdida` }] : []),
  ];

  return (
    <div className="enter flex min-h-dvh flex-col bg-bg pb-[max(24px,env(safe-area-inset-bottom))]" aria-labelledby="sos-title">
      {/* Barra superior: cerrar y, si aplica, estado sin conexión */}
      <div className="flex items-center justify-between px-4 pt-[max(16px,env(safe-area-inset-top))]">
        <button type="button" onClick={() => router.back()} aria-label="Cerrar" className="pressable flex h-11 w-11 items-center justify-center rounded-full bg-surface-elevated text-text">
          <X size={20} aria-hidden="true" />
        </button>
        {fromCache && dataAt && (
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-elevated px-3 py-1 text-label text-text-secondary">
            <WifiOff size={12} aria-hidden="true" /> Guardado {timeLabel(dataAt)}
          </span>
        )}
      </div>

      <h1 id="sos-title" className="mt-2 text-center text-display font-semibold text-text">
        Urgencia
      </h1>

      <div className="mt-4">
        <PetPicker pets={pets} activeId={pet?.id ?? null} onSelect={selectPet} />
      </div>

      <div className="mt-8 flex flex-col items-center">
        <EmergencyCallButton business={nearest} distance={nearestDistance} loading={emLoading} fromCache={fromCache} />
        {geo.status === "idle" && (
          <button type="button" onClick={geo.request} className="mt-1 inline-flex min-h-11 items-center gap-1 text-label font-semibold text-primary-text">
            <LocateFixed size={14} aria-hidden="true" /> Usar mi ubicación
          </button>
        )}
      </div>

      {/* Acciones secundarias: círculos con una palabra */}
      <div className="mt-6 flex justify-center gap-8">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <button key={a.label} type="button" onClick={a.onClick} disabled={a.disabled} aria-label={a.aria} className="pressable flex flex-col items-center gap-2 disabled:opacity-50">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-elevated text-text">
                <Icon size={22} aria-hidden="true" />
              </span>
              <span className="text-label font-semibold text-text-secondary">{a.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex flex-col gap-4 px-4">
        {pet ? (
          <>
            <PetEmergencyCard pet={pet} details={details} loading={detailsLoading} onSummary={summary} summaryLoading={summarizing} />
            <ContactsCard ownerName={details?.ownerName ?? null} contact={details?.pet?.emergency_contact} />
          </>
        ) : (
          <button type="button" onClick={() => router.push("/mascotas/nueva")} className="pressable flex min-h-16 items-center justify-center gap-2 rounded-lg border border-dashed border-border text-body font-semibold text-primary-text">
            Agrega una mascota para tener su ficha a mano
          </button>
        )}
        <p className="px-4 text-center text-small text-text-secondary">Si no respira, sangra mucho o convulsiona: llama y ve en camino.</p>
      </div>
    </div>
  );
}
