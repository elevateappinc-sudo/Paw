"use client";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { fadeUp, stagger } from "@/lib/motion";
import { useStore } from "@/store";
import { useGeolocation } from "@/hooks/useGeolocation";
import { fetchNearbyBusinesses, fetchPopularBusinesses, isOpenNow } from "@/lib/api/businesses";
import { fetchUpcomingEvents } from "@/lib/api/events";
import { WeightSheet } from "@/components/pets/profile/WeightSheet";
import type { PetEvent } from "@/types/db";
import { HomeHeader } from "./HomeHeader";
import { PetHeroCarousel, PetHeroSkeleton } from "./PetHeroCarousel";
import { RecommendedVetCard, pickRecommended } from "./RecommendedVetCard";
import { TodayCard } from "./TodayCard";
import { CategoryGrid } from "./CategoryGrid";
import { NearbyCarousel, type NearbyCard } from "./NearbyCarousel";
import { NextEventRow } from "./NextEventRow";
import { RegistrarSheet } from "./RegistrarSheet";
import { HomeSectionError } from "./HomeSectionError";
import { PullToRefresh } from "@/components/ui";

export function HomeScreen({ userId, userName, userAvatarUrl }: { userId: string; userName: string; userAvatarUrl: string | null }) {
  const reduce = useReducedMotion();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { pets, selectedPetId, selectPet, fetchPets } = useStore();
  const { lat, lng } = useGeolocation();
  const [nearby, setNearby] = useState<NearbyCard[] | null>(null);
  const [nearbyError, setNearbyError] = useState(false);
  const [nearbyKey, setNearbyKey] = useState(0);
  const [event, setEvent] = useState<PetEvent | null>(null);
  const [eventLoading, setEventLoading] = useState(true);
  const [eventError, setEventError] = useState(false);
  const [eventKey, setEventKey] = useState(0);
  const [petsSettled, setPetsSettled] = useState(false);
  const [petsKey, setPetsKey] = useState(0);
  const [weighing, setWeighing] = useState(false);

  const registrarOpen = params.get("registrar") === "1";
  const closeRegistrar = useCallback(() => router.replace(pathname || "/home"), [router, pathname]);

  // El store carga las mascotas en PetsLoader; si a los 4 s no hay ninguna, mostramos error con reintento
  useEffect(() => {
    if (pets.length > 0) {
      setPetsSettled(true);
      return;
    }
    setPetsSettled(false);
    const t = setTimeout(() => setPetsSettled(true), 4000);
    return () => clearTimeout(t);
  }, [pets.length, petsKey]);

  const activePet = pets.find((p) => p.id === selectedPetId) ?? pets[0] ?? null;
  const petsLoading = !petsSettled && pets.length === 0;
  const petsFailed = petsSettled && pets.length === 0;

  useEffect(() => {
    let cancelled = false;
    const hasPos = lat !== null && lng !== null;
    (async () => {
      try {
        const rows: NearbyCard[] = hasPos
          ? (await fetchNearbyBusinesses({ lat, lng, limit: 10 })).map((b) => ({
              id: b.id,
              name: b.name,
              type: b.type,
              cover_url: b.cover_url,
              rating_avg: Number(b.rating_avg),
              rating_count: b.rating_count,
              distance_m: b.distance_m,
              price_from: b.price_from,
              is_open: b.is_open,
              emergency_24h: b.emergency_24h,
              promo_text: b.promo_text,
            }))
          : (await fetchPopularBusinesses(undefined, 10)).map((b) => ({
              id: b.id,
              name: b.name,
              type: b.type,
              cover_url: b.cover_url,
              rating_avg: Number(b.rating_avg),
              rating_count: b.rating_count,
              distance_m: null,
              price_from: b.price_from,
              is_open: isOpenNow(b.hours, b.emergency_24h),
              emergency_24h: b.emergency_24h,
              promo_text: b.promo_text,
            }));
        if (!cancelled) setNearby(rows);
      } catch {
        if (!cancelled) setNearbyError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lat, lng, nearbyKey]);

  useEffect(() => {
    let cancelled = false;
    fetchUpcomingEvents({ limit: 1 })
      .then((rows) => {
        if (!cancelled) setEvent(rows[0] ?? null);
      })
      .catch(() => {
        if (!cancelled) setEventError(true);
      })
      .finally(() => {
        if (!cancelled) setEventLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [eventKey]);

  function retryNearby() {
    setNearby(null);
    setNearbyError(false);
    setNearbyKey((k) => k + 1);
  }

  function retryEvent() {
    setEventError(false);
    setEventLoading(true);
    setEventKey((k) => k + 1);
  }

  function retryPets() {
    setPetsKey((k) => k + 1);
    void fetchPets();
  }


  const container = reduce ? undefined : stagger();
  const item = reduce ? undefined : fadeUp;

  return (
    <PullToRefresh onRefresh={async () => {
        retryNearby();
        retryEvent();
        await fetchPets();
      }}>
    <div>
      <HomeHeader userName={userName} userAvatarUrl={userAvatarUrl} petName={activePet?.name ?? null} />
      <motion.div className="enter-list flex flex-col gap-6 pt-2" variants={container} animate="show">
        {petsFailed ? (
          <motion.div variants={item} className="px-4">
            <HomeSectionError message="No pudimos cargar tus mascotas." onRetry={retryPets} />
          </motion.div>
        ) : (
          <>
            <motion.div variants={item}>
              {petsLoading ? <PetHeroSkeleton /> : <PetHeroCarousel pets={pets} activeId={activePet?.id ?? null} onSelect={selectPet} />}
            </motion.div>
            <motion.div variants={item}>
              <TodayCard pet={activePet} />
            </motion.div>
          </>
        )}
        <motion.div variants={item}>
          <CategoryGrid />
        </motion.div>
        <motion.div variants={item}>
          <RecommendedVetCard items={nearby} petName={activePet?.name ?? null} />
        </motion.div>
        <motion.div variants={item}>
          <NearbyCarousel items={nearby && nearby.filter((b) => b.id !== pickRecommended(nearby)?.id)} error={nearbyError} onRetry={retryNearby} />
        </motion.div>
        <motion.div variants={item}>
          <NextEventRow event={event} loading={eventLoading} error={eventError} onRetry={retryEvent} />
        </motion.div>
      </motion.div>

      <RegistrarSheet
        open={registrarOpen && !weighing}
        onClose={closeRegistrar}
        petId={activePet?.id ?? null}
        onWeight={() => {
          setWeighing(true);
          closeRegistrar();
        }}
      />
      {activePet && (
        <WeightSheet
          open={weighing}
          onClose={() => setWeighing(false)}
          petId={activePet.id}
          userId={userId}
          onSaved={(log) => {
            // Solo estado local: WeightSheet ya guardó el registro
            const weight = Number(log.weight_kg);
            useStore.setState((s) => ({ pets: s.pets.map((p) => (p.id === activePet.id ? { ...p, weight } : p)) }));
          }}
        />
      )}
    </div>
    </PullToRefresh>
  );
}
