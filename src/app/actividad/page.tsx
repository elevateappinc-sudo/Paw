import type { Metadata } from "next";
import { ActividadHub } from "@/components/itinerario/ActividadHub";

export const metadata: Metadata = { title: "Actividad" };

export default function ActividadPage() {
  return <ActividadHub />;
}
