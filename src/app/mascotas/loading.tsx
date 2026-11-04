import { RouteFallback } from "@/components/ui/Skeleton";
import { PetProfileSkeleton } from "@/components/pets/profile/PetProfileSkeleton";

/** La pestaña Mascotas abre directo el perfil: misma geometría */
export default function MascotasLoading() {
  return (
    <RouteFallback>
      <PetProfileSkeleton />
    </RouteFallback>
  );
}
