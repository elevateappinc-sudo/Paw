import { RouteFallback } from "@/components/ui/Skeleton";
import { SettingsSkeleton } from "@/components/settings/SettingsSkeleton";

function LoadingContent() {
  return <SettingsSkeleton />;
}

export default function Loading() {
  return (
    <RouteFallback>
      <LoadingContent />
    </RouteFallback>
  );
}
