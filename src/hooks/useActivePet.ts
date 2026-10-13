"use client";
import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/store";

/**
 * Mascota activa: ?pet=<id> en la URL manda; si no, la seleccionada en el store;
 * si no, la primera. Mantiene el store sincronizado.
 */
export function useActivePet() {
  const params = useSearchParams();
  const { pets, selectedPetId, selectPet } = useStore();
  const fromUrl = params.get("pet");

  useEffect(() => {
    if (fromUrl && fromUrl !== selectedPetId && pets.some((p) => p.id === fromUrl)) selectPet(fromUrl);
  }, [fromUrl, selectedPetId, pets, selectPet]);

  const pet = useMemo(() => {
    const id = fromUrl && pets.some((p) => p.id === fromUrl) ? fromUrl : selectedPetId;
    return pets.find((p) => p.id === id) ?? pets[0] ?? null;
  }, [fromUrl, selectedPetId, pets]);

  return { pet, pets, selectPet };
}
