import { Skeleton } from "@/components/ui";

/** Misma geometría que el perfil: selector, foto, nombre, mosaicos, acceso, secciones y primera tarjeta */
export function PetProfileSkeleton() {
  return (
    <div className="pb-6" role="status" aria-live="polite" aria-label="Cargando perfil">
      {/* Selector de mascotas y SOS */}
      <div className="flex items-center gap-3 px-4 pt-[max(16px,env(safe-area-inset-top))]">
        <div className="flex flex-1 gap-2 py-1">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-11 w-11 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-11 w-16 rounded-full" />
      </div>
      <div className="px-4 pt-3">
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
      <div className="mt-4 flex flex-col gap-2 px-4">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 px-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
      <div className="mx-4 mt-3">
        <Skeleton className="h-12 w-full rounded-full" />
      </div>
      <div className="mx-4 mt-5">
        <Skeleton className="h-11 w-full rounded-full" />
      </div>
      <div className="mx-4 mt-4">
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    </div>
  );
}
