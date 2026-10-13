"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { fadeUp, stagger } from "@/lib/motion";
import { useStore } from "@/store";
import { useGeolocation } from "@/hooks/useGeolocation";
import { fetchNearbyBusinesses, fetchPopularBusinesses, isOpenNow } from "@/lib/api/businesses";
import { fetchUpcomingEvents } from "@/lib/api/events";
import { showToast } from "@/components/ui";
import type { PetEvent } from "@/types/db";
import { HomeHeader } from "./HomeHeader";
import { PromoBanner, DEFAULT_PROMO, type Promo } from "./PromoBanner";
import { PetSelectorRow } from "./PetSelectorRow";
import { TodayCard } from "./TodayCard";
import { CategoryGrid } from "./CategoryGrid";
import { NearbyCarousel, type NearbyCard } from "./NearbyCarousel";
import { NextEventRow } from "./NextEventRow";

export function HomeScreen({ userName, userAvatarUrl }: { userName: string; userAvatarUrl: string | null }) {
  const reduce = useReducedMotion();
  const { pets, selectedPetId, selectPet } = useStore();
  const { lat, lng } = useGeolocation();
  const [nearby, setNearby] = useState<NearbyCard[] | null>(null);
  const [event, setEvent] = useState<PetEvent | null>(null);
  const [eventLoading, setEventLoading] = useState(true);
  const [petsSettled, setPetsSettled] = useState(false);
  const toasted = useRef(false);

  // El store carga las mascotas en PetsLoader; si tarda, dejamos de mostrar esqueleto a los 4 s
  useEffect(() => {
    if (pets.length > 0) {
      setPetsSettled(true);
      return;
    }
    const t = setTimeout(() => setPetsSettled(true), 4000);
    return () => clearTimeout(t);
  }, [pets.length]);

  const activePet = pets.find((p) => p.id === selectedPetId) ?? pets[0] ?? null;

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
        if (!cancelled) {
          setNearby([]);
          if (!toasted.current) {
            toasted.current = true;
            showToast("No pudimos cargar los negocios cercanos", undefined, "error");
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  useEffect(() => {
    let cancelled = false;
    fetchUpcomingEvents({ limit: 1 })
      .then((rows) => {
        if (!cancelled) setEvent(rows[0] ?? null);
      })
      .catch(() => {
        /* sección vacía silenciosa */
      })
      .finally(() => {
        if (!cancelled) setEventLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const promoBiz = nearby?.find((b) => b.promo_text);
  const promo: Promo = promoBiz && promoBiz.promo_text ? { title: promoBiz.promo_text, subtitle: `En ${promoBiz.name}` } : DEFAULT_PROMO;

  const container = reduce ? undefined : stagger(0.05);
  const item = reduce ? undefined : fadeUp;

  return (
    <div className="pb-6">
      <HomeHeader userName={userName} userAvatarUrl={userAvatarUrl} />
      <motion.div className="flex flex-col gap-6 pt-2" variants={container} initial={reduce ? false : "hidden"} animate="show">
        <motion.div variants={item} className="px-4">
          <PromoBanner promo={promo} />
        </motion.div>
        <motion.div variants={item}>
          <PetSelectorRow pets={pets} activeId={activePet?.id ?? null} onSelect={selectPet} loading={!petsSettled && pets.length === 0} />
        </motion.div>
        <motion.div variants={item}>
          <TodayCard pet={activePet} />
        </motion.div>
        <motion.div variants={item}>
          <CategoryGrid />
        </motion.div>
        <motion.div variants={item}>
          <NearbyCarousel items={nearby} />
        </motion.div>
        <motion.div variants={item}>
          <NextEventRow event={event} loading={eventLoading} />
        </motion.div>
      </motion.div>
    </div>
  );
}
