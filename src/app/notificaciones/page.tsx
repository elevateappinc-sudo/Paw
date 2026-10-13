"use client";
import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import { NotificacionesModule } from "@/components/notificaciones/NotificacionesModule";
import { NotificacionesSkeleton } from "@/components/notificaciones/NotificacionesSkeleton";

export default function NotificacionesPage() {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  if (loading || !user) return <NotificacionesSkeleton />;
  return (
    <Suspense fallback={<NotificacionesSkeleton />}>
      <NotificacionesModule />
    </Suspense>
  );
}
