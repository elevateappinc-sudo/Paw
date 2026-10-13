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
        <p className="text-[14px] text-on-variant">Este negocio aún no publicó sus servicios. Escríbele por WhatsApp para pedir precio.</p>
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
                className={cn("flex min-h-[56px] w-full items-start gap-3 rounded-control px-2 py-3 text-left transition-colors", selected ? "bg-primary-container/50" : "active:bg-surface-2")}
              >
                <span
                  aria-hidden="true"
                  className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2", selected ? "border-primary" : "border-outline")}
                >
                  {selected && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[16px] font-bold text-on">{s.name}</span>
                    {soon && petName && (
                      <Tag tone="primary" size="xs">
                        {petName} lo necesita
                      </Tag>
                    )}
                  </span>
                  <span className="mt-0.5 block text-[13px] text-on-variant">
                    {s.duration_min ? `${s.duration_min} min` : "Duración a convenir"}
                    {cycle && petName ? ` · completa el ciclo ${cycle.name} de ${petName}` : ""}
                  </span>
                </span>
                <span className="shrink-0 text-[15px] font-bold text-on">{s.price != null ? formatCurrency(s.price) : "Consultar"}</span>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}
