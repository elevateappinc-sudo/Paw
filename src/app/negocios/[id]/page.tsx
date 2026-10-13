import { Suspense } from "react";
import { BusinessDetail } from "@/components/negocios/BusinessDetail";
import { BusinessSkeleton } from "@/components/negocios/BusinessSkeleton";

export const metadata = { title: "Negocio · Paw" };

export default async function NegocioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<BusinessSkeleton />}>
      <BusinessDetail id={id} />
    </Suspense>
  );
}
