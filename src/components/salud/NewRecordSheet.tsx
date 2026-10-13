"use client";
import { useEffect, useMemo, useState } from "react";
import { Syringe, Bug, Pill, Stethoscope, Weight, ChevronRight, ChevronLeft } from "lucide-react";
import { Sheet, Button, Input, Textarea, Select, Chip, SegmentedControl, Row, Divider } from "@/components/ui";
import { createCareCycle, completeCareCycle, intervalToDays } from "@/lib/api/careCycles";
import { addWeightLog } from "@/lib/api/pets";
import { AddMedicationForm } from "@/components/medications/AddMedicationForm";
import type { CareCycleKind, IntervalUnit } from "@/types/db";
import type { VisitType } from "@/types";
import { createClinicalRecord } from "./api";
import { addDays, errorMessage, longDate, todayStr } from "./shared";

export type NewRecordOption = "vaccine" | "deworm" | "medication" | "consult" | "weight";

const OPTIONS: { id: NewRecordOption; label: string; hint: string; icon: React.ReactNode; tone: "info" | "container" | "primary" | "warn" | "ok" }[] = [
  { id: "vaccine", label: "Vacuna", hint: "Crea el ciclo y registra la aplicación", icon: <Syringe size={20} />, tone: "info" },
  { id: "deworm", label: "Antiparasitario", hint: "Interno o externo, con recordatorio", icon: <Bug size={20} />, tone: "container" },
  { id: "medication", label: "Medicamento", hint: "Dosis, frecuencia y tomas", icon: <Pill size={20} />, tone: "primary" },
  { id: "consult", label: "Consulta", hint: "Visita al veterinario", icon: <Stethoscope size={20} />, tone: "warn" },
  { id: "weight", label: "Peso", hint: "Nuevo registro de peso", icon: <Weight size={20} />, tone: "ok" },
];

const VISIT_TYPES: { value: VisitType; label: string }[] = [
  { value: "consulta_general", label: "Consulta general" },
  { value: "control_rutina", label: "Control de rutina" },
  { value: "emergencia", label: "Emergencia" },
  { value: "cirugia", label: "Cirugía" },
  { value: "otro", label: "Otro" },
];

const INTERVAL_PRESETS: { value: number; unit: IntervalUnit; label: string }[] = [
  { value: 1, unit: "months", label: "1 mes" },
  { value: 3, unit: "months", label: "3 meses" },
  { value: 6, unit: "months", label: "6 meses" },
  { value: 12, unit: "months", label: "1 año" },
];

export function NewRecordSheet({ open, onClose, petId, userId, onSaved, initial }: {
  open: boolean;
  onClose: () => void;
  petId: string;
  userId: string;
  onSaved: (what: NewRecordOption) => void;
  initial?: NewRecordOption | null;
}) {
  const [step, setStep] = useState<NewRecordOption | null>(initial ?? null);

  useEffect(() => {
    if (open) setStep(initial ?? null);
  }, [open, initial]);

  const title = step ? OPTIONS.find((o) => o.id === step)?.label ?? "Nuevo registro" : "Nuevo registro";

  function done(what: NewRecordOption) {
    onSaved(what);
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title={title} subtitle={step ? undefined : "¿Qué quieres anotar?"}>
      {!step && (
        <div className="-mx-1 flex flex-col pb-2">
          {OPTIONS.map((o, i) => (
            <div key={o.id}>
              {i > 0 && <Divider className="mx-0" />}
              <Row icon={o.icon} iconTone={o.tone} title={o.label} subtitle={o.hint} trailing={<ChevronRight size={18} className="text-on-variant" />} onClick={() => setStep(o.id)} className="rounded-card px-2" />
            </div>
          ))}
        </div>
      )}
      {step && (
        <button type="button" onClick={() => setStep(null)} className="mb-3 inline-flex min-h-[36px] items-center gap-1 rounded-full bg-surface-2 px-3 text-[13px] font-bold text-on active:scale-95">
          <ChevronLeft size={16} /> Otra opción
        </button>
      )}
      {(step === "vaccine" || step === "deworm") && <CycleForm kindGroup={step} petId={petId} userId={userId} onDone={() => done(step)} />}
      {step === "medication" && <AddMedicationForm onClose={onClose} onSuccess={() => onSaved("medication")} />}
      {step === "consult" && <ConsultForm petId={petId} userId={userId} onDone={() => done("consult")} />}
      {step === "weight" && <WeightForm petId={petId} userId={userId} onDone={() => done("weight")} />}
    </Sheet>
  );
}

