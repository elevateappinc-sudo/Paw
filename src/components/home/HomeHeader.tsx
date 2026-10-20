"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { SOSButton } from "@/components/layout/SOSButton";

function greeting(hour: number): string {
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

/**
 * Cabecera: saludo según la hora con el nombre, una línea sobre la mascota
 * activa, SOS arriba a la derecha y avatar del usuario.
 */
export function HomeHeader({ userName, userAvatarUrl, petName }: { userName: string; userAvatarUrl: string | null; petName?: string | null }) {
  const first = userName.trim().split(/\s+/)[0] || "";
  const initial = first.charAt(0).toLocaleUpperCase("es") || "T";
  // La hora se calcula en el navegador para no desfasar el HTML del servidor
  const [hello, setHello] = useState("Hola");
  useEffect(() => setHello(greeting(new Date().getHours())), []);

  return (
    <header className="flex items-center justify-between gap-3 px-4 pt-[max(16px,env(safe-area-inset-top))] pb-2">
      <div className="min-w-0">
        <h1 className="truncate text-title text-text">
          <span className="font-normal">{hello}</span>
          {first && <span className="font-semibold">, {first}</span>}
        </h1>
        {petName && <p className="truncate text-small text-text-secondary">¿Cómo está {petName} hoy?</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <SOSButton />
        <Link
          href="/settings"
          aria-label={`Cuenta de ${userName}`}
          className="pressable flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-primary-soft text-subtitle font-semibold text-primary-text"
        >
          {userAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={userAvatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span aria-hidden="true">{initial}</span>
          )}
        </Link>
      </div>
    </header>
  );
}
