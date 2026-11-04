"use client";
import { Card, CardHeader, Tag } from "@/components/ui";
import { cycleUrgency } from "@/lib/api/careCycles";
import type { BusinessService, CareCycle } from "@/types/db";
import { cn, formatCurrency } from "@/lib/utils";

export interface ServicesCardProps {
  services: BusinessService[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  cycles: CareCycle[];
  petName: string | null;
}

/** Ciclo activo que coincide con un servicio, si lo hay. */
export function matchCycle(service: BusinessService, cycles: CareCycle[]): CareCycle | null {
  if (!service.care_cycle_kind) return null;
  return cycles.find((c) => c.kind === service.care_cycle_kind) ?? null;
}

export function cycleNeedsSoon(c: CareCycle | null): boolean {
  if (!c) return false;
  const u = cycleUrgency(c);
  return u === "overdue" || u === "soon" || u === "upcoming";
}

export function ServicesCard({ services, selectedId, onSelect, cycles, petName }: ServicesCardProps) {
  return (
    <Card>
      <CardHeader title="Servicios y precios" subtitle={services.length ? "Elige uno para reservar" : undefined} />
      {services.length === 0 ? (
        <p className="text-body text-text-secondary">Este negocio aún no publicó sus servicios. Escríbele por WhatsApp para pedir precio.</p>
      ) : (
        <div role="radiogroup" aria-label="Servicios" className="-mx-2 flex flex-col">
          {services.map((s) => {
            const cycle = matchCycle(s, cycles);
            const soon = cycleNeedsSoon(cycle);
            const selected = s.id === selectedId;
            return (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onSelect(s.id)}
                className={cn("flex min-h-14 w-full items-start gap-3 rounded-md px-2 py-3 text-left transition-colors", selected ? "bg-primary-soft/50" : "active:bg-surface-elevated")}
              >
                <span
                  aria-hidden="true"
                  className={cn("mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2", selected ? "border-primary" : "border-text-secondary")}
                >
                  {selected && <span className="h-2 w-2 rounded-full bg-primary" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-subtitle font-semibold text-text">{s.name}</span>
                    {soon && petName && (
                      <Tag tone="primary" size="xs">
                        {petName} lo necesita
                      </Tag>
                    )}
                  </span>
                  <span className="mt-1 block text-small text-text-secondary">
                    {s.duration_min ? `${s.duration_min} min` : "Duración a convenir"}
                    {cycle && petName ? ` · completa el ciclo ${cycle.name} de ${petName}` : ""}
                  </span>
                </span>
                <span className="shrink-0 text-body font-semibold text-text">{s.price != null ? formatCurrency(s.price) : "Consultar"}</span>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}
