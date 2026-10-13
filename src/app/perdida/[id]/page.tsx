import type { Metadata } from "next";
import { LostAlertStatus } from "@/components/perdida/LostAlertStatus";

export const metadata: Metadata = { title: "Alerta de mascota perdida" };

export default async function AlertaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LostAlertStatus alertId={id} />;
}
