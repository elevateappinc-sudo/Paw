"use client";
import { useEffect, useState } from "react";
import { Sheet, Button, Input, Textarea } from "@/components/ui";
import { completeCareCycle } from "@/lib/api/careCycles";
import type { CareCycle } from "@/types/db";
import { CARE_KIND_LABEL } from "@/types/db";
import { todayStr, errorMessage } from "./shared";

export interface CompleteCycleResult {
  logId: string;
  done_at: string;
  product?: string;
  dose?: string;
  cost?: number;
  notes?: string;
  business?: string;
}

/**
 * Hoja corta para registrar que un ciclo se hizo.
 * `fields` controla qué campos opcionales se muestran (salud: producto/dosis; higiene: negocio).
 */
export function CompleteCycleSheet({
  cycle,
  open,
  onClose,
  onDone,
  fields = { product: true, dose: true, cost: true, business: false },
}: {
  cycle: CareCycle | null;
  open: boolean;
  onClose: () => void;
  onDone: (cycle: CareCycle, result: CompleteCycleResult) => void;
  fields?: { product?: boolean; dose?: boolean; cost?: boolean; business?: boolean };
}) {
  const [date, setDate] = useState(todayStr());
  const [product, setProduct] = useState("");
  const [dose, setDose] = useState("");
  const [cost, setCost] = useState("");
  const [business, setBusiness] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDate(todayStr());
      setProduct(cycle?.product ?? "");
      setDose(cycle?.dose ?? "");
      setCost("");
      setBusiness("");
      setNotes("");
      setError(null);
    }
  }, [open, cycle]);

  async function submit() {
    if (!cycle) return;
    setSaving(true);
    setError(null);
    const costNum = cost.trim() ? Number(cost) : undefined;
    if (costNum !== undefined && (Number.isNaN(costNum) || costNum < 0)) {
      setError("Revisa el costo.");
      setSaving(false);
      return;
    }
    const mergedNotes = [business.trim() ? `En ${business.trim()}` : "", notes.trim()].filter(Boolean).join(" · ");
    try {
      const logId = await completeCareCycle(cycle.id, {
        done_at: date,
        product: product.trim() || undefined,
        dose: dose.trim() || undefined,
        cost: costNum,
        notes: mergedNotes || undefined,
      });
      onDone(cycle, { logId, done_at: date, product: product.trim() || undefined, dose: dose.trim() || undefined, cost: costNum, notes: mergedNotes || undefined, business: business.trim() || undefined });
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
      title={cycle ? `Marcar ${cycle.name}` : "Marcar como hecho"}
      subtitle={cycle ? CARE_KIND_LABEL[cycle.kind] : undefined}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button onClick={() => void submit()} loading={saving} className="flex-[2]">Confirmar</Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3 pb-2">
        <Input label="Fecha" type="date" value={date} max={todayStr()} onChange={(e) => setDate(e.target.value)} />
        {fields.product && <Input label="Producto (opcional)" placeholder="Ej. Nobivac, Bravecto" value={product} onChange={(e) => setProduct(e.target.value)} />}
        {fields.dose && <Input label="Dosis (opcional)" placeholder="Ej. 1 ml, 1 tableta" value={dose} onChange={(e) => setDose(e.target.value)} />}
        {fields.business && <Input label="Dónde (opcional)" placeholder="Nombre de la peluquería o veterinaria" value={business} onChange={(e) => setBusiness(e.target.value)} />}
        {fields.cost && <Input label="Costo (opcional)" type="number" inputMode="numeric" min={0} step={1000} placeholder="0" value={cost} onChange={(e) => setCost(e.target.value)} hint="En pesos colombianos" />}
        <Textarea label="Notas (opcional)" placeholder="Algo que quieras recordar" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        {error && <p role="alert" className="text-small font-semibold text-overdue-text">{error}</p>}
      </div>
    </Sheet>
  );
}
