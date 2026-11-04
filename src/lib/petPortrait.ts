import type { Species } from "@/types/db";

/**
 * Retrato realista por defecto (cuando la mascota no tiene foto): se elige
 * por especie y, si se reconoce, por raza. Las fotos son de Unsplash
 * (licencia Unsplash) y viven en public/avatars/real para funcionar sin conexión.
 */

/** Palabras clave de raza → retrato (se compara sin tildes ni mayúsculas) */
const DOG_BREEDS: [RegExp, string][] = [
  [/golden/, "golden"],
  [/labrador/, "labrador"],
  [/beagle/, "beagle"],
  [/pastor|shepherd/, "pastor-aleman"],
  [/bulldog|frances|frenchie/, "bulldog-frances"],
  [/poodle|caniche/, "poodle"],
  [/chihuahua/, "chihuahua"],
  [/husky/, "husky"],
  [/shih/, "shih-tzu"],
  [/schnauzer/, "schnauzer"],
  [/pug|carlino/, "pug"],
  [/border/, "border-collie"],
  [/yorkshire|yorki|yorkie/, "yorkshire"],
  [/criollo|mestiz|cruce|sin raza/, "mestizo"],
];

const CAT_BREEDS: [RegExp, string][] = [
  [/siam/, "gato-siames"],
  [/pers/, "gato-persa"],
  [/negr|black/, "gato-negro"],
  [/naranja|anaranjad|amarill|orange|ginger/, "gato-naranja"],
  [/gris|europe|gray|grey|azul ruso/, "gato-gris"],
];

const SPECIES_DEFAULT: Record<Species, string> = {
  perro: "perro",
  gato: "gato",
  conejo: "conejo",
  ave: "ave",
  otro: "otro",
};

function normalize(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Clave del retrato para la especie y raza dadas */
export function portraitKey(species: Species, breed?: string | null): string {
  const b = breed ? normalize(breed) : "";
  const table = species === "perro" ? DOG_BREEDS : species === "gato" ? CAT_BREEDS : [];
  for (const [re, key] of table) if (re.test(b)) return key;
  return SPECIES_DEFAULT[species] ?? "otro";
}

/** Ruta pública del retrato */
export function portraitUrl(species: Species, breed?: string | null): string {
  return `/avatars/real/${portraitKey(species, breed)}.jpg`;
}
