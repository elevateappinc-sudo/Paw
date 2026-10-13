"use client";
import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Sheet, Button, Tag, Toggle } from "@/components/ui";
import { completeCareCycle, updateCareCycle, createCareCycle, intervalToDays, intervalLabel } from "@/lib/api/careCycles";
import type { CareCycle, CareCycleKind, IntervalUnit } from "@/types/db";
import { CARE_KIND_LABEL } from "@/types/db";
import { todayStr, addDays, errorMessage } from "./shared";
import { showToast } from "@/components/ui/Toast";
import { useStore } from "@/store";

/** Ciclos sobre los que tiene sentido preguntar "¿cuándo fue la última vez?" */
const ASKABLE: CareCycleKind[] = ["vaccine", "deworm_internal", "deworm_external", "checkup", "bath", "grooming", "nails", "ears", "other"];

export function cyclesWithoutHistory(cycles: CareCycle[] | null | undefined): CareCycle[] {
  return (cycles ?? []).filter((c) => c.active && !c.last_done_at && ASKABLE.includes(c.kind));
}

const UNIT_LABEL: Record<IntervalUnit, string> = { days: "días", weeks: "semanas", months: "meses" };
const KIND_OPTIONS: { value: CareCycleKind; label: string }[] = [
  { value: "other", label: "Seguimiento (dermatitis, vista, control especial)" },
  { value: "vaccine", label: "Vacuna" },
  { value: "deworm_internal", label: "Desparasitación interna" },
  { value: "deworm_external", label: "Antipulgas y garrapatas" },
  { value: "checkup", label: "Control veterinario" },
  { value: "bath", label: "Baño" },
  { value: "grooming", label: "Corte o cepillado" },
  { value: "nails", label: "Uñas" },
  { value: "ears", label: "Oídos" },
  { value: "dental", label: "Dientes" },
  { value: "weight", label: "Control de peso" },
];

interface Entry {
  active: boolean;
  value: number;
  unit: IntervalUnit;
  date: string;
  product: string;
}
interface NewEntry {
  key: string;
  name: string;
  kind: CareCycleKind;
  value: number;
  unit: IntervalUnit;
  date: string;
}

function entryFrom(c: CareCycle): Entry {
  return { active: c.active, value: c.interval_value ?? c.interval_days, unit: c.interval_value ? c.interval_unit : "days", date: "", product: "" };
}

const inputCls = "min-h-[44px] rounded-control border border-outline-variant bg-surface px-3 text-[15px] text-on outline-none placeholder:text-outline focus:border-primary";
const selectCls = "min-h-[44px] rounded-control border border-outline-variant bg-surface px-2 text-[15px] text-on outline-none focus:border-primary";

/**
 * Configurador del plan de cuidados de la mascota:
 * frecuencia editable (días, semanas, meses), seguir o no cada cuidado,
 * última fecha aplicada y cuidados propios del usuario.
 */
