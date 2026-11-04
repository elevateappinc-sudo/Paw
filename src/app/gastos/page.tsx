"use client";
import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import { GastosModule } from "@/components/gastos/GastosModule";
import { GastosSkeleton } from "@/components/gastos/GastosSkeleton";
import { RouteFallback } from "@/components/ui/Skeleton";

export default function GastosPage() {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  if (loading || !user) return <RouteFallback><GastosSkeleton /></RouteFallback>;
  return (
    <Suspense fallback={<GastosSkeleton />}>
      <GastosModule />
    </Suspense>
  );
}
