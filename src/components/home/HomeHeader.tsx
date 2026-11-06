"use client";
import Link from "next/link";
import { AppMark } from "@/components/brand/AppMark";

/**
 * Cabecera mínima del Inicio: ícono de la app a la izquierda y foto de
 * perfil del usuario a la derecha, sobre el fondo (sin franja ni saludo).
 */
export function HomeHeader({ userName, userAvatarUrl }: { userName: string; userAvatarUrl: string | null }) {
  const first = userName.trim().split(/\s+/)[0] || "";
  const initial = first.charAt(0).toLocaleUpperCase("es") || "T";

  return (
    <header className="flex items-center justify-between gap-3 px-4 pt-[max(16px,env(safe-area-inset-top))] pb-2">
      <h1 className="flex items-center">
        <AppMark size={32} wordmark />
        <span className="sr-only">, inicio</span>
      </h1>
      <Link
        href="/settings"
        aria-label={`Cuenta de ${userName}`}
        className="pressable flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-2 border-surface bg-primary-soft text-subtitle font-semibold text-primary-text shadow-2"
      >
        {userAvatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={userAvatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span aria-hidden="true">{initial}</span>
        )}
      </Link>
    </header>
  );
}
