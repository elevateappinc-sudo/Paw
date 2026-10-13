"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { SOSButton } from "@/components/layout/SOSButton";

const ZONE_KEY = "paw.zone";

/** Cabecera estilo Rappi: "CERCA DE" + zona, SOS y avatar del usuario */
export function HomeHeader({ userName, userAvatarUrl }: { userName: string; userAvatarUrl: string | null }) {
  const [zone, setZone] = useState("Tu zona");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(ZONE_KEY);
      if (saved) setZone(saved);
    } catch {
      /* sin almacenamiento */
    }
  }, []);

  const initials = userName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <header className="flex items-end justify-between gap-3 px-4 pt-[max(14px,env(safe-area-inset-top))] pb-2">
      <Link href="/explorar" className="min-w-0 rounded-control active:opacity-80" aria-label={`Cerca de ${zone}, cambiar zona`}>
        <div className="text-[11px] font-black uppercase tracking-[0.12em] text-on-variant">Cerca de</div>
        <div className="flex items-center gap-1">
          <span className="truncate font-display text-[26px] leading-[1.1] text-on">{zone}</span>
          <ChevronDown size={22} className="shrink-0 text-primary" aria-hidden="true" />
        </div>
      </Link>
      <div className="flex shrink-0 items-center gap-2">
        <SOSButton />
        <Link
          href="/settings"
          aria-label={`Cuenta de ${userName}`}
          className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary-container text-[13px] font-black text-on-primary-container active:scale-95"
        >
          {userAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={userAvatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            initials || "T"
          )}
        </Link>
      </div>
    </header>
  );
}
