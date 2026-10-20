import { RouteFallback } from "@/components/ui/Skeleton";
import { HomeSkeleton } from "@/components/home/HomeSkeleton";

function HomeLoadingContent() {
  return <HomeSkeleton />;
}

export default function HomeLoading() {
  return (
    <RouteFallback>
      <HomeLoadingContent />
    </RouteFallback>
  );
}
