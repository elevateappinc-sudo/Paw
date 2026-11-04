"use client";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useStore } from "@/store";
import { today } from "@/lib/utils";
import { Button, Input, Sheet, Textarea } from "@/components/ui";
import type { ClaseEntrenamiento, TareaEntrenamiento } from "@/types";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface ClaseFormProps {
  open: boolean;
  onClose: () => void;
  editClase?: ClaseEntrenamiento;
}

export function ClaseForm({ open, onClose, editClase }: ClaseFormProps) {
  const { addClass, updateClass } = useStore();
  const [fecha, setFecha] = useState(editClase?.fecha ?? today());
  const [entrenador, setEntrenador] = useState(editClase?.entrenador ?? "");
  const [temas, setTemas] = useState(editClase?.temas ?? "");
  const [ejercicios, setEjercicios] = useState(editClase?.ejercicios ?? "");
  const [avances, setAvances] = useState(editClase?.avances ?? "");
  const [tareas, setTareas] = useState<TareaEntrenamiento[]>(editClase?.tareas ?? []);
  const [newTarea, setNewTarea] = useState("");
  const [saving, setSaving] = useState(false);

  function addTarea() {
    const t = newTarea.trim();
    if (!t) return;
    setTareas((prev) => [...prev, { id: uid(), descripcion: t, estado: "pendiente" }]);
    setNewTarea("");
  }
  function removeTarea(id: string) {
    setTareas((prev) => prev.filter((t) => t.id !== id));
  }

  const valid = Boolean(fecha && temas.trim());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    const data = { fecha, entrenador, temas, ejercicios, avances, tareas };
    setSaving(true);
    try {
      if (editClase) await updateClass(editClase.id, data);
      else await addClass(data);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editClase ? "Editar clase" : "Nueva clase"}
      footer={
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" form="clase-form" loading={saving} disabled={!valid} className="flex-[2]">
            {editClase ? "Guardar" : "Registrar clase"}
          </Button>
        </div>
      }
    >
      <form id="clase-form" onSubmit={handleSubmit} className="flex flex-col gap-4 pt-1">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Fecha" type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} />
          <Input label="Entrenador" placeholder="Opcional" value={entrenador} onChange={(e) => setEntrenador(e.target.value)} />
        </div>
        <Textarea label="Temas tratados" required rows={3} placeholder="Qué se trabajó en la clase" value={temas} onChange={(e) => setTemas(e.target.value)} />
        <Textarea label="Ejercicios practicados" rows={2} placeholder="Opcional" value={ejercicios} onChange={(e) => setEjercicios(e.target.value)} />
        <Textarea label="Avances observados" rows={2} placeholder="Opcional" value={avances} onChange={(e) => setAvances(e.target.value)} />

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-small font-semibold text-text-secondary">Tareas para casa</legend>
          {tareas.length > 0 && (
            <ul className="overflow-hidden rounded-md bg-surface-elevated">
              {tareas.map((t, i) => (
                <li key={t.id} className={i > 0 ? "border-t border-border" : undefined}>
                  <div className="flex min-h-12 items-center gap-2 py-1 pr-1 pl-4">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                    <span className="flex-1 text-body text-text">{t.descripcion}</span>
                    <Button type="button" variant="dangerTonal" size="icon" aria-label={`Quitar tarea ${t.descripcion}`} onClick={() => removeTarea(t.id)} className="border-transparent">
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-end gap-2">
            <Input
              aria-label="Nueva tarea"
              placeholder="Agregar tarea"
              value={newTarea}
              onChange={(e) => setNewTarea(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTarea();
                }
              }}
              className="flex-1"
            />
            <Button type="button" variant="secondary" size="icon" aria-label="Agregar tarea" onClick={addTarea} disabled={!newTarea.trim()} className="min-h-12 min-w-12">
              <Plus size={18} />
            </Button>
          </div>
        </fieldset>
      </form>
    </Sheet>
  );
}
