"use client";
import { useEffect, useRef, useState } from "react";
import { MapPinOff } from "lucide-react";
import { Map as MapLibreMap, Marker, LngLatBounds } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { cn } from "@/lib/utils";
import { MARKER_TONE_CLASS, markerTone, type ExploreBiz } from "./lib";

/**
 * Teselas vectoriales gratuitas de CARTO. Se usa una sola base (Positron) en
 * ambos temas porque todos sus colores se reescriben con los tokens.
 */
const BASE_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

/** Lee un token de color de tokens.css en tiempo de ejecución (sin hex en el componente). */
function token(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * Estilo propio con la paleta: fondo --color-bg, calles --color-map-road,
 * agua --color-map-water. Se aplica sobre las capas de la base según su
 * source-layer, así sobrevive a cambios menores del estilo de CARTO.
 */
function applyPalette(map: MapLibreMap) {
  const style = map.getStyle();
  if (!style?.layers) return;
  const c = {
    bg: token("--color-bg"),
    border: token("--color-map-road"),
    water: token("--color-map-water"),
    block: token("--color-surface-elevated"),
    label: token("--color-text-secondary"),
  };
  if (!c.bg) return;

  const set = (id: string, prop: Parameters<MapLibreMap["setPaintProperty"]>[1], value: string | number) => {
    try {
      map.setPaintProperty(id, prop, value);
    } catch {
      /* propiedad no aplicable a la capa */
    }
  };

  for (const layer of style.layers) {
    const src = "source-layer" in layer ? layer["source-layer"] : undefined;
    switch (layer.type) {
      case "background":
        set(layer.id, "background-color", c.bg);
        break;
      case "fill":
        if (src === "water") {
          set(layer.id, "fill-color", c.water);
          if (layer.id.includes("shadow")) set(layer.id, "fill-opacity", 0);
        } else if (src === "building") {
          set(layer.id, "fill-color", c.block);
          if (layer.id === "building-top") set(layer.id, "fill-outline-color", c.border);
        } else if (src === "landcover" || src === "park") {
          set(layer.id, "fill-color", c.block);
        } else {
          set(layer.id, "fill-color", c.bg);
        }
        break;
      case "line":
        set(layer.id, "line-color", src === "waterway" ? c.water : c.border);
        break;
      case "symbol":
        set(layer.id, "text-color", c.label);
        set(layer.id, "text-halo-color", c.bg);
        break;
    }
  }
}

function shortName(name: string): string {
  return name.length > 18 ? `${name.slice(0, 17)}…` : name;
}

export interface MapFocus {
  lat: number;
  lng: number;
  zoom?: number;
  key: number;
}

export interface MapViewProps {
  center: { lat: number; lng: number };
  user?: { lat: number; lng: number } | null;
  businesses: ExploreBiz[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** cambia de identidad para centrar el mapa */
  focus?: MapFocus | null;
  /** espacio superior ocupado por la cabecera (px) */
  topInset?: number;
  /** espacio inferior ocupado por la hoja (px) para centrar con desplazamiento */
  bottomInset?: number;
  className?: string;
}

/**
 * Mapa a pantalla completa con MapLibre y estilo de la paleta.
 * Mientras cargan el estilo y las teselas se muestra un skeleton que hace
 * fundido cruzado con el mapa (--duration-base).
 * Marcadores HTML con el color de módulo de su categoría (CATEGORY_MARKER).
 */
export default function MapView({ center, user, businesses, selectedId, onSelect, focus, topInset = 0, bottomInset = 0, className }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Map<string, { marker: Marker; el: HTMLButtonElement; dot: HTMLSpanElement; label: HTMLSpanElement }>>(new Map());
  const userMarkerRef = useRef<Marker | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const insetRef = useRef({ top: topInset, bottom: bottomInset });
  insetRef.current = { top: topInset, bottom: bottomInset };
  const [ready, setReady] = useState(false);
  // Sin WebGL2 (equipos viejos, modo ahorro) el mapa no puede iniciar: la lista sigue funcionando
  const [failed, setFailed] = useState(false);

  // Crear el mapa una sola vez
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let map: MapLibreMap;
    try {
      map = new MapLibreMap({
      container: containerRef.current,
      style: BASE_STYLE,
      center: [center.lng, center.lat],
      zoom: 14,
      attributionControl: { compact: true },
      pitchWithRotate: false,
      dragRotate: false,
      });
    } catch (err) {
      console.warn("[MapView] no se pudo iniciar el mapa:", err);
      setFailed(true);
      return;
    }
    map.touchZoomRotate.disableRotation();
    mapRef.current = map;
    const markers = markersRef.current;

    const paint = () => applyPalette(map);
    map.on("style.load", paint);
    map.once("load", () => setReady(true));

    // Tema: re-lee los tokens al cambiar data-theme o el esquema del sistema
    const onTheme = () => requestAnimationFrame(paint);
    const mo = new MutationObserver(onTheme);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", onTheme);

    return () => {
      mo.disconnect();
      mq.removeEventListener("change", onTheme);
      markers.forEach((m) => m.marker.remove());
      markers.clear();
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Punto del usuario
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!user) {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      return;
    }
    if (!userMarkerRef.current) {
      const el = document.createElement("div");
      el.className = "relative flex h-6 w-6 items-center justify-center";
      el.setAttribute("role", "img");
      el.setAttribute("aria-label", "Tu ubicación");
      el.innerHTML =
        '<span class="absolute inset-0 rounded-full bg-primary/25 animate-ping motion-reduce:hidden"></span><span class="relative h-4 w-4 rounded-full border-2 border-surface bg-primary shadow-2"></span>';
      userMarkerRef.current = new Marker({ element: el }).setLngLat([user.lng, user.lat]).addTo(map);
    } else {
      userMarkerRef.current.setLngLat([user.lng, user.lat]);
    }
  }, [user]);

  // Pines de negocios
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const keep = new Set<string>();
    for (const b of businesses) {
      if (b.lat == null || b.lng == null) continue;
      keep.add(b.id);
      const existing = markersRef.current.get(b.id);
      if (existing) {
        existing.marker.setLngLat([b.lng, b.lat]);
        continue;
      }
      // MapLibre posiciona el elemento del marcador con transform: el botón
      // va dentro para que su escala al presionar no lo desplace.
      const wrap = document.createElement("div");
      const el = document.createElement("button");
      el.type = "button";
      el.setAttribute("aria-label", b.name);
      el.dataset.tone = markerTone(b);
      const dot = document.createElement("span");
      dot.setAttribute("aria-hidden", "true");
      const label = document.createElement("span");
      label.textContent = shortName(b.name);
      el.append(dot, label);
      wrap.append(el);
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectRef.current(b.id);
      });
      const marker = new Marker({ element: wrap, anchor: "bottom", offset: [0, -4] }).setLngLat([b.lng, b.lat]).addTo(map);
      markersRef.current.set(b.id, { marker, el, dot, label });
    }
    markersRef.current.forEach((m, id) => {
      if (!keep.has(id)) {
        m.marker.remove();
        markersRef.current.delete(id);
      }
    });
    // Estilo de cada pin según categoría y selección (área táctil de 44 px con ::after)
    markersRef.current.forEach((m, id) => {
      const sel = id === selectedId;
      const tone = MARKER_TONE_CLASS[(m.el.dataset.tone as keyof typeof MARKER_TONE_CLASS) ?? "info"];
      m.el.className = cn(
        "pressable relative inline-flex min-h-9 items-center gap-2 whitespace-nowrap rounded-full border px-3 text-label font-semibold shadow-2",
        "after:absolute after:inset-x-0 after:-inset-y-1 after:content-['']",
        sel ? cn("scale-110", tone.selected) : "border-border bg-surface text-text"
      );
      m.el.setAttribute("aria-pressed", sel ? "true" : "false");
      m.dot.className = cn("h-2 w-2 shrink-0 rounded-full", tone.dot);
      m.marker.getElement().style.zIndex = sel ? "10" : "1";
    });
  }, [businesses, selectedId]);

  // Centrar
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focus) return;
    const { top, bottom } = insetRef.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    map.easeTo({
      center: [focus.lng, focus.lat],
      zoom: focus.zoom ?? Math.max(map.getZoom(), 14),
      offset: [0, (top - bottom) / 2],
      duration: reduce ? 0 : 450,
    });
  }, [focus]);

  // Ajustar a resultados cuando cambian y no hay selección
  useEffect(() => {
    const map = mapRef.current;
    if (!map || selectedId || businesses.length === 0) return;
    const pts = businesses.filter((b) => b.lat != null && b.lng != null);
    if (pts.length === 0) return;
    const bounds = new LngLatBounds();
    for (const p of pts) bounds.extend([p.lng as number, p.lat as number]);
    if (user) bounds.extend([user.lng, user.lat]);
    const { top, bottom } = insetRef.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    map.fitBounds(bounds, { padding: { top: top + 24, bottom: bottom + 24, left: 40, right: 40 }, maxZoom: 15.5, duration: reduce ? 0 : 500 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businesses]);

  // Reajustar tamaño si cambia el contenedor
  useEffect(() => {
    const map = mapRef.current;
    const el = containerRef.current;
    if (!map || !el) return;
    const ro = new ResizeObserver(() => map.resize());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className={cn("relative h-full w-full bg-bg", className)}>
      <div
        ref={containerRef}
        className={cn("h-full w-full transition-opacity duration-[var(--duration-base)] ease-[var(--ease-standard)]", ready ? "opacity-100" : "opacity-0")}
        role="region"
        aria-label="Mapa de lugares"
      />
      {failed ? (
        <div className="absolute inset-x-0 top-[30%] flex justify-center px-8 text-center">
          <div className="flex max-w-[280px] flex-col items-center gap-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-text">
              <MapPinOff size={24} aria-hidden="true" />
            </div>
            <p className="text-subtitle font-semibold text-text">El mapa no está disponible</p>
            <p className="text-small text-text-secondary">Este dispositivo no puede mostrarlo, pero puedes ver los lugares en la lista.</p>
          </div>
        </div>
      ) : (
      <MapSkeleton
        loading={!ready}
        className={cn("pointer-events-none transition-opacity duration-[var(--duration-base)] ease-[var(--ease-standard)]", ready ? "opacity-0" : "opacity-100")}
      />
      )}
    </div>
  );
}

/** Bloque skeleton que ocupa el área del mapa mientras cargan las teselas. */
export function MapSkeleton({ className, loading = true }: { className?: string; loading?: boolean }) {
  return (
    <div className={cn("skeleton absolute inset-0 rounded-none", className)} role="status" aria-live="polite" aria-hidden={!loading}>
      {loading && <span className="sr-only">Cargando mapa</span>}
    </div>
  );
}
