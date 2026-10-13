"use client";
import { useCallback, useEffect, useState } from "react";

export type GeoStatus = "idle" | "loading" | "ready" | "denied" | "unavailable";

export interface GeoState {
  status: GeoStatus;
  lat: number | null;
  lng: number | null;
  request: () => void;
}

/** Centro por defecto: Chapinero, Bogotá (ciudad piloto) */
export const DEFAULT_CENTER = { lat: 4.6533, lng: -74.0567, label: "Chapinero" };

const KEY = "paw.geo";

/**
 * Ubicación del usuario. Pide permiso solo cuando se llama request()
 * (nunca al abrir la app). Recuerda la última posición en localStorage.
 */
export function useGeolocation(auto = false): GeoState {
  const [status, setStatus] = useState<GeoStatus>("idle");
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
      return raw ? (JSON.parse(raw) as { lat: number; lng: number }) : null;
    } catch {
      return null;
    }
  });

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const next = { lat: p.coords.latitude, lng: p.coords.longitude };
        setPos(next);
        setStatus("ready");
        try {
          localStorage.setItem(KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
      },
      (err) => {
        setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable");
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 }
    );
  }, []);

  useEffect(() => {
    if (!auto) return;
    if (typeof navigator !== "undefined" && "permissions" in navigator) {
      navigator.permissions
        .query({ name: "geolocation" as PermissionName })
        .then((r) => {
          if (r.state === "granted") request();
          else if (r.state === "denied") setStatus("denied");
        })
        .catch(() => {});
    }
  }, [auto, request]);

  return { status, lat: pos?.lat ?? null, lng: pos?.lng ?? null, request };
}
