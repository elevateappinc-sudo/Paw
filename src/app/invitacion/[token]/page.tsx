"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { XCircle } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useStore } from "@/store";
import { Button, Card, EmptyState, PawLoader, showToast } from "@/components/ui";
import { acceptInvite, fetchInvite, forgetInvite, rememberInvite, type AcceptError } from "@/lib/api/sharing";

const ERROR_COPY: Record<AcceptError, { title: string; description: string }> = {
  invalid: { title: "Enlace no válido", description: "Pide a quien te invitó un enlace nuevo." },
  expired: { title: "Enlace vencido", description: "Los enlaces duran 30 días. Pide uno nuevo." },
  used: { title: "Enlace ya usado", description: "Cada enlace sirve para una persona. Pide uno nuevo." },
  own_pet: { title: "Es tu mascota", description: "Ya la ves desde tu cuenta." },
  auth_required: { title: "Inicia sesión", description: "Necesitas una cuenta para ver la mascota." },
  unknown: { title: "Algo salió mal", description: "Intenta de nuevo en un momento." },
};

/**
 * /invitacion/[token]: enlace que alguien compartió por WhatsApp o mensaje.
 * Sin sesión → guarda la invitación y va directo al inicio de sesión (al
 * entrar o registrarse, PetsLoader vuelve aquí). Con sesión → se acepta sola
 * y abre Inicio con la mascota compartida.
 */
export default function InvitationPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { user, loading } = useAuthContext();
  const { fetchPets, selectPet } = useStore();
  const [error, setError] = useState<AcceptError | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!token || loading) return;
    rememberInvite(token);

    if (!user) {
      // Navegación completa: llega al login limpio (sin transición pendiente de esta ruta)
      window.location.replace("/login");
      return;
    }

    // Aceptar es idempotente, pero se evita el doble toast del modo estricto
    if (started.current) return;
    started.current = true;
    void (async () => {
      const result = await acceptInvite(token);
      if ("error" in result) {
        // Si el enlace no sirve, no se vuelve a abrir solo tras iniciar sesión
        if (result.error !== "unknown") forgetInvite();
        setError(result.error);
        return;
      }
      forgetInvite();
      const preview = await fetchInvite(token).catch(() => null);
      await fetchPets();
      selectPet(result.petId);
      showToast(preview ? `Ahora ves a ${preview.pet_name}` : "Mascota compartida contigo", undefined, "success");
      router.replace("/home");
    })();
  }, [token, user, loading, router, fetchPets, selectPet]);

  if (!error) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-bg">
        <PawLoader showLabel label="Abriendo la invitación" />
      </main>
    );
  }

  const copy = ERROR_COPY[error];
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-bg px-5 py-8">
      <Card elevation={2} className="w-full max-w-[400px]">
        <EmptyState
          compact
          icon={<XCircle size={26} />}
          title={copy.title}
          description={copy.description}
          action={
            <Link href="/home" className="block">
              <Button full variant="secondary">Ir al inicio</Button>
            </Link>
          }
        />
      </Card>
    </main>
  );
}
