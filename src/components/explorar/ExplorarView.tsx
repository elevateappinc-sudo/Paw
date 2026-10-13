"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Bell, LocateFixed, MapPin } from "lucide-react";
import { Button, Chip, ChipRow, EmptyState, Input, showToast } from "@/components/ui";
import { SOSButton } from "@/components/layout/SOSButton";
import { useGeolocation, DEFAULT_CENTER } from "@/hooks/useGeolocation";
import { useStore } from "@/store";
import { fetchNearbyBusinesses, fetchPopularBusinesses, searchBusinesses, isOpenNow } from "@/lib/api/businesses";
import { saveUserLocation } from "@/lib/api/lostPets";
import { fadeUp, stagger } from "@/lib/motion";
import type { BusinessCategory } from "@/types/db";
import { BusinessCard } from "./BusinessCard";
import { ResultsSheet, SHEET_COLLAPSED } from "./ResultsSheet";
import { LocationDeniedCard, LocationPromptCard } from "./LocationPrompt";
import { CategoryChips, FilterChips, type ExploreFilters } from "./FilterBars";
import { SearchField } from "./SearchField";
import { SkeletonBizRow } from "./ExplorarSkeleton";
import type { MapFocus } from "./MapView";
import {
  MAX_PINS,
  categoryPlural,
  friendlyError,
  fromBusiness,
  fromNearby,
  isCategory,
  readZones,
  rememberZone,
  toastOnce,
  type ExploreBiz,
} from "./lib";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-map" aria-hidden="true" />,
});

type Mode = "prompt" | "manual" | "located";

const CITY = "Bogotá";

function applyClientFilters(list: ExploreBiz[], cat: BusinessCategory | null, f: ExploreFilters): ExploreBiz[] {
  let out = list;
  if (cat) out = out.filter((b) => b.type === cat || (b.categories ?? []).includes(cat));
  if (f.minRating) out = out.filter((b) => b.rating_avg >= 4.5);
  if (f.openNow) out = out.filter((b) => b.emergency_24h || (b.is_open ?? isOpenNow(b.hours, b.emergency_24h)));
  return out;
}

function sortResults(list: ExploreBiz[], sortPrice: boolean): ExploreBiz[] {
  const copy = [...list];
  if (sortPrice) {
    copy.sort((a, b) => (a.price_from ?? Number.POSITIVE_INFINITY) - (b.price_from ?? Number.POSITIVE_INFINITY));
  } else if (copy.every((b) => b.distance_m != null)) {
    copy.sort((a, b) => (a.distance_m as number) - (b.distance_m as number));
  }
  return copy.slice(0, MAX_PINS);
}

