"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button, Input, Sheet, showToast } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

const CONFIRM_WORD = "ELIMINAR";

/** Lo que se borra, en una línea cada cosa */
const WHAT = ["Tus mascotas y todo su historial de salud", "Fotos, videos y documentos", "Citas, reseñas, gastos y recordatorios", "Tu perfil y tu acceso a Paw"];

/**
 * Eliminar la cuenta: acción destructiva al final de Ajustes. Abre una hoja
 * que explica qué se borra y pide escribir ELIMINAR antes de habilitar el
 * botón. El borrado lo hace DELETE /api/account en el servidor.
 */
export function DeleteAccount() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [word, setWord] = useState("");
  const [deleting, setDeleting] = useState(false);
  const ready = word.trim().toLocaleUpperCase("es") === CONFIRM_WORD;

  async function remove() {
    setDeleting(true);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? "No pudimos eliminar la cuenta");
      await createClient().auth.signOut().catch(() => {});
      try {
        localStorage.clear();
      } catch {
        /* sin almacenamiento */
      }
      router.replace("/login?cuenta=eliminada");
    } catch (e) {
      setDeleting(false);
      showToast(e instanceof Error ? e.message : "No pudimos eliminar la cuenta", undefined, "error");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="pressable flex min-h-11 w-full items-center justify-center gap-2 rounded-full text-body font-semibold text-danger-text"
      >
        <Trash2 size={18} aria-hidden="true" /> Eliminar cuenta
      </button>

      <Sheet
        open={open}
        onClose={() => {
          if (deleting) return;
          setOpen(false);
          setWord("");
        }}
        title="¿Eliminar tu cuenta?"
        subtitle="Es permanente y no se puede deshacer."
        footer={
          <Button variant="destructive" full size="lg" disabled={!ready} loading={deleting} onClick={() => void remove()}>
            Eliminar cuenta definitivamente
          </Button>
        }
      >
        <div className="flex flex-col gap-4 pt-2">
          <ul className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4">
            {WHAT.map((w) => (
              <li key={w} className="flex items-start gap-2 text-body text-text">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-danger" aria-hidden="true" />
                {w}
              </li>
            ))}
          </ul>
          <p className="text-small text-text-secondary">Las personas con quienes compartes tus mascotas también dejarán de verlas.</p>
          <Input
            label={`Escribe ${CONFIRM_WORD} para confirmar`}
            value={word}
            onChange={(e) => setWord(e.target.value)}
            autoCapitalize="characters"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            disabled={deleting}
          />
        </div>
      </Sheet>
    </>
  );
}
