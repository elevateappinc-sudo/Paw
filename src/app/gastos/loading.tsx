import { RouteFallback } from "@/components/ui/Skeleton";
import { GastosSkeleton } from "@/components/gastos/GastosSkeleton";

function GastosLoadingContent() {
  return <GastosSkeleton />;
}

export default function GastosLoading() {
  return (
    <RouteFallback>
      <GastosLoadingContent />
    </RouteFallback>
  );
}
