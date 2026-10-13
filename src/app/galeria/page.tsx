"use client";
import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import { PhotoGallery } from "@/components/gallery/PhotoGallery";
import { GallerySkeleton } from "@/components/gallery/GallerySkeleton";

export default function GaleriaPage() {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  if (loading || !user) return <GallerySkeleton />;
  return (
    <Suspense fallback={<GallerySkeleton />}>
      <PhotoGallery />
    </Suspense>
  );
}
