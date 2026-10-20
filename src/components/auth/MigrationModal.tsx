"use client";
import { useState } from "react";
import { CloudUpload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, PawIllustration, PetSilhouetteLoader, SpotsLoader, Sheet, useLoaderVisibility } from "@/components/ui";
import type { User } from "@supabase/supabase-js";

interface LocalPet {
  id: string;
  name: string;
  species: "perro" | "gato" | "ave" | "conejo" | "otro";
  breed?: string;
  birthDate?: string;
  weight?: number;
  emoji?: string;
  color?: string;
  sharedWith?: string[];
}

interface LocalStore {
  state?: {
    pets?: LocalPet[];
  };
}

interface MigrationModalProps {
  user: User;
  onComplete: () => void;
}

type MigrationStatus = "idle" | "loading" | "success" | "error";

/** Hoja que ofrece migrar las mascotas guardadas en localStorage a la cuenta. */
export function MigrationModal({ user, onComplete }: MigrationModalProps) {
  const [status, setStatus] = useState<MigrationStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [skipping, setSkipping] = useState(false);

  async function handleMigrate() {
    setStatus("loading");
    setErrorMsg("");
    try {
      const supabase = createClient();
      const rawStore = localStorage.getItem("paw-store-v3");
      const parsedStore: LocalStore | null = rawStore ? (JSON.parse(rawStore) as LocalStore) : null;
      const localPets = parsedStore?.state?.pets ?? [];

      if (localPets.length > 0) {
        const petsToInsert = localPets.map((pet) => ({
          user_id: user.id,
          name: pet.name,
          species: pet.species,
          breed: pet.breed ?? null,
          birth_date: pet.birthDate ?? null,
          weight: pet.weight ?? null,
          emoji: pet.emoji ?? null,
          color: pet.color ?? null,
          shared_with: [],
        }));
        const { error: insertError } = await supabase.from("pets").insert(petsToInsert);
        if (insertError) throw insertError;
      }

      const { error: updateError } = await supabase.from("users").update({ migration_completed: true }).eq("id", user.id);
      if (updateError) throw updateError;

      if (rawStore) {
        const parsed: LocalStore = JSON.parse(rawStore) as LocalStore;
        if (parsed.state) parsed.state.pets = [];
        localStorage.setItem("paw-store-v3", JSON.stringify(parsed));
      }

      setStatus("success");
      setTimeout(() => onComplete(), 2000);
    } catch (err) {
      console.error("Migration error:", err);
      setErrorMsg("No pudimos migrar algunos datos. Inténtalo de nuevo.");
      setStatus("error");
    }
  }

  async function handleSkip() {
    setSkipping(true);
    const supabase = createClient();
    await supabase.from("users").update({ migration_completed: true }).eq("id", user.id);
    onComplete();
  }

  const busy = status === "loading" || skipping;
  const showSync = useLoaderVisibility(status === "loading");

  return (
    <Sheet open onClose={() => {}} hideClose title={status === "success" ? undefined : "Datos guardados en este dispositivo"}>
      {status === "success" ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <PawIllustration className="h-24 w-24" />
          <h2 className="font-semibold text-title leading-tight text-text">Todo listo</h2>
          <p className="text-body text-text-secondary">Tus datos están seguros en tu cuenta.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 pb-2">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm bg-primary-soft text-primary-text">
              <CloudUpload size={22} aria-hidden="true" />
            </div>
            <p className="text-body leading-relaxed text-text-secondary">Encontramos mascotas guardadas en este dispositivo. ¿Las pasamos a tu cuenta para tenerlas en todos tus dispositivos?</p>
          </div>

          {showSync && (
            // Espera larga: silueta en movimiento sobre un fondo de manchas
            <div className="relative flex justify-center py-2">
              <SpotsLoader decorative size={200} className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
              <PetSilhouetteLoader showLabel label="Pasando tus datos a tu cuenta" className="relative" />
            </div>
          )}

          {status === "error" && (
            <Card tone="overdue" elevation={0} role="alert" className="py-3 text-body">
              {errorMsg}
            </Card>
          )}

          <div className="flex flex-col gap-2">
            <Button size="lg" full onClick={() => void handleMigrate()} loading={status === "loading"} disabled={busy}>
              {status === "error" ? "Reintentar migración" : "Migrar mis datos"}
            </Button>
            <Button size="lg" full variant="secondary" onClick={() => void handleSkip()} loading={skipping} disabled={busy}>
              Empezar de cero
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
