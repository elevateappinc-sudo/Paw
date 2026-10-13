"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { MapPin, Plus } from "lucide-react";
import { Button, EmptyState, PageHeader, Skeleton, showToast } from "@/components/ui";
import { fetchNearbyLostPets } from "@/lib/api/lostPets";
import { DEFAULT_CENTER, useGeolocation } from "@/hooks/useGeolocation";
import { isMissingSchema } from "@/lib/api/schemaErrors";
import { fadeUp, stagger } from "@/lib/motion";
import type { NearbyLostPet } from "@/types/db";
import { LostPetCard } from "./LostPetCard";
import { SightingSheet } from "./SightingSheet";

export function NearbyLostList() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const geo = useGeolocation(true);
  const [items, setItems] = useState<NearbyLostPet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sighting, setSighting] = useState<NearbyLostPet | null>(null);
  const toasted = useRef(false);

  const lat = geo.lat ?? DEFAULT_CENTER.lat;
  const lng = geo.lng ?? DEFAULT_CENTER.lng;
  const usingDefault = geo.lat === null;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchNearbyLostPets(lat, lng, 5000);
      setItems(rows);
    } catch (e) {
      if (isMissingSchema(e)) {
        setItems([]);
        if (!toasted.current) {
          toasted.current = true;
          showToast("Las alertas de mascotas perdidas aún no están disponibles");
        }
      } else {
        setError("No pudimos cargar las alertas");
      }
    } finally {
      setLoading(false);
    }
  }, [lat, lng]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex min-h-dvh flex-col bg-bg pb-[max(24px,env(safe-area-inset-bottom))]">
      <PageHeader title="Mascotas perdidas" eyebrow={usingDefault ? `Cerca de ${DEFAULT_CENTER.label}` : "Cerca de ti"} back />
      <div className="flex items-center gap-2 px-4 pb-3">
        {usingDefault && (
          <Button variant="outline" size="sm" leading={<MapPin size={16} aria-hidden="true" />} onClick={geo.request} loading={geo.status === "loading"}>
            {geo.status === "denied" ? "Ubicación no permitida" : "Usar mi ubicación"}
          </Button>
        )}
        <Button variant="tonal" size="sm" className="ml-auto" leading={<Plus size={16} aria-hidden="true" />} onClick={() => router.push("/perdida/nueva")}>
          Reportar la mía
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3 px-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[196px] w-full rounded-card-lg" />
          ))}
        </div>
      ) : error ? (
        <EmptyState tone="danger" title="Algo salió mal" description={error} action={<Button full onClick={load}>Reintentar</Button>} />
      ) : items.length === 0 ? (
        <EmptyState title="No hay mascotas perdidas reportadas cerca" description="Cuando alguien reporte una en 5 km la verás aquí." />
      ) : (
        <motion.div variants={reduce ? undefined : stagger()} initial="hidden" animate="show" className="flex flex-col gap-3 px-4">
          {items.map((it) => (
            <motion.div key={it.id} variants={reduce ? undefined : fadeUp}>
              <LostPetCard item={it} onSighting={setSighting} />
            </motion.div>
          ))}
        </motion.div>
      )}

      <SightingSheet alertId={sighting?.id ?? null} petName={sighting?.pet_name ?? "la mascota"} onClose={() => setSighting(null)} />
    </div>
  );
}