// ── Vacuna / Antiparasitario ─────────────────────────────────────────────────
function CycleForm({ kindGroup, petId, userId, onDone }: { kindGroup: "vaccine" | "deworm"; petId: string; userId: string; onDone: () => void }) {
  const [dewormKind, setDewormKind] = useState<Extract<CareCycleKind, "deworm_internal" | "deworm_external">>("deworm_internal");
  const [name, setName] = useState("");
  const [intervalValue, setIntervalValue] = useState(kindGroup === "vaccine" ? 12 : 3);
  const [unit, setUnit] = useState<IntervalUnit>("months");
  const interval = intervalToDays(intervalValue, unit);
  const [lastDate, setLastDate] = useState(todayStr());
  const [product, setProduct] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextDate = useMemo(() => (lastDate && interval > 0 ? addDays(lastDate, interval) : null), [lastDate, interval]);
  const kind: CareCycleKind = kindGroup === "vaccine" ? "vaccine" : dewormKind;

  async function submit() {
    if (!name.trim()) return setError("Escribe un nombre.");
    if (!intervalValue || intervalValue < 1) return setError("La frecuencia debe ser de al menos 1.");
    if (!lastDate || !nextDate) return setError("Revisa la fecha.");
    setSaving(true);
    setError(null);
    try {
      const cycle = await createCareCycle({ pet_id: petId, user_id: userId, kind, name: name.trim(), interval_days: interval, interval_value: intervalValue, interval_unit: unit, next_due_at: nextDate, last_done_at: lastDate, product: product.trim() || undefined });
      // Registra la aplicación en el historial (el trigger recalcula next_due_at = última + intervalo)
      await completeCareCycle(cycle.id, { done_at: lastDate, product: product.trim() || undefined });
      onDone();
    } catch (e) {
      setError(errorMessage(e, "No pudimos guardar. Intenta de nuevo."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="flex flex-col gap-3 pb-2" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
      {kindGroup === "deworm" && (
        <SegmentedControl
          ariaLabel="Tipo de antiparasitario"
          value={dewormKind}
          onChange={setDewormKind}
          options={[{ value: "deworm_internal", label: "Interno" }, { value: "deworm_external", label: "Externo (pulgas)" }]}
        />
      )}
      <Input label="Nombre" placeholder={kindGroup === "vaccine" ? "Ej. Rabia, Triple felina" : "Ej. Desparasitación, Antipulgas"} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-on-variant">Se repite cada</span>
        <div className="flex flex-wrap gap-1.5">
          {INTERVAL_PRESETS.map((p) => (
            <Chip key={p.label} selected={intervalValue === p.value && unit === p.unit} onClick={() => { setIntervalValue(p.value); setUnit(p.unit); }}>{p.label}</Chip>
          ))}
        </div>
        <div className="grid grid-cols-[1fr_1fr] gap-2">
          <Input type="number" inputMode="numeric" min={1} value={String(intervalValue)} onChange={(e) => setIntervalValue(Number(e.target.value))} aria-label="Frecuencia" />
          <select value={unit} onChange={(e) => setUnit(e.target.value as IntervalUnit)} aria-label="Unidad" className="min-h-[44px] rounded-control border border-outline-variant bg-surface px-2 text-[15px] text-on outline-none focus:border-primary">
            <option value="days">días</option>
            <option value="weeks">semanas</option>
            <option value="months">meses</option>
          </select>
        </div>
      </div>
      <Input label="Última aplicación" type="date" max={todayStr()} value={lastDate} onChange={(e) => setLastDate(e.target.value)} />
      <Input label="Producto (opcional)" placeholder="Marca o nombre comercial" value={product} onChange={(e) => setProduct(e.target.value)} />
      <div className="rounded-control bg-primary-container px-4 py-3 text-[14px] text-on-primary-container">
        Próxima: <strong>{nextDate ? longDate(nextDate) : "—"}</strong>
      </div>
      {error && <p role="alert" className="text-[13px] font-semibold text-danger">{error}</p>}
      <Button type="submit" size="lg" full loading={saving}>Guardar</Button>
    </form>
  );
}

// ── Consulta ─────────────────────────────────────────────────────────────────
function ConsultForm({ petId, userId, onDone }: { petId: string; userId: string; onDone: () => void }) {
  const [date, setDate] = useState(todayStr());
  const [type, setType] = useState<VisitType>("consulta_general");
  const [vet, setVet] = useState("");
  const [clinic, setClinic] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!date) return setError("Revisa la fecha.");
    setSaving(true);
    setError(null);
    try {
      await createClinicalRecord({ pet_id: petId, user_id: userId, visit_date: date, visit_type: type, vet_name: vet, clinic_name: clinic, diagnosis, notes });
      onDone();
    } catch (e) {
      setError(errorMessage(e, "No pudimos guardar. Intenta de nuevo."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="flex flex-col gap-3 pb-2" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
      <Input label="Fecha" type="date" max={todayStr()} value={date} onChange={(e) => setDate(e.target.value)} />
      <Select label="Tipo" value={type} onChange={(e) => setType(e.target.value as VisitType)} options={VISIT_TYPES} />
      <Input label="Veterinario (opcional)" value={vet} onChange={(e) => setVet(e.target.value)} />
      <Input label="Clínica (opcional)" value={clinic} onChange={(e) => setClinic(e.target.value)} />
      <Textarea label="Diagnóstico (opcional)" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} rows={2} />
      <Textarea label="Notas (opcional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      {error && <p role="alert" className="text-[13px] font-semibold text-danger">{error}</p>}
      <Button type="submit" size="lg" full loading={saving}>Guardar consulta</Button>
    </form>
  );
}

// ── Peso ─────────────────────────────────────────────────────────────────────
function WeightForm({ petId, userId, onDone }: { petId: string; userId: string; onDone: () => void }) {
  const [kg, setKg] = useState("");
  const [date, setDate] = useState(todayStr());
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const n = Number(kg);
    if (!kg || Number.isNaN(n) || n <= 0) return setError("Escribe un peso válido.");
    setSaving(true);
    setError(null);
    try {
      await addWeightLog(petId, userId, n, date, notes.trim() || undefined);
      onDone();
    } catch (e) {
      setError(errorMessage(e, "No pudimos guardar. Intenta de nuevo."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="flex flex-col gap-3 pb-2" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
      <Input label="Peso" type="number" inputMode="decimal" step={0.1} min={0} placeholder="0,0" value={kg} onChange={(e) => setKg(e.target.value)} trailing={<span className="text-[13px]">kg</span>} autoFocus />
      <Input label="Fecha" type="date" max={todayStr()} value={date} onChange={(e) => setDate(e.target.value)} />
      <Textarea label="Notas (opcional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      {error && <p role="alert" className="text-[13px] font-semibold text-danger">{error}</p>}
      <Button type="submit" size="lg" full loading={saving}>Guardar peso</Button>
    </form>
  );
}
