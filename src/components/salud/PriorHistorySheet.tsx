"use client";
import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Sheet, Button, Toggle, DateField, OptionSelect } from "@/components/ui";
import { CARE_KIND_ICON } from "@/components/pets/petHelpers";
import { completeCareCycle, updateCareCycle, createCareCycle, intervalToDays, intervalLabel } from "@/lib/api/careCycles";
import type { CareCycle, CareCycleKind, IntervalUnit } from "@/types/db";
import { todayStr, addDays, errorMessage } from "./shared";
import { showToast } from "@/components/ui/Toast";
import { useStore } from "@/store";

/** Ciclos sobre los que tiene sentido preguntar "¿cuándo fue la última vez?" */
const ASKABLE: CareCycleKind[] = ["vaccine", "deworm_internal", "deworm_external", "checkup", "bath", "grooming", "nails", "ears", "other"];

export function cyclesWithoutHistory(cycles: CareCycle[] | null | undefined): CareCycle[] {
  return (cycles ?? []).filter((c) => c.active && !c.last_done_at && ASKABLE.includes(c.kind));
}

const UNIT_LABEL: Record<IntervalUnit, string> = { days: "días", weeks: "semanas", months: "meses" };
const UNIT_OPTIONS = (["days", "weeks", "months"] as IntervalUnit[]).map((u) => ({ value: u, label: UNIT_LABEL[u] }));
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

const inputCls = "min-h-11 w-full min-w-0 rounded-md border border-border bg-bg px-3 text-body text-text outline-none placeholder:text-text-secondary focus:border-primary";

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
      subtitle="Lo que no sepas, déjalo vacío."
      footer={
        <Button full size="lg" onClick={() => void save()} loading={saving}>
          {total > 0 ? `Guardar ${total} ${total === 1 ? "cambio" : "cambios"}` : "Listo"}
        </Button>
      }
    >
      <ul className="flex flex-col gap-4 pt-2">
        {list.map((c) => {
          const e = entries[c.id] ?? entryFrom(c);
          const days = intervalToDays(e.value, e.unit);
          const next = e.date ? addDays(e.date, days) : c.last_done_at ? addDays(c.last_done_at, days) : null;
          const overdue = !!next && next < today;
          const Icon = CARE_KIND_ICON[c.kind];
          return (
            <li key={c.id} className="rounded-xl border border-border bg-surface p-4 shadow-1">
              {/* Encabezado: ícono, nombre, frecuencia y el interruptor de seguimiento */}
              <div className={`flex items-center gap-3 transition-opacity duration-[var(--duration-base)] ${e.active ? "" : "opacity-60"}`}>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-text">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-body font-semibold text-text">{c.name}</div>
                  <div className={`truncate text-small ${overdue ? "text-overdue-text" : "text-text-secondary"}`}>
                    {e.active ? (overdue ? "Toca ahora" : intervalLabel({ interval_days: days, interval_value: e.value, interval_unit: e.unit })) : "Sin seguimiento"}
                  </div>
                </div>
                <Toggle hideLabel checked={e.active} onChange={(v) => update(c.id, { active: v })} label={`Dar seguimiento a ${c.name}`} />
              </div>
              {e.active && (
                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
                  <label className="flex flex-col gap-2 text-small text-text-secondary">
                    Cada
                    <span className="grid grid-cols-[56px_1fr] gap-2">
                      <input type="number" min={1} max={365} value={e.value} onChange={(ev) => update(c.id, { value: Math.max(1, Number(ev.target.value) || 1) })} className={inputCls} aria-label={`Frecuencia de ${c.name}`} />
                      <OptionSelect compact required value={e.unit} onChange={(v) => update(c.id, { unit: v as IntervalUnit })} options={UNIT_OPTIONS} aria-label={`Unidad de ${c.name}`} />
                    </span>
                  </label>
                  <label className="flex flex-col gap-2 text-small text-text-secondary">
                    Última vez
                    <DateField compact max={today} value={e.date} onChange={(v) => update(c.id, { date: v })} placeholder="Sin fecha" aria-label={`Última fecha de ${c.name}`} />
                  </label>
                  {(c.kind === "vaccine" || c.kind === "deworm_internal" || c.kind === "deworm_external") && e.date && (
                    <label className="col-span-2 flex flex-col gap-2 text-small text-text-secondary">
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
          <li key={n.key} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 shadow-1">
            <div className="flex items-center justify-between gap-2">
              <input type="text" value={n.name} onChange={(ev) => updateNew(n.key, { name: ev.target.value })} placeholder="Nombre, ej. Control de dermatitis" className={`${inputCls} flex-1`} aria-label="Nombre del cuidado" />
              <button type="button" onClick={() => setAdded((a) => a.filter((x) => x.key !== n.key))} aria-label="Quitar" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-elevated text-text-secondary">
                <Trash2 size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="col-span-2 flex flex-col gap-2 text-small text-text-secondary">
                Tipo
                <OptionSelect compact required value={n.kind} onChange={(v) => updateNew(n.key, { kind: v as CareCycleKind })} options={KIND_OPTIONS} aria-label="Tipo de cuidado" />
              </label>
              <label className="flex flex-col gap-2 text-small text-text-secondary">
                Cada
                <span className="grid grid-cols-[56px_1fr] gap-2">
                  <input type="number" min={1} max={365} value={n.value} onChange={(ev) => updateNew(n.key, { value: Math.max(1, Number(ev.target.value) || 1) })} className={inputCls} aria-label="Frecuencia" />
                  <OptionSelect compact required value={n.unit} onChange={(v) => updateNew(n.key, { unit: v as IntervalUnit })} options={UNIT_OPTIONS} aria-label="Unidad" />
                </span>
              </label>
              <label className="flex flex-col gap-2 text-small text-text-secondary">
                Última vez (opcional)
                <DateField compact max={today} value={n.date} onChange={(v) => updateNew(n.key, { date: v })} placeholder="Sin fecha" aria-label="Última vez" />
              </label>
            </div>
          </li>
        ))}
      </ul>

      <button type="button" onClick={addRow} className="pressable mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border text-body font-semibold text-primary-text">
        <Plus size={18} aria-hidden="true" /> Añadir cuidado
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
      className={`flex w-full items-center gap-3 rounded-md px-4 py-3 text-left active:scale-[0.99] ${warn ? "border border-warning/40 bg-warning-soft text-warning-text" : "bg-surface-elevated text-text"}`}
    >
      <div className="min-w-0 flex-1">
        <div className="text-body font-semibold">{warn ? `${count} ${count === 1 ? "cuidado sin fecha registrada" : "cuidados sin fecha registrada"}` : "Ajustar el plan de cuidados"}</div>
        <div className="text-small opacity-90">{warn ? "Registra lo que ya le han puesto, cambia la frecuencia o quita lo que no quieras seguir." : "Frecuencia, qué seguir y cuidados propios."}</div>
      </div>
      <span className="shrink-0 text-small font-semibold">{warn ? "Registrar" : "Ajustar"}</span>
    </button>
  );
}
