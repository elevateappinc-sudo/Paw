"use client";
import { useState } from "react";
import { TriangleAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { useStore } from "@/store";
import { Button, Input, Select, Textarea } from "@/components/ui";

const DOSE_UNITS = ["mg", "ml", "comprimidos", "gotas", "otro"].map((u) => ({ value: u, label: u }));
const FREQUENCY_UNITS = [
  { value: "hours", label: "horas" },
  { value: "days", label: "días" },
  { value: "times_per_day", label: "veces por día" },
  { value: "weekly", label: "semanal" },
];

interface Props {
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddMedicationForm({ onClose, onSuccess }: Props) {
  const { user } = useAuthContext();
  const { selectedPetId } = useStore();

  const [name, setName] = useState("");
  const [doseAmount, setDoseAmount] = useState("");
  const [doseUnit, setDoseUnit] = useState("mg");
  const [frequencyValue, setFrequencyValue] = useState("");
  const [frequencyUnit, setFrequencyUnit] = useState("hours");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [vetName, setVetName] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Escribe el nombre del medicamento";
    if (!doseAmount || isNaN(Number(doseAmount)) || Number(doseAmount) <= 0) e.doseAmount = "Escribe la dosis";
    if (!frequencyValue || isNaN(Number(frequencyValue)) || Number(frequencyValue) <= 0) e.frequencyValue = "Indica la frecuencia";
    if (!startDate) e.startDate = "Falta la fecha de inicio";
    if (endDate && startDate && endDate < startDate) e.endDate = "El fin no puede ser antes del inicio";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    if (!user || !selectedPetId) return;

    setSaving(true);
    setApiError(null);

    try {
      const supabase = createClient();

      const { data: med, error: insertError } = await supabase
        .from("medications")
        .insert({
          pet_id: selectedPetId,
          user_id: user.id,
          name: name.trim(),
          dose_amount: Number(doseAmount),
          dose_unit: doseUnit,
          frequency_value: Number(frequencyValue),
          frequency_unit: frequencyUnit,
          start_date: startDate,
          end_date: endDate || null,
          vet_name: vetName.trim() || null,
          reason: reason.trim() || null,
          notes: notes.trim() || null,
          active: true,
        })
        .select("id")
        .single();

      if (insertError || !med) {
        throw new Error(insertError?.message ?? "No pudimos guardar el medicamento");
      }

      // Edge Function que genera las tomas programadas
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const { data: { session } } = await supabase.auth.getSession();

      await fetch(`${supabaseUrl}/functions/v1/generate-medication-logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? supabaseAnonKey}`,
          apikey: supabaseAnonKey,
        },
        body: JSON.stringify({ medication_id: med.id }),
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Algo salió mal. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-3 pb-2">
      <Input label="Medicamento" placeholder="Nombre del medicamento" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} autoFocus />

      <div className="grid grid-cols-2 gap-2">
        <Input label="Dosis" type="number" inputMode="decimal" placeholder="Cantidad" min="0" step="0.001" value={doseAmount} onChange={(e) => setDoseAmount(e.target.value)} error={errors.doseAmount} />
        <Select label="Unidad" value={doseUnit} onChange={(e) => setDoseUnit(e.target.value)} options={DOSE_UNITS} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Input label="Cada" type="number" inputMode="numeric" placeholder="Cada cuánto" min="1" step="1" value={frequencyValue} onChange={(e) => setFrequencyValue(e.target.value)} error={errors.frequencyValue} />
        <Select label="Frecuencia" value={frequencyUnit} onChange={(e) => setFrequencyUnit(e.target.value)} options={FREQUENCY_UNITS} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Input label="Inicio" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} error={errors.startDate} />
        <Input label="Fin" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} error={errors.endDate} hint="Vacío si es crónico" />
      </div>

      <Input label="Veterinario (opcional)" value={vetName} onChange={(e) => setVetName(e.target.value)} />
      <Input label="Motivo (opcional)" value={reason} onChange={(e) => setReason(e.target.value)} />
      <Textarea label="Notas (opcional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />

      <div className="flex items-start gap-2 rounded-md bg-warning-soft px-3 py-3 text-small leading-snug text-warning-text">
        <TriangleAlert size={16} className="mt-1 shrink-0 text-warning-text" aria-hidden="true" />
        <span>Consulta siempre con tu veterinario antes de dar cualquier medicamento.</span>
      </div>

      {apiError && <p role="alert" className="text-small font-semibold text-overdue-text">{apiError}</p>}

      <div className="flex gap-2">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
        <Button type="submit" loading={saving} className="flex-[2]">Guardar medicamento</Button>
      </div>
    </form>
  );
}
