"use client";
import { Trash2 } from "lucide-react";
import { Button, Sheet } from "@/components/ui";

/** Confirmación de borrado en hoja inferior (fotos y videos). */
export function ConfirmDeleteSheet({
  open,
  onClose,
  onConfirm,
  deleting,
  title,
  confirmLabel,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
  title: string;
  confirmLabel: string;
}) {
  return (
    <Sheet open={open} onClose={() => !deleting && onClose()} hideClose>
      <div className="flex flex-col items-center gap-3 pt-2 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-soft text-danger-text">
          <Trash2 size={24} aria-hidden="true" />
        </div>
        <h3 className="font-semibold text-title leading-tight text-text">{title}</h3>
        <p className="text-body text-text-secondary">Esta acción no se puede deshacer.</p>
        <div className="mt-2 flex w-full flex-col gap-2">
          <Button variant="destructive" size="lg" full loading={deleting} onClick={onConfirm}>
            {confirmLabel}
          </Button>
          <Button variant="secondary" size="lg" full disabled={deleting} onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
