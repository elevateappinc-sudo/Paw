import type { Business, BusinessCategory, NearbyBusiness } from "@/types/db";
import { showToast } from "@/components/ui/Toast";

/** Negocio tal como lo pinta Explorar: ficha completa o fila de `nearby_businesses`. */
export type ExploreBiz = Pick<
  Business,
  | "id"
  | "name"
  | "type"
  | "categories"
  | "description"
  | "address"
  | "neighborhood"
  | "city"
  | "rating_avg"
  | "rating_count"
  | "price_from"
  | "price_level"
  | "verified"
  | "emergency_24h"
  | "writes_history"
  | "cover_url"
  | "logo_url"
  | "hours"
  | "promo_text"
  | "whatsapp"
  | "phone"
> & {
  lat: number | null;
  lng: number | null;
  distance_m?: number;
  is_open?: boolean;
};

export function fromNearby(b: NearbyBusiness): ExploreBiz {
  return b;
}

export function fromBusiness(b: Business, origin?: { lat: number; lng: number } | null): ExploreBiz {
  const distance_m = origin && b.lat != null && b.lng != null ? haversineM(origin.lat, origin.lng, b.lat, b.lng) : undefined;
  return { ...b, distance_m };
}

/** Distancia en metros entre dos coordenadas */
export function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export interface CategoryChip {
  id: BusinessCategory | "all";
  label: string;
}

export const CATEGORY_CHIPS: CategoryChip[] = [
  { id: "all", label: "Todo" },
  { id: "veterinaria", label: "Veterinarias" },
  { id: "urgencias", label: "Urgencias 24 h" },
  { id: "peluqueria", label: "Peluquería" },
  { id: "tienda", label: "Tiendas" },
  { id: "farmacia", label: "Farmacias" },
  { id: "entrenador", label: "Entrenadores" },
  { id: "paseador", label: "Paseadores" },
  { id: "guarderia", label: "Guarderías" },
  { id: "pet_friendly", label: "Pet friendly" },
];

export function isCategory(v: string | null): v is BusinessCategory {
  return !!v && CATEGORY_CHIPS.some((c) => c.id === v && c.id !== "all");
}

/** Nombre plural en minúsculas para "No hay {categoría} a menos de…" */
export function categoryPlural(cat: BusinessCategory | null): string {
  if (!cat) return "lugares";
  const label = CATEGORY_CHIPS.find((c) => c.id === cat)?.label ?? "lugares";
  return label.toLowerCase();
}

export const RADIUS_OPTIONS = [2000, 5000] as const;
export type RadiusM = (typeof RADIUS_OPTIONS)[number];

export const MAX_PINS = 50;

export const ZONE_KEY = "paw.zone";
export const ZONES_KEY = "paw.zones";

export function readZones(): string[] {
  try {
    const raw = localStorage.getItem(ZONES_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? arr.filter((z): z is string => typeof z === "string").slice(0, 6) : [];
  } catch {
    return [];
  }
}

export function rememberZone(zone: string): string[] {
  const z = zone.trim();
  if (!z) return readZones();
  const next = [z, ...readZones().filter((x) => x.toLowerCase() !== z.toLowerCase())].slice(0, 6);
  try {
    localStorage.setItem(ZONE_KEY, z);
    localStorage.setItem(ZONES_KEY, JSON.stringify(next));
  } catch {
    /* almacenamiento no disponible */
  }
  return next;
}

/** Mensaje de error amable; distingue tablas o funciones que aún no existen en el remoto. */
export function friendlyError(e: unknown): string {
  const msg = e instanceof Error ? e.message : typeof e === "object" && e && "message" in e ? String((e as { message: unknown }).message) : "";
  const code = typeof e === "object" && e && "code" in e ? String((e as { code: unknown }).code) : "";
  if (code === "42P01" || code === "42883" || code === "PGRST202" || /does not exist|not find the function|schema cache/i.test(msg)) {
    return "Esta sección aún no está disponible. Vuelve a intentarlo más tarde.";
  }
  if (/fetch|network|failed to fetch/i.test(msg)) return "Sin conexión. Revisa tu internet e inténtalo de nuevo.";
  return "No pudimos cargar los datos. Inténtalo de nuevo.";
}

const shown = new Set<string>();

/** Muestra un toast una sola vez por clave durante la sesión. */
export function toastOnce(key: string, msg: string, retry?: () => void) {
  if (shown.has(key)) return;
  shown.add(key);
  showToast(msg, retry, "error");
}

export function formatDayShort(d: Date): { dow: string; day: string } {
  return {
    dow: d.toLocaleDateString("es-CO", { weekday: "short" }).replace(".", ""),
    day: String(d.getDate()),
  };
}

export function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

export function relativeDays(iso: string): string {
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diff <= 0) return "hoy";
  if (diff === 1) return "hace 1 día";
  if (diff < 30) return `hace ${diff} días`;
  const months = Math.round(diff / 30);
  if (months < 12) return `hace ${months} ${months === 1 ? "mes" : "meses"}`;
  const years = Math.round(diff / 365);
  return `hace ${years} ${years === 1 ? "año" : "años"}`;
}

export function whatsappLink(num: string | null | undefined, text?: string): string | null {
  if (!num) return null;
  const digits = num.replace(/[^\d]/g, "");
  if (!digits) return null;
  const q = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${digits}${q}`;
}

export function directionsLink(lat: number | null | undefined, lng: number | null | undefined, address?: string | null): string | null {
  if (lat != null && lng != null) return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  if (address) return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
  return null;
}
