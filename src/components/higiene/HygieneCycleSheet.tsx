"use client";
import { useEffect, useState } from "react";
import { Check, Pencil, Sparkles } from "lucide-react";
import { Sheet, Button, Input, InfoCell, Divider } from "@/components/ui";
import { intervalLabel, intervalToDays, updateCareCycle } from "@/lib/api/careCycles";
import type { CareCycle, CareCycleLog, IntervalUnit } from "@/types/db";
import { formatCurrency } from "@/lib/utils";
import { addDays, errorMessage, longDate, shortDate } from "@/components/salud/shared";
import { HYGIENE_ICON, hygieneStatus } from "./hygiene";

export function HygieneCycleSheet({ cycle, logs, businessNames, onClose, onMarkDone, onUpdated }: {
  cycle: CareCycle | null;
  logs: CareCycleLog[];
  businessNames: Record<string, string>;
  onClose: () => void;
  onMarkDone: (c: CareCycle) => void;
  onUpdated: (c: CareCycle) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [interval, setIntervalDays] = useState("");
  const [unit, setUnit] = useState<IntervalUnit>("days");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cycle) {
      setIntervalDays(String(cycle.interval_value ?? cycle.interval_days));
      setUnit(cycle.interval_value ? cycle.interval_unit : "days");
      setEditing(false);
      setError(null);
    }
  }, [cycle]);

  if (!cycle) return null;
  const Icon = HYGIENE_ICON[cycle.kind] ?? Sparkles;
  const status = hygieneStatus(cycle);
  const recent = logs.filter((l) => l.cycle_id === cycle.id).slice(0, 3);

  async function saveInterval() {
    if (!cycle) return;
    const n = Number(interval);
    if (!n || n < 1) return setError("Escribe un número mayor que 0.");
    setSaving(true);
    setError(null);
    try {
      const days = intervalToDays(n, unit);
      const next_due_at = cycle.last_done_at ? addDays(cycle.last_done_at, days) : cycle.next_due_at;
      const updated = await updateCareCycle(cycle.id, { interval_days: days, interval_value: n, interval_unit: unit, next_due_at });
      onUpdated(updated);
      setEditing(false);
    } catch (e) {
      setError(errorMessage(e, "No pudimos guardar. Intenta de nuevo."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet
      open={!!cycle}
      onClose={onClose}
      title={
        <span className="inline-flex items-center gap-2">
          <Icon size={22} className="text-primary" aria-hidden="true" />
          {cycle.name}
        </span>
      }
      subtitle={intervalLabel(cycle)}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" leading={<Pencil size={16} />} onClick={() => setEditing((v) => !v)}>
            Editar intervalo
          </Button>
          <Button className="flex-[2]" leading={<Check size={18} />} onClick={() => onMarkDone(cycle)}>
            Marcar como hecho
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <div className="grid grid-cols-2 gap-2">
          <InfoCell label="Próxima" value={status.label === "Vencido" || status.label === "Hoy" ? status.label : shortDate(cycle.next_due_at)} tone={status.tone === "danger" || status.tone === "warn" ? "warn" : undefined} />
          <InfoCell label="Última vez" value={cycle.last_done_at ? shortDate(cycle.last_done_at) : "Sin registro"} />
        </div>

        {editing && (
          <div className="flex flex-col gap-2 rounded-card bg-surface-2 p-3">
            <div className="grid grid-cols-[1fr_1fr] gap-2">
              <Input label="Se repite cada" type="number" inputMode="numeric" min={1} value={interval} onChange={(e) => setIntervalDays(e.target.value)} autoFocus />
              <label className="flex flex-col gap-1 text-[12px] font-semibold text-on-variant">
                Unidad
                <select value={unit} onChange={(e) => setUnit(e.target.value as IntervalUnit)} className="min-h-[44px] rounded-control border border-outline-variant bg-surface px-2 text-[15px] text-on outline-none focus:border-primary">
                  <option value="days">días</option>
                  <option value="weeks">semanas</option>
                  <option value="months">meses</option>
                </select>
              </label>
            </div>
            {error && <p role="alert" className="text-[13px] font-semibold text-danger">{error}</p>}
            <Button size="sm" onClick={() => void saveInterval()} loading={saving} className="self-end">Guardar</Button>
          </div>
        )}

        {cycle.notes && <p className="text-[14px] leading-relaxed text-on-variant">{cycle.notes}</p>}

        <div>
          <h4 className="mb-2 text-[13px] font-bold uppercase tracking-wide text-on-variant">Últimas veces</h4>
          {recent.length === 0 ? (
            <p className="text-[14px] text-on-variant">Todavía no lo has registrado.</p>
          ) : (
            <div className="rounded-card bg-surface-2">
              {recent.map((l, i) => {
                const biz = l.business_id ? businessNames[l.business_id] : undefined;
                const parts = [biz ? `En ${biz}` : null, l.cost != null ? formatCurrency(Number(l.cost)) : null, l.notes].filter(Boolean);
                return (
                  <div key={l.id}>
                    {i > 0 && <Divider className="mx-3" />}
                    <div className="px-3 py-2.5">
                      <div className="text-[14px] font-bold text-on">{longDate(l.done_at)}</div>
                      {parts.length > 0 && <div className="text-[13px] text-on-variant">{parts.join(" · ")}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Sheet>
  );
}