export function PriorHistorySheet({
  open,
  onClose,
  cycles,
  petName,
  petId,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  cycles: CareCycle[];
  petName: string;
  petId?: string;
  onSaved: (updated: { id: string; done_at: string }[]) => void;
}) {
  const { currentUserId } = useStore();
  const list = useMemo(() => cycles.filter((c) => c.kind !== "dental" && c.kind !== "weight").sort((a, b) => Number(b.active) - Number(a.active)), [cycles]);
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [added, setAdded] = useState<NewEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const today = todayStr();
  const resolvedPetId = petId ?? cycles[0]?.pet_id;

  useEffect(() => {
    if (!open) return;
    setEntries(Object.fromEntries(list.map((c) => [c.id, entryFrom(c)])));
    setAdded([]);
  }, [open, list]);

  function update(id: string, patch: Partial<Entry>) {
    setEntries((e) => ({ ...e, [id]: { ...e[id], ...patch } }));
  }
  function updateNew(key: string, patch: Partial<NewEntry>) {
    setAdded((a) => a.map((n) => (n.key === key ? { ...n, ...patch } : n)));
  }
  function addRow() {
    setAdded((a) => [...a, { key: Math.random().toString(36).slice(2), name: "", kind: "other", value: 1, unit: "months", date: "" }]);
  }

  const changes = list.filter((c) => {
    const e = entries[c.id];
    if (!e) return false;
    return e.active !== c.active || intervalToDays(e.value, e.unit) !== c.interval_days || !!e.date;
  });
  const validNew = added.filter((n) => n.name.trim() && n.value > 0);
  const total = changes.length + validNew.length;

  async function save() {
    if (total === 0) {
      onClose();
      return;
    }
    setSaving(true);
    const done: { id: string; done_at: string }[] = [];
    let failed = 0;
    for (const c of changes) {
      const e = entries[c.id];
      try {
        const days = intervalToDays(e.value, e.unit);
        const patch: Parameters<typeof updateCareCycle>[1] = {};
        if (e.active !== c.active) patch.active = e.active;
        if (days !== c.interval_days) {
          patch.interval_days = days;
          patch.interval_value = e.value;
          patch.interval_unit = e.unit;
          if (c.last_done_at && !e.date) patch.next_due_at = addDays(c.last_done_at, days);
        }
        if (Object.keys(patch).length) await updateCareCycle(c.id, patch);
        if (e.date && e.active) {
          await completeCareCycle(c.id, { done_at: e.date, product: e.product.trim() || undefined, notes: "Registro previo al plan" });
          done.push({ id: c.id, done_at: e.date });
        }
      } catch (err) {
        failed++;
        showToast(errorMessage(err, `No pudimos guardar ${c.name}`), undefined, "error");
      }
    }
    for (const n of validNew) {
      try {
        if (!resolvedPetId || !currentUserId) throw new Error("Falta la mascota");
        const days = intervalToDays(n.value, n.unit);
        const next = n.date ? addDays(n.date, days) : addDays(today, days);
        const created = await createCareCycle({ pet_id: resolvedPetId, user_id: currentUserId, kind: n.kind, name: n.name.trim(), interval_days: days, interval_value: n.value, interval_unit: n.unit, next_due_at: next, last_done_at: n.date || undefined });
        if (n.date) done.push({ id: created.id, done_at: n.date });
      } catch (err) {
        failed++;
        showToast(errorMessage(err, `No pudimos crear ${n.name}`), undefined, "error");
      }
    }
    setSaving(false);
    if (failed === 0) showToast("Plan actualizado", undefined, "success");
    onSaved(done.length ? done : [{ id: "plan", done_at: today }]);
    if (failed === 0) onClose();
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`Plan de ${petName}`}
      subtitle="Ajusta cada cuánto toca, qué quieres seguir y cuándo fue la última vez. Lo que no sepas, déjalo vacío."
      footer={
        <div className="flex flex-col gap-2">
          <Button full size="lg" onClick={() => void save()} loading={saving}>
            {total > 0 ? `Guardar ${total} ${total === 1 ? "cambio" : "cambios"}` : "Sin cambios"}
          </Button>
          <p className="text-center text-[12px] text-on-variant">Las próximas fechas se recalculan solas a partir de lo que registres.</p>
        </div>
      }
    >
      <ul className="flex flex-col divide-y divide-outline-variant">
        {list.map((c) => {
          const e = entries[c.id] ?? entryFrom(c);
          const days = intervalToDays(e.value, e.unit);
          const next = e.date ? addDays(e.date, days) : c.last_done_at ? addDays(c.last_done_at, days) : null;
          const nextLabel = next ? (next < today ? "ya vencido, toca ahora" : `próxima ${next}`) : null;
          return (
            <li key={c.id} className={`flex flex-col gap-2 py-3 ${e.active ? "" : "opacity-60"}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-[15px] font-bold text-on">{c.name}</div>
                  <div className="text-[12px] text-on-variant">
                    {CARE_KIND_LABEL[c.kind]} · {intervalLabel({ interval_days: days, interval_value: e.value, interval_unit: e.unit })}
                    {nextLabel ? ` · ${nextLabel}` : ""}
                  </div>
                </div>
                {c.last_done_at || e.date ? <Tag tone="ok" size="xs">Con fecha</Tag> : <Tag tone="neutral" size="xs">Sin registro</Tag>}
              </div>
              <Toggle checked={e.active} onChange={(v) => update(c.id, { active: v })} label="Dar seguimiento" description={e.active ? "Recibirás recordatorios" : "No aparecerá en el plan"} />
              {e.active && (
                <div className="grid grid-cols-[1fr_1fr] gap-2">
                  <label className="flex flex-col gap-1 text-[12px] font-semibold text-on-variant">
                    Cada
                    <span className="grid grid-cols-[64px_1fr] gap-1">
                      <input type="number" min={1} max={365} value={e.value} onChange={(ev) => update(c.id, { value: Math.max(1, Number(ev.target.value) || 1) })} className={inputCls} aria-label={`Frecuencia de ${c.name}`} />
                      <select value={e.unit} onChange={(ev) => update(c.id, { unit: ev.target.value as IntervalUnit })} className={selectCls} aria-label={`Unidad de ${c.name}`}>
                        {(["days", "weeks", "months"] as IntervalUnit[]).map((u) => (
                          <option key={u} value={u}>{UNIT_LABEL[u]}</option>
                        ))}
                      </select>
                    </span>
                  </label>
                  <label className="flex flex-col gap-1 text-[12px] font-semibold text-on-variant">
                    Última vez
                    <input type="date" max={today} value={e.date} onChange={(ev) => update(c.id, { date: ev.target.value })} className={inputCls} aria-label={`Última fecha de ${c.name}`} />
                  </label>
                  {(c.kind === "vaccine" || c.kind === "deworm_internal" || c.kind === "deworm_external") && e.date && (
                    <label className="col-span-2 flex flex-col gap-1 text-[12px] font-semibold text-on-variant">
                      Producto (opcional)
                      <input type="text" value={e.product} onChange={(ev) => update(c.id, { product: ev.target.value })} placeholder={c.kind === "vaccine" ? "Marca o lote" : "Ej. Bravecto, NexGard"} className={inputCls} aria-label={`Producto de ${c.name}`} />
                    </label>
                  )}
                </div>
              )}
            </li>
          );
        })}

        {added.map((n) => (
          <li key={n.key} className="flex flex-col gap-2 py-3">
            <div className="flex items-center justify-between gap-2">
              <input type="text" value={n.name} onChange={(ev) => updateNew(n.key, { name: ev.target.value })} placeholder="Nombre, ej. Control de dermatitis" className={`${inputCls} flex-1`} aria-label="Nombre del cuidado" />
              <button type="button" onClick={() => setAdded((a) => a.filter((x) => x.key !== n.key))} aria-label="Quitar" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-2 text-on-variant">
                <Trash2 size={18} />
              </button>
            </div>
            <div className="grid grid-cols-[1fr_1fr] gap-2">
              <label className="col-span-2 flex flex-col gap-1 text-[12px] font-semibold text-on-variant">
                Tipo
                <select value={n.kind} onChange={(ev) => updateNew(n.key, { kind: ev.target.value as CareCycleKind })} className={selectCls}>
                  {KIND_OPTIONS.map((k) => (
                    <option key={k.value} value={k.value}>{k.label}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-[12px] font-semibold text-on-variant">
                Cada
                <span className="grid grid-cols-[64px_1fr] gap-1">
                  <input type="number" min={1} max={365} value={n.value} onChange={(ev) => updateNew(n.key, { value: Math.max(1, Number(ev.target.value) || 1) })} className={inputCls} aria-label="Frecuencia" />
                  <select value={n.unit} onChange={(ev) => updateNew(n.key, { unit: ev.target.value as IntervalUnit })} className={selectCls} aria-label="Unidad">
                    {(["days", "weeks", "months"] as IntervalUnit[]).map((u) => (
                      <option key={u} value={u}>{UNIT_LABEL[u]}</option>
                    ))}
                  </select>
                </span>
              </label>
              <label className="flex flex-col gap-1 text-[12px] font-semibold text-on-variant">
                Última vez (opcional)
                <input type="date" max={today} value={n.date} onChange={(ev) => updateNew(n.key, { date: ev.target.value })} className={inputCls} />
              </label>
            </div>
          </li>
        ))}
      </ul>

      <button type="button" onClick={addRow} className="mt-3 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border border-dashed border-outline text-[15px] font-bold text-primary">
        <Plus size={18} /> Añadir otro cuidado o seguimiento
      </button>
    </Sheet>
  );
}

/** Aviso compacto para abrir el configurador desde el perfil o Salud */
export function PriorHistoryBanner({ count, onOpen }: { count: number; onOpen: () => void }) {
  const warn = count > 0;
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex w-full items-center gap-3 rounded-card-lg px-4 py-3 text-left active:scale-[0.99] ${warn ? "border border-warn/40 bg-warn-container text-on-warn-container" : "bg-surface-2 text-on"}`}
    >
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-bold">{warn ? `${count} ${count === 1 ? "cuidado sin fecha registrada" : "cuidados sin fecha registrada"}` : "Ajustar el plan de cuidados"}</div>
        <div className="text-[13px] opacity-90">{warn ? "Registra lo que ya le han puesto, cambia la frecuencia o quita lo que no quieras seguir." : "Frecuencia, qué seguir y cuidados propios."}</div>
      </div>
      <span className="shrink-0 text-[13px] font-extrabold">{warn ? "Registrar" : "Ajustar"}</span>
    </button>
  );
}
