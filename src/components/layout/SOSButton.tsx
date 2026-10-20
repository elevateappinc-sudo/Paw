"use client";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * SOS: siempre visible arriba a la derecha, con --color-danger sólido y
 * --color-on-danger. Es el elemento de mayor contraste de la pantalla.
 * Toque 1 abre /sos (hoja de urgencia); toque 2 llama.
 */
export function SOSButton({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <Link
      href="/sos"
      aria-label="SOS, veterinaria de urgencias"
      className={cn(
        "pressable relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-danger px-4 text-body font-semibold uppercase tracking-wider text-on-danger",
        compact && "min-h-9 px-3 text-label after:absolute after:inset-x-0 after:-inset-y-1 after:content-['']",
        className
      )}
    >
      SOS
    </Link>
  );
}
