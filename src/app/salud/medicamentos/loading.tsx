import { RouteFallback } from "@/components/ui/Skeleton";
import { MedicationsSkeleton } from "@/components/medications/MedicationsModule";

function LoadingContent() {
  return <MedicationsSkeleton />;
}

export default function Loading() {
  return (
    <RouteFallback>
      <LoadingContent />
    </RouteFallback>
  );
}
