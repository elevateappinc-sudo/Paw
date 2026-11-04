import { cn } from "@/lib/utils";

/**
 * Skeleton: replica el layout real (mismo radio, alto y espaciado).
 * El barrido diagonal está sincronizado en toda la pantalla (globals.css).
 * Al llegar el contenido, envolverlo en .enter-soft / .enter-soft-list
 * para el fundido cruzado; si la carga dura < --loader-delay, no mostrarlo.
 */
export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={cn("skeleton", className)} style={style} aria-hidden="true" />;
}

/** Avatar de mascota en skeleton: óvalo de cabeza con dos orejitas redondeadas */
export function SkeletonPetAvatar({ size = 68, className }: { size?: number; className?: string }) {
  const ear = Math.round(size * 0.3);
  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }} aria-hidden="true">
      <div className="skeleton absolute rounded-full" style={{ width: ear, height: ear * 1.15, left: size * 0.08, top: 0 }} />
      <div className="skeleton absolute rounded-full" style={{ width: ear, height: ear * 1.15, right: size * 0.08, top: 0 }} />
      <div className="skeleton absolute inset-x-0 bottom-0" style={{ top: size * 0.12, borderRadius: "50% 50% 46% 46% / 54% 54% 46% 46%" }} />
    </div>
  );
}

/** Fila de lista (ícono + dos líneas) */
export function SkeletonRow({ trailing = true }: { trailing?: boolean }) {
  return (
    <div className="flex min-h-16 items-center gap-3 px-4 py-3">
      <Skeleton className="h-11 w-11 rounded-sm" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-3 w-2/5" />
      </div>
      {trailing && <Skeleton className="h-8 w-8 rounded-full" />}
    </div>
  );
}

/** Tarjeta de negocio horizontal */
export function SkeletonBiz() {
  return (
    <div className="w-[200px] shrink-0 overflow-hidden rounded-md border border-border bg-surface">
      <Skeleton className="h-[112px] w-full rounded-none" />
      <div className="flex flex-col gap-2 p-3">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  );
}

/** Fila de avatares de mascota */
export function SkeletonPets() {
  return (
    <div className="flex gap-3 px-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col items-center gap-2">
          <SkeletonPetAvatar size={68} />
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  );
}

/** Tarjeta de mascota (foto, nombre, metadatos, chips y próxima tarea) */
export function SkeletonPetCard() {
  return (
    <div className="flex gap-3 rounded-md border border-border bg-surface p-4">
      <SkeletonPetAvatar size={72} />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * Envoltura de los loading.tsx de ruta: el skeleton solo aparece si la
 * carga supera --loader-delay (300 ms), con un fundido de entrada.
 */
export function RouteFallback({ children }: { children: React.ReactNode }) {
  return (
    <div className="delay-in" role="status" aria-live="polite" aria-label="Cargando">
      {children}
    </div>
  );
}
