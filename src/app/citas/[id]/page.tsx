import { Suspense } from "react";
import { BookingDetail } from "@/components/citas/BookingDetail";
import { CitaDetailSkeleton } from "@/components/citas/CitasSkeleton";

export const metadata = { title: "Cita · Paw" };

export default async function CitaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<CitaDetailSkeleton />}>
      <BookingDetail id={id} />
    </Suspense>
  );
}
