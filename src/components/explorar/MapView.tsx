"use client";
import { useEffect, useRef } from "react";
import { Map as MapLibreMap, Marker, LngLatBounds } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { ExploreBiz } from "./lib";

const LIGHT_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
const DARK_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

function isDark(): boolean {
  if (typeof document === "undefined") return false;
  const t = document.documentElement.dataset.theme;
  if (t === "dark") return true;
  if (t === "light") return false;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
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
  /** espacio inferior ocupado por la hoja (px) para centrar con desplazamiento */
  bottomInset?: number;
  className?: string;
}

/**
 * Mapa a pantalla completa con MapLibre (vector gratuito de CARTO).
 * Pines como marcadores HTML; el seleccionado en acento.
 */
export default function MapView({ center, user, businesses, selectedId, onSelect, focus, bottomInset = 0, className }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Map<string, { marker: Marker; el: HTMLButtonElement }>>(new Map());
  const userMarkerRef = useRef<Marker | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const insetRef = useRef(bottomInset);
  insetRef.current = bottomInset;

  // Crear el mapa una sola vez
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new MapLibreMap({
      container: containerRef.current,
      style: isDark() ? DARK_STYLE : LIGHT_STYLE,
      center: [center.lng, center.lat],
      zoom: 14,
      attributionControl: { compact: true },
      pitchWithRotate: false,
      dragRotate: false,
    });
    map.touchZoomRotate.disableRotation();
    mapRef.current = map;

    // Tema: observa data-theme y el esquema del sistema
    const applyTheme = () => map.setStyle(isDark() ? DARK_STYLE : LIGHT_STYLE);
    const mo = new MutationObserver(applyTheme);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", applyTheme);

    return () => {
      mo.disconnect();
      mq.removeEventListener("change", applyTheme);
      markersRef.current.forEach((m) => m.marker.remove());
      markersRef.current.clear();
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Punto azul del usuario
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
      el.setAttribute("aria-label", "Tu ubicación");
      el.innerHTML =
        '<span class="absolute inset-0 rounded-full bg-info/25 animate-ping"></span><span class="relative h-4 w-4 rounded-full border-2 border-white bg-info shadow-2"></span>';
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
      const el = document.createElement("button");
      el.type = "button";
      el.setAttribute("aria-label", b.name);
      el.textContent = shortName(b.name);
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectRef.current(b.id);
      });
      const marker = new Marker({ element: el, anchor: "bottom", offset: [0, -4] }).setLngLat([b.lng, b.lat]).addTo(map);
      markersRef.current.set(b.id, { marker, el });
    }
    markersRef.current.forEach((m, id) => {
      if (!keep.has(id)) {
        m.marker.remove();
        markersRef.current.delete(id);
      }
    });
    // Estilo de cada pin según selección
    markersRef.current.forEach((m, id) => {
      const sel = id === selectedId;
      m.el.className = [
        "pointer-events-auto whitespace-nowrap rounded-full border px-2.5 py-1 text-[12px] font-extrabold shadow-2 transition-transform active:scale-95",
        sel ? "z-10 scale-110 border-primary bg-primary text-on-primary" : "border-outline-variant bg-surface text-on",
      ].join(" ");
      m.marker.getElement().style.zIndex = sel ? "10" : "1";
    });
  }, [businesses, selectedId]);

  // Centrar
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focus) return;
    map.easeTo({
      center: [focus.lng, focus.lat],
      zoom: focus.zoom ?? Math.max(map.getZoom(), 14),
      offset: [0, -insetRef.current / 2],
      duration: 450,
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
    map.fitBounds(bounds, { padding: { top: 180, bottom: insetRef.current + 24, left: 40, right: 40 }, maxZoom: 15.5, duration: 500 });
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

  return <div ref={containerRef} className={className ?? "h-full w-full"} role="region" aria-label="Mapa de lugares" />;
}
