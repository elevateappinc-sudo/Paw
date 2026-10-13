import { redirect } from "next/navigation";

/** Las vacunas ahora viven en la línea de tiempo unificada de /salud */
export default function VacunasPage() {
  redirect("/salud");
}
