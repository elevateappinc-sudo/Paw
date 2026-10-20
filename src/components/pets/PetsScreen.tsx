"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CloudOff, Plus } from "lucide-react";
import { PageHeader, EmptyState, Button, buttonVariants } from "@/components/ui";
import { fetchMyPets } from "@/lib/api/pets";
import { useStore } from "@/store";
import { PetProfileSkeleton } from "./profile/PetProfileSkeleton";

/**
 * Pestaña Mascotas: no hay lista intermedia, abre directo el perfil de la
 * mascota activa (o la primera). Se cambia de mascota desde el selector de
 * avatares del perfil. Sin mascotas, invita a añadir la primera.
 */
export function PetsScreen() {
  const router = useRouter();
  const selectedPetId = useStore((s) => s.selectedPetId);
  const [state, setState] = useState<"loading" | "empty" | "error">("loading");

  const load = useCallback(async () => {
    setState("loading");
    try {
      const rows = await fetchMyPets();
      if (rows.length === 0) {
        setState("empty");
        return;
      }
      const target = rows.find((r) => r.id === selectedPetId) ?? rows[0];
      router.replace(`/mascotas/${target.id}`);
    } catch {
      setState("error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  // Mientras redirige se muestra la geometría del perfil, que es el destino
  if (state === "loading") return <PetProfileSkeleton />;

  return (
    <div className="pb-6">
      <PageHeader title="Mascotas" />
      {state === "error" ? (
        <EmptyState
          icon={<CloudOff size={28} aria-hidden="true" />}
          title="No pudimos cargar tus mascotas"
          description="Revisa tu conexión e inténtalo de nuevo."
          action={
            <Button full onClick={() => void load()}>
              Reintentar
            </Button>
          }
        />
      ) : (
        <EmptyState
          title="Aún no tienes mascotas"
          description="Añade la primera y armamos su plan de cuidados."
          action={
            <Link href="/mascotas/nueva" className={buttonVariants({ size: "lg", full: true })}>
              <Plus size={20} aria-hidden="true" />
              Añadir mascota
            </Link>
          }
          secondary={
            <Link href="/join" className="inline-flex min-h-11 items-center">
              Tengo un código de invitación
            </Link>
          }
        />
      )}
    </div>
  );
}
