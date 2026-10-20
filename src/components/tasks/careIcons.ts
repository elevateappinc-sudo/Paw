import { type LucideIcon, PawPrint } from "lucide-react";
import { PetBath, PetDental, PetDeworm, PetEar, PetFlea, PetGrooming, PetHealth, PetNails, PetShop, PetVaccine, PetWeight } from "@/components/icons/pet";
import type { CareCycleKind } from "@/types/db";

/** Ícono de cada tipo de cuidado para el recuadro de 32 px de la fila de tarea */
export const CARE_KIND_ICON: Record<CareCycleKind, LucideIcon> = {
  vaccine: PetVaccine,
  deworm_internal: PetDeworm,
  deworm_external: PetFlea,
  bath: PetBath,
  grooming: PetGrooming,
  nails: PetNails,
  ears: PetEar,
  dental: PetDental,
  food_restock: PetShop,
  checkup: PetHealth,
  weight: PetWeight,
  other: PawPrint,
};
