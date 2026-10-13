import { cn } from "@/lib/utils";

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={cn("skeleton", className)} style={style} aria-hidden="true" />;
}

/** Esqueleto de una fila de lista (icono + dos líneas) */
export function SkeletonRow({ trailing = true }: { trailing?: boolean }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Skeleton className="h-11 w-11 rounded-[14px]" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-3.5 w-3/5" />
        <Skeleton className="h-3 w-2/5" />
      </div>
      {trailing && <Skeleton className="h-9 w-20 rounded-full" />}
    </div>
  );
}

/** Esqueleto de tarjeta de negocio horizontal */
export function SkeletonBiz() {
  return (
    <div className="w-[200px] shrink-0 overflow-hidden rounded-card-lg border border-outline-variant bg-surface">
      <Skeleton className="h-[110px] w-full rounded-none" />
      <div className="flex flex-col gap-2 p-3">
        <Skeleton className="h-3.5 w-2/3" />
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  );
}

export function SkeletonPets() {
  return (
    <div className="flex gap-3 px-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col items-center gap-1.5">
          <Skeleton className="h-[68px] w-[68px] rounded-full" />
          <Skeleton className="h-3 w-10" />
        </div>
      ))}
    </div>
  );
}
