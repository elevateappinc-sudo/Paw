import { Beef, CookingPot, Soup, type LucideIcon } from "lucide-react";
import { PetFood as PetFoodIcon } from "@/components/icons/pet";
import type { DietType, PetFood } from "@/types/db";

export const DIET_TYPES: DietType[] = ["concentrado", "casa", "barf", "vapor"];

export const DIET_META: Record<DietType, { label: string; icon: LucideIcon; detailLabel?: string; detailPlaceholder?: string; supplierLabel?: string; supplierPlaceholder?: string }> = {
  concentrado: { label: "Concentrado", icon: PetFoodIcon },
  casa: { label: "Casera", icon: CookingPot, detailLabel: "Qué le preparas", detailPlaceholder: "Ej. pollo, arroz y zanahoria" },
  barf: { label: "BARF", icon: Beef, detailLabel: "Proteínas", detailPlaceholder: "Ej. res, pollo, vísceras", supplierLabel: "Proveedor", supplierPlaceholder: "Ej. Barf Colombia" },
  vapor: { label: "Al vapor", icon: Soup, detailLabel: "Ingredientes", detailPlaceholder: "Ej. pavo, ahuyama, arroz", supplierLabel: "Marca o proveedor", supplierPlaceholder: "Ej. Dogu, Petcook" },
};

export const PRESENTATION_LABEL: Record<NonNullable<PetFood["presentation"]>, string> = { seco: "Seco", humedo: "Húmedo", mixto: "Seco y húmedo" };

/** Tipos guardados; las fichas antiguas con marca/bolsa cuentan como concentrado */
export function dietTypesOf(food: PetFood | null | undefined): DietType[] {
  if (food?.diet_types?.length) return food.diet_types;
  if (food && (food.brand || food.product || food.bag_kg)) return ["concentrado"];
  return [];
}

/** Texto corto de un tipo para la tarjeta ("Royal Canin Adult · seco · 15 kg") */
export function dietSummary(food: PetFood, type: DietType): string {
  if (type === "concentrado") {
    return [
      [food.brand, food.product].filter(Boolean).join(" "),
      food.presentation ? PRESENTATION_LABEL[food.presentation].toLowerCase() : null,
      food.bag_kg ? `${food.bag_kg.toLocaleString("es-CO")} kg` : null,
    ].filter(Boolean).join(" · ");
  }
  const d = food.diet_details?.[type];
  return [d?.detail, d?.supplier].filter(Boolean).join(" · ");
}
