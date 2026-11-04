import { RouteFallback } from "@/components/ui/Skeleton";
import { PetProfileSkeleton } from "@/components/pets/profile/PetProfileSkeleton";

function MascotaLoadingContent() {
  return <PetProfileSkeleton />;
}

export default function MascotaLoading() {
  return (
    <RouteFallback>
      <MascotaLoadingContent />
    </RouteFallback>
  );
}
