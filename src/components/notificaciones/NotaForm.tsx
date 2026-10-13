"use client";
import { useState } from "react";
import { useStore } from "@/store";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button, Input, SegmentedControl, Sheet, Textarea } from "@/components/ui";
import type { Notificacion } from "@/types";

export const TIPO_LABEL: Record<Notificacion["tipo"], string> = {
  nota: "Nota",
  alerta: "Alerta",
  logro: "Logro",
};

export function NotaForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addNotificacion, selectedPetId } = useStore();
  const { user } = useAuthContext();
  const [tipo, setTipo] = useState<Notificacion["tipo"]>("nota");
  const [titulo, setTitulo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return;
    setSaving(true);
    try {
      await addNotificacion({ tipo, titulo: titulo.trim(), mensaje: mensaje.trim() }, selectedPetId ?? "", user?.id ?? "");
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Nueva nota"
      subtitle="Visible para todas las personas con acceso a la mascota"
      footer={
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" form="nota-form" loading={saving} disabled={!titulo.trim()} className="flex-[2]">
            Publicar
          </Button>
        </div>
      }
    >
      <form id="nota-form" onSubmit={handleSubmit} className="flex flex-col gap-4 pt-1">
        <SegmentedControl<Notificacion["tipo"]>
          ariaLabel="Tipo de nota"
          value={tipo}
          onChange={setTipo}
          options={(Object.keys(TIPO_LABEL) as Notificacion["tipo"][]).map((t) => ({ value: t, label: TIPO_LABEL[t] }))}
        />
        <Input label="Título" required placeholder="Qué quieres contar" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        <Textarea label="Mensaje (opcional)" rows={3} placeholder="Detalles" value={mensaje} onChange={(e) => setMensaje(e.target.value)} />
      </form>
    </Sheet>
  );
}
