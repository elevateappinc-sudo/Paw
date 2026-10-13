"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader, EmptyState, Button } from "@/components/ui";

/** Inicio sin mascotas: una sola acción fuerte. */
export function HomeEmpty() {
  const router = useRouter();
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
          secondary={<Link href="/join">Tengo un código de invitación</Link>}
        />
      </div>
    </div>
  );
}
