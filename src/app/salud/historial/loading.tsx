import { RouteFallback } from "@/components/ui/Skeleton";
import { ClinicalRecordsSkeleton } from "@/components/clinical/ClinicalRecordsModule";

function LoadingContent() {
  return <ClinicalRecordsSkeleton />;
}

export default function Loading() {
  return (
    <RouteFallback>
      <LoadingContent />
    </RouteFallback>
  );
}
