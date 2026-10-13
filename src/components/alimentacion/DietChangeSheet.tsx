"use client";
import { useEffect, useState } from "react";
import { Sheet, Button, Input, Textarea } from "@/components/ui";
import { errorMessage, todayStr } from "@/components/salud/shared";

export interface DietChange {
  date: string;
  from?: string;
  to?: string;
  reason?: string;
}

export function DietChangeSheet({ open, onClose, currentFood, onSave }: {
  open: boolean;
  onClose: () => void;
  /** "Marca Producto" actual para prellenar "de" */
  currentFood?: string;
  onSave: (change: DietChange) => Promise<void>;
}) {
  const [date, setDate] = useState(todayStr());
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDate(todayStr());
    setFrom(currentFood ?? "");
    setTo("");
    setReason("");
    setError(null);
  }, [open, currentFood]);

  async function submit() {
    if (!date) return setError("Revisa la fecha.");
    if (!to.trim()) return setError("Escribe a qué alimento cambió.");
    setSaving(true);
    setError(null);
    try {
      await onSave({ date, from: from.trim() || undefined, to: to.trim(), reason: reason.trim() || undefined });
      onClose();
    } catch (e) {
      setError(errorMessage(e, "No pudimos guardar. Intenta de nuevo."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Cambio de dieta"
      subtitle="Anota el cambio para seguir cómo le sienta"
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button onClick={() => void submit()} loading={saving} className="flex-[2]">Guardar</Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3 pb-2">
        <Input label="Fecha" type="date" max={todayStr()} value={date} onChange={(e) => setDate(e.target.value)} />
        <Input label="De" placeholder="Alimento anterior" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input label="A" placeholder="Alimento nuevo" value={to} onChange={(e) => setTo(e.target.value)} autoFocus />
        <Textarea label="Motivo (opcional)" placeholder="Ej. recomendación del veterinario, alergia" value={reason} onChange={(e) => setReason(e.target.value)} rows={2} />
        {error && <p role="alert" className="text-[13px] font-semibold text-danger">{error}</p>}
      </div>
    </Sheet>
  );
}
