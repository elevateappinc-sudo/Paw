"use client";
import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { useStore } from "@/store";
import { useAuthContext } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button, Chip, ChipRow, Input, Sheet } from "@/components/ui";
import type { Pet, AvatarConfig } from "@/types";
import { PetAvatar } from "./PetAvatar";
import { AvatarSelector } from "./AvatarSelector";
import { SPECIES_VARIANTS } from "@/lib/avatar";

/** Colores de mascota: dato de la mascota (no del tema), por eso van en línea. */
const COLORS = [
  { value: "#357050", label: "Salvia" },
  { value: "#2f6f8f", label: "Lago" },
  { value: "#8a5a00", label: "Ámbar" },
  { value: "#b3261e", label: "Rojo" },
  { value: "#6b4fbb", label: "Lila" },
  { value: "#c2410c", label: "Terracota" },
  { value: "#0f766e", label: "Verde azulado" },
  { value: "#7e7268", label: "Piedra" },
];
const SPECIES = [
  { value: "perro", label: "Perro" },
  { value: "gato", label: "Gato" },
  { value: "ave", label: "Ave" },
  { value: "conejo", label: "Conejo" },
  { value: "otro", label: "Otro" },
] as const;

const SPECIES_EMOJI: Record<Pet["species"], string> = {
  perro: "🐶",
  gato: "🐱",
  ave: "🐦",
  conejo: "🐰",
  otro: "🐾",
};

interface PetFormProps {
  onClose: () => void;
  editPet?: Pet;
  /** Por defecto abierto; permite animar el cierre desde el padre */
  open?: boolean;
}

export function PetForm({ onClose, editPet, open = true }: PetFormProps) {
  const { addPet, updatePet } = useStore();
  const { user } = useAuthContext();
  const [name, setName] = useState(editPet?.name ?? "");
  const [species, setSpecies] = useState<Pet["species"]>(editPet?.species ?? "perro");
  const [breed, setBreed] = useState(editPet?.breed ?? "");
  const [birthDate, setBirthDate] = useState(editPet?.birthDate ?? "");
  const [color, setColor] = useState(editPet?.color ?? COLORS[0].value);
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig | null>(editPet?.avatar_config ?? null);
  const [pendingSpecies, setPendingSpecies] = useState<Pet["species"] | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!avatarConfig) {
      const firstVariant = SPECIES_VARIANTS[species]?.[0];
      if (firstVariant) setAvatarConfig({ style: firstVariant.style, seed: firstVariant.seed });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const previewPet: Pet = {
    id: editPet?.id ?? "preview",
    ownerId: user?.id ?? "",
    sharedWith: [],
    name: name || "Mascota",
    species,
    emoji: SPECIES_EMOJI[species],
    color,
    photos: [],
    avatar_config: avatarConfig,
    createdAt: new Date().toISOString(),
  };

  function handleSpeciesClick(newSpecies: Pet["species"]) {
    if (newSpecies === species) return;
    if (avatarConfig) setPendingSpecies(newSpecies);
    else applySpeciesChange(newSpecies);
  }

  function applySpeciesChange(newSpecies: Pet["species"]) {
    setSpecies(newSpecies);
    const firstVariant = SPECIES_VARIANTS[newSpecies]?.[0];
    setAvatarConfig(firstVariant ? { style: firstVariant.style, seed: firstVariant.seed } : null);
    setPendingSpecies(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const emoji = SPECIES_EMOJI[species];
    setSaving(true);
    try {
      if (editPet) {
        await updatePet(editPet.id, { name: name.trim(), species, breed, birthDate, emoji, color, avatar_config: avatarConfig });
      } else {
        await addPet({ name: name.trim(), species, breed, birthDate, emoji, color, avatar_config: avatarConfig }, user?.id);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Sheet
        open={open}
        onClose={onClose}
        title={editPet ? "Editar mascota" : "Nueva mascota"}
        footer={
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" form="pet-form" loading={saving} disabled={!name.trim()} className="flex-[2]">
              {editPet ? "Guardar cambios" : "Agregar mascota"}
            </Button>
          </div>
        }
      >
        <form id="pet-form" onSubmit={handleSubmit} className="flex flex-col gap-5 pt-1">
          <div className="flex justify-center">
            <div className="rounded-full p-[3px]" style={{ background: color }}>
              <div className="overflow-hidden rounded-full border-[3px] border-surface bg-surface-3">
                <PetAvatar pet={previewPet} size="lg" style={{ borderRadius: "50%" }} />
              </div>
            </div>
          </div>

          <Input label="Nombre" required placeholder="Cómo se llama" value={name} onChange={(e) => setName(e.target.value)} />

          <fieldset>
            <legend className="mb-1.5 text-[13px] font-semibold text-on-variant">Especie</legend>
            <ChipRow>
              {SPECIES.map((s) => (
                <Chip key={s.value} selected={species === s.value} onClick={() => handleSpeciesClick(s.value)}>
                  {s.label}
                </Chip>
              ))}
            </ChipRow>
          </fieldset>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Raza" placeholder="Opcional" value={breed} onChange={(e) => setBreed(e.target.value)} />
            <Input label="Fecha de nacimiento" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
          </div>

          <fieldset>
            <legend className="mb-1.5 text-[13px] font-semibold text-on-variant">Color de la mascota</legend>
            <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Color de la mascota">
              {COLORS.map((c) => {
                const on = color === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    aria-label={c.label}
                    onClick={() => setColor(c.value)}
                    className={cn("flex h-10 w-10 items-center justify-center rounded-full text-white transition-transform active:scale-95", on && "ring-2 ring-primary ring-offset-2 ring-offset-surface")}
                    style={{ background: c.value }}
                  >
                    {on && <Check size={18} aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-[13px] font-semibold text-on-variant">Avatar</legend>
            <AvatarSelector pet={previewPet} value={avatarConfig} onChange={setAvatarConfig} />
          </fieldset>
        </form>
      </Sheet>

      <Sheet open={pendingSpecies !== null} onClose={() => setPendingSpecies(null)} title="¿Cambiar la especie?">
        <div className="flex flex-col gap-4 pb-2">
          <p className="text-[15px] leading-relaxed text-on-variant">Al cambiar la especie, el avatar vuelve al predeterminado. ¿Quieres continuar?</p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setPendingSpecies(null)} className="flex-1">
              Cancelar
            </Button>
            <Button variant="danger" onClick={() => pendingSpecies && applySpeciesChange(pendingSpecies)} className="flex-1">
              Cambiar
            </Button>
          </div>
        </div>
      </Sheet>
    </>
  );
}
