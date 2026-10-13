"use client";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * SOS: fijo arriba a la derecha en todas las pantallas.
 * Toque 1 abre /sos (hoja de urgencia); toque 2 llama.
 */
export function SOSButton({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <Link
      href="/sos"
      aria-label="SOS, veterinaria de urgencias"
      className={cn(
        "inline-flex min-h-[40px] items-center justify-center rounded-full bg-danger px-3.5 text-[13px] font-black tracking-wide text-white shadow-1 active:scale-95",
        compact && "min-h-[36px] px-3 text-[12px]",
        className
      )}
    >
      SOS
    </Link>
  );
}