export function ExplorarView() {
  const router = useRouter();
  const sp = useSearchParams();
  const reduce = useReducedMotion();
  const geo = useGeolocation(true);
  const userId = useStore((s) => s.currentUserId);

  const catParam = sp.get("cat");
  const cat: BusinessCategory | null = isCategory(catParam) ? catParam : null;
  const setCat = useCallback(
    (c: BusinessCategory | null) => {
      router.replace(c ? `/explorar?cat=${c}` : "/explorar", { scroll: false });
    },
    [router]
  );

  const [manualChosen, setManualChosen] = useState(false);
  const [filters, setFilters] = useState<ExploreFilters>({ radius: 2000, minRating: false, sortPrice: false, openNow: false });
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [zoneQuery, setZoneQuery] = useState("");
  const [zones, setZones] = useState<string[]>([]);
  const [nearby, setNearby] = useState<ExploreBiz[]>([]);
  const [popular, setPopular] = useState<ExploreBiz[]>([]);
  const [searchHits, setSearchHits] = useState<ExploreBiz[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focus, setFocus] = useState<MapFocus | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [reload, setReload] = useState(0);

  const searchRef = useRef<HTMLInputElement | null>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const savedLocRef = useRef<string | null>(null);

  const userPos = geo.status === "ready" && geo.lat != null && geo.lng != null ? { lat: geo.lat, lng: geo.lng } : null;
  const mode: Mode = geo.status === "ready" ? "located" : geo.status === "denied" || geo.status === "unavailable" || manualChosen ? "manual" : "prompt";

  // ?buscar=1 enfoca el campo
  useEffect(() => {
    if (sp.get("buscar") === "1") {
      const t = setTimeout(() => searchRef.current?.focus(), 350);
      return () => clearTimeout(t);
    }
  }, [sp]);

  useEffect(() => {
    setZones(readZones());
  }, []);

  // Debounce de la búsqueda
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Búsqueda por texto (campo inferior o barrio)
  const activeQuery = debounced.length >= 2 ? debounced : zoneQuery.trim().length >= 2 ? zoneQuery.trim() : "";
  useEffect(() => {
    if (!activeQuery) {
      setSearchHits(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    searchBusinesses(activeQuery, 30)
      .then((rows) => {
        if (cancelled) return;
        setSearchHits(rows.map((b) => fromBusiness(b, userPos)));
      })
      .catch((e) => {
        if (cancelled) return;
        const msg = friendlyError(e);
        setError(msg);
        toastOnce("explorar.search", msg);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeQuery, reload]);

  // Cercanos por RPC cuando hay ubicación
  useEffect(() => {
    if (mode !== "located" || !userPos) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchNearbyBusinesses({
      lat: userPos.lat,
      lng: userPos.lng,
      radiusM: filters.radius,
      categories: cat ? [cat] : undefined,
      openNow: filters.openNow,
      minRating: filters.minRating ? 4.5 : undefined,
      limit: MAX_PINS,
    })
      .then((rows) => {
        if (cancelled) return;
        setNearby(rows.map(fromNearby));
        const zone = rows[0]?.neighborhood;
        if (zone) setZones(rememberZone(zone));
        // ubicación del usuario (best effort, una vez por posición)
        const key = `${userPos.lat.toFixed(4)},${userPos.lng.toFixed(4)}`;
        if (userId && savedLocRef.current !== key) {
          savedLocRef.current = key;
          saveUserLocation(userId, userPos.lat, userPos.lng, rows[0]?.city ?? CITY, zone ?? undefined).catch(() => {});
        }
      })
      .catch((e) => {
        if (cancelled) return;
        const msg = friendlyError(e);
        setError(msg);
        setNearby([]);
        toastOnce("explorar.nearby", msg);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, userPos?.lat, userPos?.lng, filters.radius, filters.openNow, filters.minRating, cat, userId, reload]);

  // Populares sin ubicación
  useEffect(() => {
    if (mode !== "manual") return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPopularBusinesses(CITY, 30)
      .then((rows) => !cancelled && setPopular(rows.map((b) => fromBusiness(b, null))))
      .catch((e) => {
        if (cancelled) return;
        const msg = friendlyError(e);
        setError(msg);
        toastOnce("explorar.popular", msg);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [mode, reload]);

  // Lista final
  const results = useMemo(() => {
    if (searchHits) return sortResults(applyClientFilters(searchHits, cat, filters), filters.sortPrice);
    if (mode === "located") return sortResults(nearby, filters.sortPrice);
    if (mode === "manual") return sortResults(applyClientFilters(popular, cat, filters), filters.sortPrice);
    return [];
  }, [searchHits, mode, nearby, popular, cat, filters]);

  const mapCenter = userPos ?? { lat: DEFAULT_CENTER.lat, lng: DEFAULT_CENTER.lng };

  const onSelectPin = useCallback((id: string) => {
    setSelectedId(id);
    setExpanded(false);
    const el = cardRefs.current.get(id);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  const onFocusCard = useCallback((b: ExploreBiz) => {
    setSelectedId(b.id);
    if (b.lat != null && b.lng != null) setFocus({ lat: b.lat, lng: b.lng, zoom: 15.5, key: Date.now() });
  }, []);

  const onMyLocation = () => {
    if (geo.status === "ready" && userPos) {
      setSelectedId(null);
      setFocus({ lat: userPos.lat, lng: userPos.lng, zoom: 15, key: Date.now() });
    } else {
      geo.request();
    }
  };

  const retry = () => setReload((n) => n + 1);

  const sheetInsetPx = typeof window !== "undefined" ? Math.round(window.innerHeight * SHEET_COLLAPSED) : 360;
  const radiusLabel = filters.radius === 2000 ? "2 km" : "5 km";
  const title = loading
    ? "Buscando lugares…"
    : searchHits
    ? `${results.length} ${results.length === 1 ? "resultado" : "resultados"}`
    : mode === "located"
      ? `${results.length} ${results.length === 1 ? "lugar" : "lugares"} cerca`
      : `Populares en ${CITY}`;

  const listVariants = reduce ? undefined : stagger(0.03);
  const itemVariants = reduce ? undefined : fadeUp;

  return (
    <div className="fixed inset-x-0 top-0 bottom-0 mx-auto w-full max-w-[640px] overflow-hidden bg-map">
      <div className="absolute inset-0">
        <MapView
          center={mapCenter}
          user={userPos}
          businesses={results}
          selectedId={selectedId}
          onSelect={onSelectPin}
          focus={focus}
          bottomInset={mode === "prompt" ? 0 : sheetInsetPx}
        />
      </div>

      {/* Cabecera en vidrio */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col gap-2 pb-3 pt-[max(12px,env(safe-area-inset-top))]">
        <div className="pointer-events-auto flex items-center justify-between px-4">
          <h1 className="glass rounded-full border border-outline-variant px-4 py-2 font-display text-[18px] leading-none text-on shadow-1">Explorar</h1>
          <SOSButton />
        </div>
        <div className="pointer-events-auto">
          <CategoryChips value={cat} onChange={setCat} />
        </div>
        <div className="pointer-events-auto">
          <FilterChips value={filters} onChange={setFilters} radiusEnabled={mode === "located"} />
        </div>
      </div>

      {/* Mi ubicación */}
      {mode !== "prompt" && (
        <button
          type="button"
          onClick={onMyLocation}
          aria-label="Centrar en mi ubicación"
          className="glass absolute right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full border border-outline-variant text-primary shadow-2 active:scale-95"
          style={{ bottom: `calc(${SHEET_COLLAPSED * 100}dvh + 12px)` }}
        >
          <LocateFixed size={24} />
        </button>
      )}

      {/* Estado inicial: tarjeta de permiso */}
      <AnimatePresence>
        {mode === "prompt" && (
          <motion.div
            key="prompt"
            variants={reduce ? undefined : fadeUp}
            initial="hidden"
            animate="show"
            exit="hidden"
            className="pointer-events-none absolute inset-x-0 z-20 px-4"
            style={{ bottom: "calc(100px + env(safe-area-inset-bottom))" }}
          >
            <LocationPromptCard onRequest={geo.request} onManual={() => setManualChosen(true)} loading={geo.status === "loading"} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hoja de resultados */}
      {mode !== "prompt" && (
        <ResultsSheet title={title} subtitle={mode === "located" && !searchHits ? `Hasta ${radiusLabel} de ti` : undefined} expanded={expanded} onExpandedChange={setExpanded}>
          {mode === "manual" && (
            <div className="mb-3 flex flex-col gap-3">
              {(geo.status === "denied" || geo.status === "unavailable") && (
                <LocationDeniedCard reason={geo.status} onContinue={() => setManualChosen(true)} onRetry={geo.status === "unavailable" ? geo.request : undefined} />
              )}
              {geo.status === "idle" && (
                <Button variant="tonal" size="sm" onClick={geo.request} leading={<LocateFixed size={16} />} className="self-start">
                  Usar mi ubicación
                </Button>
              )}
              <Input
                label="Barrio o dirección"
                placeholder="Chapinero, Usaquén, Cedritos…"
                value={zoneQuery}
                onChange={(e) => setZoneQuery(e.target.value)}
                onBlur={() => zoneQuery.trim() && setZones(rememberZone(zoneQuery))}
                leading={<MapPin size={18} />}
                autoComplete="off"
              />
              {zones.length > 0 && (
                <ChipRow className="-mx-0 px-0">
                  {zones.map((z) => (
                    <Chip key={z} selected={zoneQuery.trim().toLowerCase() === z.toLowerCase()} onClick={() => setZoneQuery(z)}>
                      {z}
                    </Chip>
                  ))}
                </ChipRow>
              )}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col gap-3" aria-busy="true">
              <SkeletonBizRow />
              <SkeletonBizRow />
              <SkeletonBizRow />
            </div>
          ) : error && results.length === 0 ? (
            <EmptyState compact tone="danger" title="No pudimos cargar los lugares" description={error} action={<Button full variant="secondary" onClick={retry}>Reintentar</Button>} />
          ) : results.length === 0 ? (
            searchHits ? (
              <EmptyState
                compact
                tone="neutral"
                title="No encontramos nada"
                description={`Sin resultados para “${activeQuery}”. Prueba con otro nombre o barrio.`}
                action={
                  <Button
                    full
                    variant="secondary"
                    onClick={() => {
                      setQuery("");
                      setZoneQuery("");
                    }}
                  >
                    Limpiar búsqueda
                  </Button>
                }
              />
            ) : (
              <EmptyState
                compact
                tone="neutral"
                title={mode === "located" ? `No hay ${categoryPlural(cat)} a menos de ${radiusLabel}` : `No hay ${categoryPlural(cat)} aún`}
                description={mode === "located" ? "Amplía el radio o pide que te avisemos cuando haya alguno cerca." : "Estamos sumando lugares en tu ciudad."}
                action={
                  mode === "located" && filters.radius === 2000 ? (
                    <Button full onClick={() => setFilters({ ...filters, radius: 5000 })}>
                      Ampliar a 5 km
                    </Button>
                  ) : undefined
                }
                secondary={
                  <button
                    type="button"
                    className="inline-flex min-h-[44px] items-center gap-1.5"
                    onClick={() => showToast(`Te avisaremos cuando haya ${categoryPlural(cat)} cerca de ti`, undefined, "success")}
                  >
                    <Bell size={16} /> Avisarme
                  </button>
                }
              />
            )
          ) : (
            <motion.ul variants={listVariants} initial="hidden" animate="show" className="flex flex-col gap-3" aria-label="Lugares">
              {results.map((b) => (
                <motion.li key={b.id} variants={itemVariants}>
                  <BusinessCard
                    biz={b}
                    selected={b.id === selectedId}
                    onFocus={onFocusCard}
                    ref={(el) => {
                      if (el) cardRefs.current.set(b.id, el);
                      else cardRefs.current.delete(b.id);
                    }}
                  />
                </motion.li>
              ))}
            </motion.ul>
          )}
        </ResultsSheet>
      )}

      {/* Buscador sobre la tab bar */}
      <div className="pointer-events-none absolute inset-x-0 z-40 px-4" style={{ bottom: "calc(84px + env(safe-area-inset-bottom))" }}>
        <SearchField
          ref={searchRef}
          value={query}
          onChange={(v) => {
            setQuery(v);
            if (v && mode === "prompt") setManualChosen(true);
          }}
          onSubmit={() => searchRef.current?.blur()}
          className="pointer-events-auto"
        />
      </div>
    </div>
  );
}
