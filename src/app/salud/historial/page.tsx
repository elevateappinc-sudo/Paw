import type { Metadata } from "next";
import { ClinicalRecordsModule } from "@/components/clinical/ClinicalRecordsModule";

export const metadata: Metadata = { title: "Historial clínico" };

export default function HistorialPage() {
  return <ClinicalRecordsModule />;
}
