"use client";
import { useState } from "react";
import { PetFood, PetWalk } from "@/components/icons/pet";
import { useStore } from "@/store";
import { cn } from "@/lib/utils";
import { Button, Input, SegmentedControl, Sheet, Textarea } from "@/components/ui";
import type { ItinerarioItem } from "@/types";

export const DIAS_LABEL = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DIAS_ORDER = [1, 2, 3, 4, 5, 6, 0];

type Tipo = ItinerarioItem["tipo"];

export function ItemForm({ open, onClose, editItem }: { open: boolean; onClose: () => void; editItem?: ItinerarioItem }) {
  const { addItinerarioItem, updateItinerarioItem } = useStore();
  const [tipo, setTipo] = useState<Tipo>(editItem?.tipo ?? "comida");
  const [nombre, setNombre] = useState(editItem?.nombre ?? "");
  const [hora, setHora] = useState(editItem?.hora ?? "08:00");
  const [cantidad, setCantidad] = useState(editItem?.cantidad ?? "");
  const [dias, setDias] = useState<number[]>(editItem?.dias ?? [1, 2, 3, 4, 5, 6, 0]);
  const [notas, setNotas] = useState(editItem?.notas ?? "");
  const [saving, setSaving] = useState(false);

  function toggleDia(d: number) {
    setDias((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  const valid = nombre.trim().length > 0 && dias.length > 0 && hora.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    const data = { tipo, nombre: nombre.trim(), hora, cantidad, dias, notas };
    setSaving(true);
    try {
      if (editItem) await updateItinerarioItem(editItem.id, data);
      else await addItinerarioItem(data);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`${editItem ? "Editar" : "Nueva"} ${tipo === "comida" ? "comida" : "salida"}`}
      footer={
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" form="itinerario-form" loading={saving} disabled={!valid} className="flex-[2]">
            {editItem ? "Guardar" : "Agregar"}
          </Button>
        </div>
      }
    >
      <form id="itinerario-form" onSubmit={handleSubmit} className="flex flex-col gap-4 pt-1">
        <SegmentedControl<Tipo>
          ariaLabel="Tipo de rutina"
          value={tipo}
          onChange={setTipo}
          options={[
            {
              value: "comida",
              label: (
                <span className="inline-flex items-center gap-2">
                  <PetFood size={15} aria-hidden="true" /> Comida
                </span>
              ),
            },
            {
              value: "salida",
              label: (
                <span className="inline-flex items-center gap-2">
                  <PetWalk size={15} aria-hidden="true" /> Salida
                </span>
              ),
            },
          ]}
        />
        <Input
          label="Nombre"
          required
          placeholder={tipo === "comida" ? "Ej: Desayuno, Almuerzo, Cena" : "Ej: Paseo de la mañana"}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Hora" type="time" required value={hora} onChange={(e) => setHora(e.target.value)} />
          <Input
            label={tipo === "comida" ? "Cantidad" : "Duración"}
            placeholder={tipo === "comida" ? "1 taza, 200 g" : "30 min"}
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
          />
        </div>

        <fieldset>
          <legend className="mb-2 text-small font-semibold text-text-secondary">Días de la semana</legend>
          <div className="flex justify-between gap-2" role="group">
            {DIAS_ORDER.map((d) => {
              const on = dias.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={on}
                  aria-label={DIAS_LABEL[d]}
                  onClick={() => toggleDia(d)}
                  className={cn(
                    "flex h-11 flex-1 items-center justify-center rounded-md text-small font-semibold transition-colors active:scale-95",
                    on ? "bg-primary text-on-primary" : "bg-surface-elevated text-text-secondary"
                  )}
                >
                  {DIAS_LABEL[d].charAt(0)}
                </button>
              );
            })}
          </div>
          {dias.length === 0 && <p className="mt-2 text-label font-semibold text-overdue-text">Elige al menos un día.</p>}
        </fieldset>

        <Textarea label="Notas (opcional)" rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Marca, lugar, recordatorios" />
      </form>
    </Sheet>
  );
}
