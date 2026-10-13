import type { Booking, BookingStatus } from "@/types/db";
import type { ChipTone } from "@/components/ui/Chip";

export const STATUS_TONE: Record<BookingStatus, ChipTone> = {
  requested: "warn",
  confirmed: "info",
  completed: "ok",
  cancelled: "neutral",
  no_show: "neutral",
};

export function isUpcoming(b: Booking, now = Date.now()): boolean {
  if (b.status === "cancelled" || b.status === "completed" || b.status === "no_show") return false;
  const end = b.ends_at ? new Date(b.ends_at).getTime() : new Date(b.starts_at).getTime() + 60 * 60000;
  return end >= now;
}

export function canCancel(b: Booking): boolean {
  return (b.status === "requested" || b.status === "confirmed") && new Date(b.starts_at).getTime() > Date.now();
}

/** Código corto legible: PW-<fecha>-<4 chars del id> */
export function bookingCode(b: Booking): string {
  const d = new Date(b.starts_at);
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `PW-${ymd}-${b.id.replace(/-/g, "").slice(0, 4).toUpperCase()}`;
}

export function bookingTitle(b: Booking): string {
  return [b.business_services?.name ?? "Servicio", b.pets?.name].filter(Boolean).join(" · ");
}

export function bookingWhen(b: Booking): string {
  const d = new Date(b.starts_at);
  const date = d.toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short" }).replace(".", "");
  const time = d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
  return `${date} · ${time}`;
}

export function bookingWhenLong(b: Booking): string {
  const d = new Date(b.starts_at);
  const date = d.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" });
  const time = d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
  return `${date}, ${time}`;
}

/** Enlace a Google Calendar para una cita (adaptado de events.calendarLink) */
export function bookingCalendarLink(b: Booking): string {
  const fmt = (iso: string) => new Date(iso).toISOString().replace(/[-:]|\.\d{3}/g, "");
  const end = b.ends_at ?? new Date(new Date(b.starts_at).getTime() + 60 * 60000).toISOString();
  const name = b.businesses?.name ?? "Paw";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${bookingTitle(b)} en ${name}`,
    dates: `${fmt(b.starts_at)}/${fmt(end)}`,
    details: `Reserva hecha con Paw. Código ${bookingCode(b)}. Cancela gratis hasta 24 h antes.`,
    location: b.businesses?.address ?? name,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
