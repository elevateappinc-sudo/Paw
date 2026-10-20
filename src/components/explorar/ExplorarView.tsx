"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AlertCircle, Bell, LocateFixed, MapPin, SearchX, WifiOff } from "lucide-react";
import { Button, Chip, ChipRow, EmptyState, Input, showToast, SkeletonSwap } from "@/components/ui";
import { SOSButton } from "@/components/layout/SOSButton";
import { useGeolocation, DEFAULT_CENTER } from "@/hooks/useGeolocation";
import { useStore } from "@/store";
import { fetchNearbyBusinesses, fetchPopularBusinesses, searchBusinesses, isOpenNow } from "@/lib/api/businesses";
import { saveUserLocation } from "@/lib/api/lostPets";
import { fadeUp } from "@/lib/motion";
import type { BusinessCategory } from "@/types/db";
import { BusinessCard } from "./BusinessCard";
import { ResultsSheet, SHEET_COLLAPSED } from "./ResultsSheet";
import { LocationDeniedCard, LocationPromptCard } from "./LocationPrompt";
import { CategoryBar, DEFAULT_FILTERS, FiltersSheet, radiusLabel, type ExploreFilters } from "./FilterBars";
import { SearchField } from "./SearchField";
import { SkeletonBizRow } from "./ExplorarSkeleton";
import type { MapFocus } from "./MapView";
import {
  MAX_PINS,
  activeFilterCount,
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
  loading: () => <div className="skeleton h-full w-full rounded-none" aria-hidden="true" />,
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
  const [filters, setFilters] = useState<ExploreFilters>(DEFAULT_FILTERS);
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
  const [settled, setSettled] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [offline, setOffline] = useState(false);
  const [headerH, setHeaderH] = useState(0);
  const closeFilters = useCallback(() => setFiltersOpen(false), []);

  const searchRef = useRef<HTMLInputElement | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);
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

  // Alto de la cabecera: la hoja desplegada y el encuadre del mapa empiezan debajo
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setHeaderH(Math.round(el.getBoundingClientRect().height)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Sin conexión: estado propio y reintento automático al volver
  useEffect(() => {
    const update = () => {
      const off = !navigator.onLine;
      setOffline(off);
      if (!off) setReload((n) => n + 1);
    };
    setOffline(!navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
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
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
        setSettled(true);
      });
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
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
        setSettled(true);
      });
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
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
        setSettled(true);
      });
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
  const radiusEnabled = mode === "located";
  const filterCount = activeFilterCount(filters, radiusEnabled);
  const radiusText = radiusLabel(filters.radius);
  const title = loading
    ? "Buscando lugares…"
    : searchHits
    ? `${results.length} ${results.length === 1 ? "resultado" : "resultados"}`
    : mode === "located"
      ? `${results.length} ${results.length === 1 ? "lugar" : "lugares"} cerca`
      : `Populares en ${CITY}`;

  const notify = () => showToast(`Te avisaremos cuando haya ${categoryPlural(cat)} cerca de ti`, undefined, "success");
  const notifyButton = (
    <button type="button" className="pressable inline-flex min-h-11 items-center gap-2 px-2" onClick={notify}>
      <Bell size={16} aria-hidden="true" /> Avisarme
    </button>
  );
  const showAllCategories = cat ? (
    <Button full onClick={() => setCat(null)}>
      Ver todas las categorías
    </Button>
  ) : undefined;

  const waiting = results.length === 0 && !offline && (loading || !settled);
  let body: React.ReactNode;
  if (offline && results.length === 0) {
    body = (
      <EmptyState
        compact
        icon={<WifiOff size={24} aria-hidden="true" />}
        title="Sin conexión"
        description="Revisa tu internet. Buscaremos de nuevo apenas vuelvas a estar en línea."
        action={
          <Button full onClick={retry}>
            Reintentar
          </Button>
        }
      />
    );
  } else if (waiting) {
    body = null; // SkeletonSwap muestra el skeleton y hace el fundido cruzado
  } else if (error && results.length === 0) {
    body = (
      <EmptyState
        compact
        icon={<AlertCircle size={24} aria-hidden="true" />}
        title="No pudimos cargar los lugares"
        description={error}
        action={
          <Button full onClick={retry}>
            Reintentar
          </Button>
        }
      />
    );
  } else if (results.length === 0) {
    body = searchHits ? (
      <EmptyState
        compact
        icon={<SearchX size={24} aria-hidden="true" />}
        title="No encontramos nada"
        description={`Sin resultados para “${activeQuery}”. Prueba con otro nombre o barrio.`}
        action={
          <Button
            full
            onClick={() => {
              setQuery("");
              setZoneQuery("");
            }}
          >
            Limpiar búsqueda
          </Button>
        }
      />
    ) : mode === "located" ? (
      <EmptyState
        compact
        icon={<MapPin size={24} aria-hidden="true" />}
        title={`No hay ${categoryPlural(cat)} a menos de ${radiusText}`}
        description="Amplía el radio o pide que te avisemos cuando haya alguno cerca."
        action={
          filters.radius === 2000 ? (
            <Button full onClick={() => setFilters({ ...filters, radius: 5000 })}>
              Ampliar a 5 km
            </Button>
          ) : (
            showAllCategories
          )
        }
        secondary={notifyButton}
      />
    ) : (
      <EmptyState
        compact
        icon={<MapPin size={24} aria-hidden="true" />}
        title={`No hay ${categoryPlural(cat)} aún`}
        description="Estamos sumando lugares en tu ciudad."
        action={showAllCategories}
        secondary={notifyButton}
      />
    );
  } else {
    body = (
      <ul className="enter-soft-list flex flex-col gap-3" aria-label="Lugares">
        {results.map((b) => (
          <li key={b.id}>
            <BusinessCard
              biz={b}
              selected={b.id === selectedId}
              onFocus={onFocusCard}
              ref={(el) => {
                if (el) cardRefs.current.set(b.id, el);
                else cardRefs.current.delete(b.id);
              }}
            />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="fixed inset-x-0 top-0 bottom-0 mx-auto w-full max-w-[640px] overflow-hidden bg-bg">
      <div className="absolute inset-0">
        <MapView
          center={mapCenter}
          user={userPos}
          businesses={results}
          selectedId={selectedId}
          onSelect={onSelectPin}
          focus={focus}
          topInset={headerH}
          bottomInset={mode === "prompt" ? 0 : sheetInsetPx}
        />
      </div>

      {/* Cabecera: título de pantalla, SOS, búsqueda y una fila de categorías */}
      <header ref={headerRef} className="absolute inset-x-0 top-0 z-20 flex flex-col gap-3 bg-bg pb-3 pt-[max(16px,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between gap-3 px-4">
          <h1 className="truncate text-display font-semibold text-text">Explorar</h1>
          <SOSButton />
        </div>
        <div className="px-4">
          <SearchField
            ref={searchRef}
            value={query}
            onChange={(v) => {
              setQuery(v);
              if (v && mode === "prompt") setManualChosen(true);
            }}
            onSubmit={() => searchRef.current?.blur()}
          />
        </div>
        <CategoryBar value={cat} onChange={setCat} filterCount={filterCount} onOpenFilters={() => setFiltersOpen(true)} />
      </header>

      {/* Mi ubicación: sobre la hoja recogida */}
      {mode !== "prompt" && !expanded && (
        <button
          type="button"
          onClick={onMyLocation}
          aria-label="Centrar en mi ubicación"
          className="glass pressable absolute right-4 z-20 flex h-12 w-12 items-center justify-center rounded-full border border-border text-primary-text shadow-2"
          style={{ bottom: `calc(${SHEET_COLLAPSED * 100}dvh + var(--space-3))` }}
        >
          <LocateFixed size={22} aria-hidden="true" />
        </button>
      )}

      {/* Estado inicial: tarjeta de permiso, siempre sobre el menú flotante */}
      <AnimatePresence>
        {mode === "prompt" && (
          <motion.div
            key="prompt"
            variants={reduce ? undefined : fadeUp}
            initial="hidden"
            animate="show"
            exit="hidden"
            className="pointer-events-none absolute inset-x-0 z-20 px-4"
            style={{ bottom: "var(--content-bottom-padding)" }}
          >
            <LocationPromptCard onRequest={geo.request} onManual={() => setManualChosen(true)} loading={geo.status === "loading"} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hoja de resultados */}
      {mode !== "prompt" && (
        <ResultsSheet
          title={title}
          subtitle={mode === "located" && !searchHits ? `Hasta ${radiusText} de ti` : undefined}
          expanded={expanded}
          onExpandedChange={setExpanded}
          topInset={headerH}
        >
          {mode === "manual" && (
            <div className="mb-4 flex flex-col gap-3">
              {(geo.status === "denied" || geo.status === "unavailable") && (
                <LocationDeniedCard reason={geo.status} onContinue={() => setManualChosen(true)} onRetry={geo.status === "unavailable" ? geo.request : undefined} />
              )}
              {geo.status === "idle" && (
                <Button variant="secondary" size="sm" onClick={geo.request} leading={<LocateFixed size={16} aria-hidden="true" />} className="self-start">
                  Usar mi ubicación
                </Button>
              )}
              <Input
                label="Barrio o dirección"
                placeholder="Chapinero, Usaquén, Cedritos…"
                value={zoneQuery}
                onChange={(e) => setZoneQuery(e.target.value)}
                onBlur={() => zoneQuery.trim() && setZones(rememberZone(zoneQuery))}
                leading={<MapPin size={18} aria-hidden="true" />}
                autoComplete="off"
              />
              {zones.length > 0 && (
                <ChipRow>
                  {zones.map((z) => (
                    <Chip key={z} selected={zoneQuery.trim().toLowerCase() === z.toLowerCase()} onClick={() => setZoneQuery(z)}>
                      {z}
                    </Chip>
                  ))}
                </ChipRow>
              )}
            </div>
          )}
          <SkeletonSwap
            loading={waiting}
            label="Cargando lugares cercanos"
            skeleton={
              <div className="flex flex-col gap-3">
                <SkeletonBizRow />
                <SkeletonBizRow />
                <SkeletonBizRow />
              </div>
            }
          >
            {body}
          </SkeletonSwap>
        </ResultsSheet>
      )}

      <FiltersSheet open={filtersOpen} onClose={closeFilters} value={filters} onChange={setFilters} radiusEnabled={radiusEnabled} />
    </div>
  );
}
