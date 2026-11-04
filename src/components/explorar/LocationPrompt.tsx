"use client";
import { MapPin, Navigation, Search } from "lucide-react";
import { Button, Card } from "@/components/ui";

/** Tarjeta inicial: explica por qué pedimos la ubicación antes de pedirla. */
export function LocationPromptCard({ onRequest, onManual, loading }: { onRequest: () => void; onManual: () => void; loading?: boolean }) {
  return (
    <Card elevation={3} className="pointer-events-auto">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-primary-soft text-primary-text">
          <Navigation size={22} />
        </div>
        <div className="min-w-0">
          <h2 className="font-semibold text-subtitle leading-tight text-text">Para ordenar por distancia necesitamos tu ubicación</h2>
          <p className="mt-1 text-body leading-relaxed text-text-secondary">Solo la usamos mientras exploras. No la compartimos con nadie.</p>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2">
        <Button full onClick={onRequest} loading={loading} leading={<Navigation size={18} />}>
          Usar mi ubicación
        </Button>
        <Button full variant="secondary" onClick={onManual} leading={<Search size={18} />}>
          Buscar por barrio
        </Button>
      </div>
    </Card>
  );
}

/** Aviso cuando el permiso está denegado o no hay geolocalización. */
export function LocationDeniedCard({ reason, onContinue, onRetry }: { reason: "denied" | "unavailable"; onContinue: () => void; onRetry?: () => void }) {
  const title = reason === "denied" ? "No tenemos permiso para ver tu ubicación" : "No pudimos obtener tu ubicación";
  const body =
    reason === "denied"
      ? "Sin ubicación no podemos ordenar por distancia. Puedes activarla en Ajustes del teléfono, en Privacidad y ubicación, o seguir buscando por barrio."
      : "Revisa que el GPS esté activo o busca por barrio mientras tanto.";
  return (
    <Card tone="warn" elevation={0}>
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-surface text-warning-text">
          <MapPin size={22} />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-subtitle leading-tight">{title}</h3>
          <p className="mt-1 text-body leading-relaxed">{body}</p>
          {reason === "denied" && <p className="mt-2 text-small font-semibold">Activar en Ajustes → Privacidad → Ubicación → Paw</p>}
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Button variant="secondary" size="sm" onClick={onContinue}>
          Seguir sin ubicación
        </Button>
        {onRetry && (
          <Button variant="ghost" size="sm" onClick={onRetry}>
            Reintentar
          </Button>
        )}
      </div>
    </Card>
  );
}
