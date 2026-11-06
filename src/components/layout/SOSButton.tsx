"use client";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * SOS: píldora oscura de máximo contraste (texto sobre fondo invertido) con
 * un punto --color-danger que late. Siempre en mayúsculas.
 * Toque 1 abre /sos (hoja de urgencia); toque 2 llama.
 */
export function SOSButton({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <Link
      href="/sos"
      aria-label="SOS, veterinaria de urgencias"
      className={cn(
        "pressable relative inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full bg-text px-4 text-body font-semibold uppercase tracking-wider text-bg shadow-2",
        compact && "min-h-9 px-3 text-label after:absolute after:inset-x-0 after:-inset-y-1 after:content-['']",
        className
      )}
    >
      <span className="relative flex h-2 w-2" aria-hidden="true">
        <span className="sos-halo absolute inset-0 rounded-full bg-danger" />
        <span className="relative h-2 w-2 rounded-full bg-danger" />
      </span>
      SOS
    </Link>
  );
}
