"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { useStore } from "@/store";
import { Button } from "@/components/ui/Button";

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";

const DOSE_UNITS = ["mg", "ml", "comprimidos", "gotas", "otro"];
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
  const { selectedPetId, pets } = useStore();
  const pet = pets.find((p) => p.id === selectedPetId);
  const accentColor = pet?.color ?? "var(--color-accent)";

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
    if (!name.trim()) e.name = "El nombre del medicamento es requerido";
    if (!doseAmount || isNaN(Number(doseAmount)) || Number(doseAmount) <= 0)
      e.doseAmount = "Ingresa la dosis";
    if (!frequencyValue || isNaN(Number(frequencyValue)) || Number(frequencyValue) <= 0)
      e.frequencyValue = "Selecciona la frecuencia";
    if (!startDate) e.startDate = "La fecha de inicio es requerida";
    if (endDate && startDate && endDate < startDate)
      e.endDate = "La fecha de fin no puede ser anterior al inicio";
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

      // Insert medication
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
        throw new Error(insertError?.message ?? "Error al guardar el medicamento");
      }

      // Call Edge Function to generate logs
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const { data: { session } } = await supabase.auth.getSession();

      await fetch(`${supabaseUrl}/functions/v1/generate-medication-logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token ?? supabaseAnonKey}`,
          "apikey": supabaseAnonKey,
        },
        body: JSON.stringify({ medication_id: med.id }),
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setSaving(false);
    }
  }

  const inputS: React.CSSProperties = {
    width: "100%", padding: "14px 16px", fontSize: 16, color: "#fff",
    background: "transparent", border: "none", outline: "none", fontFamily: FONT,
    boxSizing: "border-box",
  };
  const labelS: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const,
    letterSpacing: "0.06em", color: "rgba(235,235,245,0.5)",
    marginBottom: 6, display: "block",
  };
  const fieldGroup: React.CSSProperties = {
    background: "#2c2c2e", borderRadius: 13, overflow: "hidden", marginBottom: 12,
  };
  const fieldSep = <div style={{ height: 1, background: "rgba(84,84,88,0.65)", marginLeft: 16 }} />;
  const errorS: React.CSSProperties = {
    fontSize: 12, color: "#ff453a", padding: "4px 16px 8px", display: "block",
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} style={{ padding: "0 0 8px", fontFamily: FONT }}>
      {/* Nombre */}
      <div style={fieldGroup}>
        <input
          style={inputS}
          type="text"
          placeholder="Nombre del medicamento *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>
      {errors.name && <span style={errorS}>{errors.name}</span>}

      {/* Dosis */}
      <label style={{ ...labelS, padding: "0 4px" }}>Dosis</label>
      <div style={{ ...fieldGroup, display: "flex", gap: 0 }}>
        <input
          style={{ ...inputS, flex: 1 }}
          type="number"
          placeholder="Cantidad"
          min="0"
          step="0.001"
          value={doseAmount}
          onChange={(e) => setDoseAmount(e.target.value)}
        />
        {fieldSep}
        <select
          style={{ ...inputS, flex: 1, cursor: "pointer" }}
          value={doseUnit}
          onChange={(e) => setDoseUnit(e.target.value)}
        >
          {DOSE_UNITS.map((u) => (
            <option key={u} value={u} style={{ background: "#1c1c1e" }}>{u}</option>
          ))}
        </select>
      </div>
      {errors.doseAmount && <span style={errorS}>{errors.doseAmount}</span>}

      {/* Frecuencia */}
      <label style={{ ...labelS, padding: "0 4px" }}>Frecuencia</label>
      <div style={{ ...fieldGroup, display: "flex", gap: 0 }}>
        <input
          style={{ ...inputS, flex: 1 }}
          type="number"
          placeholder="Cada cuánto"
          min="1"
          step="1"
          value={frequencyValue}
          onChange={(e) => setFrequencyValue(e.target.value)}
        />
        {fieldSep}
        <select
          style={{ ...inputS, flex: 1, cursor: "pointer" }}
          value={frequencyUnit}
          onChange={(e) => setFrequencyUnit(e.target.value)}
        >
          {FREQUENCY_UNITS.map((u) => (
            <option key={u.value} value={u.value} style={{ background: "#1c1c1e" }}>{u.label}</option>
          ))}
        </select>
      </div>
      {errors.frequencyValue && <span style={errorS}>{errors.frequencyValue}</span>}

      {/* Fechas */}
      <label style={{ ...labelS, padding: "0 4px" }}>Duración</label>
      <div style={fieldGroup}>
        <div style={{ padding: "10px 16px 4px" }}>
          <label style={{ ...labelS, marginBottom: 4 }}>Inicio *</label>
          <input style={inputS} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        {errors.startDate && <span style={errorS}>{errors.startDate}</span>}
        {fieldSep}
        <div style={{ padding: "10px 16px 4px" }}>
          <label style={{ ...labelS, marginBottom: 4 }}>Fin (vacío = crónico)</label>
          <input style={inputS} type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} />
        </div>
        {errors.endDate && <span style={errorS}>{errors.endDate}</span>}
      </div>

      {/* Opcionales */}
      <div style={fieldGroup}>
        <input style={inputS} type="text" placeholder="Veterinario (opcional)" value={vetName} onChange={(e) => setVetName(e.target.value)} />
        {fieldSep}
        <input style={inputS} type="text" placeholder="Motivo (opcional)" value={reason} onChange={(e) => setReason(e.target.value)} />
        {fieldSep}
        <textarea
          style={{ ...inputS, resize: "none", minHeight: 72 }}
          placeholder="Notas adicionales (opcional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {/* Disclaimer */}
      <div style={{
        background: "rgba(255,159,10,0.08)", border: "1px solid rgba(255,159,10,0.2)",
        borderRadius: 12, padding: "12px 14px", marginBottom: 16,
      }}>
        <p style={{ fontSize: 13, color: "rgba(235,235,245,0.7)", margin: 0, lineHeight: 1.5 }}>
          🐾 Consulta siempre con tu veterinario antes de administrar cualquier medicamento
        </p>
      </div>

      {/* API error */}
      {apiError && (
        <div style={{ background: "rgba(255,69,58,0.1)", border: "1px solid rgba(255,69,58,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
          <p style={{ fontSize: 13, color: "#ff453a", margin: 0 }}>{apiError}</p>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 10 }}>
        <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" variant="primary" loading={saving} className="flex-[2]">
          Guardar medicamento
        </Button>
      </div>
    </form>
  );
}
