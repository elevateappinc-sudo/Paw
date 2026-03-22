import type { Pet, AvatarConfig } from "@/types";

export type DiceBearStyle = AvatarConfig["style"];

// Species → default DiceBear style mapping
export const SPECIES_STYLE_MAP: Record<Pet["species"], DiceBearStyle> = {
  perro: "adventurer",
  gato: "adventurer-neutral",
  ave: "fun-emoji",
  conejo: "lorelei",
  otro: "bottts",
};

// Available variant seeds per species (for the avatar selector)
export const SPECIES_VARIANTS: Record<Pet["species"], { style: DiceBearStyle; seed: string; label: string }[]> = {
  perro: [
    { style: "adventurer", seed: "dog-1", label: "Explorador 1" },
    { style: "adventurer", seed: "dog-2", label: "Explorador 2" },
    { style: "adventurer", seed: "dog-3", label: "Explorador 3" },
    { style: "adventurer", seed: "dog-4", label: "Explorador 4" },
    { style: "adventurer-neutral", seed: "dog-5", label: "Neutro 1" },
    { style: "adventurer-neutral", seed: "dog-6", label: "Neutro 2" },
  ],
  gato: [
    { style: "adventurer-neutral", seed: "cat-1", label: "Misterioso 1" },
    { style: "adventurer-neutral", seed: "cat-2", label: "Misterioso 2" },
    { style: "adventurer-neutral", seed: "cat-3", label: "Misterioso 3" },
    { style: "adventurer-neutral", seed: "cat-4", label: "Misterioso 4" },
    { style: "adventurer", seed: "cat-5", label: "Aventurero 1" },
    { style: "adventurer", seed: "cat-6", label: "Aventurero 2" },
  ],
  ave: [
    { style: "fun-emoji", seed: "bird-1", label: "Divertido 1" },
    { style: "fun-emoji", seed: "bird-2", label: "Divertido 2" },
    { style: "fun-emoji", seed: "bird-3", label: "Divertido 3" },
    { style: "fun-emoji", seed: "bird-4", label: "Divertido 4" },
    { style: "fun-emoji", seed: "bird-5", label: "Divertido 5" },
    { style: "fun-emoji", seed: "bird-6", label: "Divertido 6" },
  ],
  conejo: [
    { style: "lorelei", seed: "rabbit-1", label: "Encantador 1" },
    { style: "lorelei", seed: "rabbit-2", label: "Encantador 2" },
    { style: "lorelei", seed: "rabbit-3", label: "Encantador 3" },
    { style: "lorelei", seed: "rabbit-4", label: "Encantador 4" },
    { style: "lorelei", seed: "rabbit-5", label: "Encantador 5" },
    { style: "lorelei", seed: "rabbit-6", label: "Encantador 6" },
  ],
  otro: [
    { style: "bottts", seed: "other-1", label: "Robot 1" },
    { style: "bottts", seed: "other-2", label: "Robot 2" },
    { style: "bottts", seed: "other-3", label: "Robot 3" },
    { style: "bottts", seed: "other-4", label: "Robot 4" },
    { style: "bottts", seed: "other-5", label: "Robot 5" },
    { style: "bottts", seed: "other-6", label: "Robot 6" },
  ],
};

/**
 * Given a pet, return the avatar_config it should have.
 * Uses pet.id as the seed (lazy init) unless avatar_config is already set.
 */
export function getDefaultAvatarConfig(pet: Pick<Pet, "id" | "species">): AvatarConfig {
  return {
    style: SPECIES_STYLE_MAP[pet.species] ?? "bottts",
    seed: pet.id,
  };
}
