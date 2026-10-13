"use client";
import { useState } from "react";
import { useStore } from "@/store";
import { today } from "@/lib/utils";
import { Button, Input, Sheet, Textarea } from "@/components/ui";
import { OptionChips } from "./OptionChips";
import type { Gasto } from "@/types";

interface GastoFormProps {
  open: boolean;
  onClose: () => void;
  editGasto?: Gasto;
}

export function GastoForm({ open, onClose, editGasto }: GastoFormProps) {
  const { conceptos, personas, addGasto, updateGasto, addConcepto, addPersona } = useStore();
  const [concepto, setConcepto] = useState(editGasto?.concepto ?? "");
  const [monto, setMonto] = useState(editGasto?.monto?.toString() ?? "");
  const [fecha, setFecha] = useState(editGasto?.fecha ?? today());
  const [quien, setQuien] = useState(editGasto?.quien ?? "");
  const [notas, setNotas] = useState(editGasto?.notas ?? "");
  const [saving, setSaving] = useState(false);

  const valid = Boolean(concepto && monto && fecha && quien);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    const data = { concepto, monto: parseFloat(monto), fecha, quien, notas: notas.trim() };
    setSaving(true);
    try {
      if (editGasto) await updateGasto(editGasto.id, data);
      else await addGasto(data);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editGasto ? "Editar gasto" : "Nuevo gasto"}
      footer={
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" form="gasto-form" loading={saving} disabled={!valid} className="flex-[2]">
            {editGasto ? "Guardar" : "Agregar"}
          </Button>
        </div>
      }
    >
      <form id="gasto-form" onSubmit={handleSubmit} className="flex flex-col gap-4 pt-1">
        <Input
          label="Monto"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          required
          placeholder="0"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          leading={<span className="text-[18px] font-bold">$</span>}
        />
        <OptionChips label="Concepto" options={conceptos} value={concepto} onChange={setConcepto} onAddOption={addConcepto} addPlaceholder="Nuevo concepto" />
        <Input label="Fecha" type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} />
        <OptionChips label="Quién pagó" options={personas} value={quien} onChange={setQuien} onAddOption={addPersona} addPlaceholder="Nueva persona" />
        <Textarea label="Notas (opcional)" rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Detalle, lugar, etc." />
      </form>
    </Sheet>
  );
}
