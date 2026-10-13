"use client";
import { useState } from "react";
import { Sheet, Input, Button, showToast } from "@/components/ui";
import { addWeightLog } from "@/lib/api/pets";
import { today } from "@/lib/utils";
import type { WeightLog } from "@/types/db";

export function WeightSheet({ open, onClose, petId, userId, onSaved }: { open: boolean; onClose: () => void; petId: string; userId: string; onSaved: (log: WeightLog) => void }) {
  const [kg, setKg] = useState("");
  const [date, setDate] = useState(today());
  const [saving, setSaving] = useState(false);
  const value = Number(kg.replace(",", "."));
  const valid = value > 0 && value < 200;

  async function save() {
    if (!valid) return;
    setSaving(true);
    try {
      const log = await addWeightLog(petId, userId, Math.round(value * 10) / 10, date);
      onSaved(log);
      showToast("Peso registrado", undefined, "success");
      setKg("");
      onClose();
    } catch {
      showToast("No se pudo guardar el peso", () => void save(), "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Registrar peso"
      subtitle="Un registro al mes basta para ver la tendencia"
      footer={
        <Button full size="lg" onClick={() => void save()} disabled={!valid} loading={saving}>
          Guardar
        </Button>
      }
    >
      <div className="flex flex-col gap-4 py-2">
        <Input label="Peso" type="number" inputMode="decimal" step="0.1" min="0.1" placeholder="12,4" value={kg} onChange={(e) => setKg(e.target.value)} trailing={<span className="text-[15px] font-bold">kg</span>} autoFocus />
        <Input label="Fecha" type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} />
      </div>
    </Sheet>
  );
}
