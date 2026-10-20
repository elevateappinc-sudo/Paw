"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader, EmptyState, Button } from "@/components/ui";
import { RegistrarSheet } from "./RegistrarSheet";

/** Inicio sin mascotas: una sola acción fuerte. SOS arriba a la derecha (PageHeader). */
export function HomeEmpty() {
  const router = useRouter();
  const params = useSearchParams();
  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader eyebrow="Bienvenido a Paw" title="Hola" />
      <div className="flex flex-1 items-center justify-center px-4">
        <EmptyState
          title="Aún no tienes mascotas"
          description="Con su especie, nacimiento y peso armamos su plan de vacunas y cuidados en un minuto."
          action={
            <Button full size="lg" onClick={() => router.push("/mascotas/nueva")}>
              Añadir mi primera mascota
            </Button>
          }
          secondary={
            <Link href="/join" className="inline-flex min-h-11 items-center">
              Tengo un código de invitación
            </Link>
          }
        />
      </div>
      <RegistrarSheet open={params.get("registrar") === "1"} onClose={() => router.replace("/home")} petId={null} />
    </div>
  );
}
