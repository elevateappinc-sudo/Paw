import { redirect } from "next/navigation";

/** Nuevo registro: botón + en /salud */
export default function NuevaVacunaPage() {
  redirect("/salud");
}
