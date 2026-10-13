import type { Metadata } from "next";
import { MedicationsModule } from "@/components/medications/MedicationsModule";

export const metadata: Metadata = { title: "Medicamentos" };

export default function MedicamentosPage() {
  return <MedicationsModule />;
}
