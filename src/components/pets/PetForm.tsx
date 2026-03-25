"use client";
import { useState, useEffect } from "react";
import { useStore } from "@/store";
import { useAuthContext } from "@/contexts/AuthContext";
import { X } from "lucide-react";
import type { Pet, AvatarConfig } from "@/types";
import { PetAvatar } from "./PetAvatar";
import { AvatarSelector } from "./AvatarSelector";
import { getDefaultAvatarConfig, SPECIES_VARIANTS } from "@/lib/avatar";

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";
const COLORS = ["#0a84ff", "#30d158", "#ff9f0a", "#ff453a", "#bf5af2", "#64d2ff", "#ff6b6b", "#ffd60a"];
const SPECIES = [
  { value: "perro", label: "Perro" },
  { value: "gato",  label: "Gato" },
  { value: "ave",   label: "Ave" },
  { value: "conejo",label: "Conejo" },
  { value: "otro",  label: "Otro" },
] as const;

const SPECIES_EMOJI: Record<Pet["species"], string> = {
  perro: "🐶",
  gato: "🐱",
  ave: "🐦",
  conejo: "🐰",
  otro: "🐾",
};

const inputS: React.CSSProperties = {
  width: "100%", padding: "14px 16px", fontSize: 16, color: "#fff",
  background: "transparent", border: "none", outline: "none",
  fontFamily: FONT, boxSizing: "border-box",
  colorScheme: "dark" as React.CSSProperties["colorScheme"],
};
const sectionLabel: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em",
  color: "rgba(235,235,245,0.5)", marginBottom: 6, display: "block",
};

interface PetFormProps { onClose: () => void; editPet?: Pet; }

export function PetForm({ onClose, editPet }: PetFormProps) {
  const { addPet, updatePet } = useStore();
  const { user } = useAuthContext();
  const [name,        setName]        = useState(editPet?.name ?? "");
  const [species,     setSpecies]     = useState<Pet["species"]>(editPet?.species ?? "perro");
  const [breed,       setBreed]       = useState(editPet?.breed ?? "");
  const [birthDate,   setBirthDate]   = useState(editPet?.birthDate ?? "");
  const [color,       setColor]       = useState(editPet?.color ?? "#0a84ff");
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig | null>(
    editPet?.avatar_config ?? null
  );
  // Pending species change (used for confirmation dialog)
  const [pendingSpecies, setPendingSpecies] = useState<Pet["species"] | null>(null);

  // Initialize avatar config when species first resolves (create mode)
  useEffect(() => {
    if (!avatarConfig) {
      const firstVariant = SPECIES_VARIANTS[species]?.[0];
      if (firstVariant) {
        setAvatarConfig({ style: firstVariant.style, seed: firstVariant.seed });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Build a pseudo-pet for preview (id not known yet in create mode)
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
    if (avatarConfig) {
      // Warn user that changing species resets avatar
      setPendingSpecies(newSpecies);
    } else {
      applySpeciesChange(newSpecies);
    }
  }

  function applySpeciesChange(newSpecies: Pet["species"]) {
    setSpecies(newSpecies);
    // Reset avatar to first variant for the new species
    const firstVariant = SPECIES_VARIANTS[newSpecies]?.[0];
    setAvatarConfig(firstVariant ? { style: firstVariant.style, seed: firstVariant.seed } : null);
    setPendingSpecies(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    // Derive emoji from species
    const emoji = SPECIES_EMOJI[species];

    if (editPet) {
      void updatePet(editPet.id, {
        name: name.trim(), species, breed, birthDate, emoji, color,
        avatar_config: avatarConfig,
      });
    } else {
      void addPet({
        name: name.trim(), species, breed, birthDate, emoji, color,
        avatar_config: avatarConfig,
      }, user?.id);
    }
    onClose();
  }

  const sep = <div style={{ height: 1, background: "rgba(84,84,88,0.65)", marginLeft: 16 }} />;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "flex-end", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
      <div style={{ width: "100%", maxHeight: "90dvh", overflowY: "auto", background: "#1c1c1e", borderRadius: "20px 20px 0 0", fontFamily: FONT }}>

        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)" }} />
        </div>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px 16px" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: 0 }}>
            {editPet ? "Editar mascota" : "Nueva mascota"}
          </h2>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={15} color="rgba(235,235,245,0.6)" />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "0 20px 40px" }}>

          {/* Avatar preview */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <PetAvatar
              pet={previewPet}
              size="lg"
              style={{
                borderRadius: 24,
                border: `2px solid ${color}44`,
              }}
            />
          </div>

          {/* Color picker */}
          <label style={sectionLabel}>Color de acento</label>
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            {COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setColor(c)}
                style={{
                  width: 32, height: 32, borderRadius: "50%", border: "none", cursor: "pointer",
                  background: c,
                  outline: color === c ? `3px solid ${c}` : "none", outlineOffset: 2,
                }} />
            ))}
          </div>

          {/* Name / Breed / Birthdate — grouped card */}
          <div style={{ background: "#2c2c2e", borderRadius: 13, overflow: "hidden", marginBottom: 12 }}>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Nombre de tu mascota *" required style={inputS} />
            {sep}
            <input type="text" value={breed} onChange={(e) => setBreed(e.target.value)}
              placeholder="Raza (opcional)" style={inputS} />
            {sep}
            <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)}
              style={inputS} />
          </div>

          {/* Species */}
          <label style={sectionLabel}>Especie</label>
          <div style={{ background: "#2c2c2e", borderRadius: 13, overflow: "hidden", marginBottom: 20 }}>
            {SPECIES.map((s, i) => (
              <div key={s.value}>
                {i > 0 && sep}
                <button type="button" onClick={() => handleSpeciesClick(s.value)}
                  style={{
                    width: "100%", padding: "14px 16px", textAlign: "left",
                    background: species === s.value ? `${color}18` : "transparent",
                    border: "none", cursor: "pointer",
                    fontSize: 16, color: species === s.value ? color : "#fff",
                    fontFamily: FONT, display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                  {s.label}
                  {species === s.value && <span style={{ fontSize: 16 }}>✓</span>}
                </button>
              </div>
            ))}
          </div>

          {/* Avatar selector */}
          <label style={{ ...sectionLabel, marginBottom: 12 }}>Avatar</label>
          <div style={{ marginBottom: 28 }}>
            <AvatarSelector
              pet={previewPet}
              value={avatarConfig}
              onChange={setAvatarConfig}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: "15px", borderRadius: 13, background: "rgba(255,255,255,0.08)", border: "none", cursor: "pointer", fontSize: 16, fontWeight: 600, color: "rgba(235,235,245,0.6)", fontFamily: FONT }}>
              Cancelar
            </button>
            <button type="submit"
              style={{ flex: 2, padding: "15px", borderRadius: 13, background: color, border: "none", cursor: "pointer", fontSize: 16, fontWeight: 600, color: "#fff", fontFamily: FONT }}>
              {editPet ? "Guardar cambios" : "Agregar mascota"}
            </button>
          </div>
        </form>
      </div>

      {/* Species change confirmation dialog */}
      {pendingSpecies && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
          padding: "0 24px",
        }}>
          <div style={{
            background: "#2c2c2e", borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 340,
            fontFamily: FONT,
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: "0 0 10px" }}>
              ¿Cambiar especie?
            </h3>
            <p style={{ fontSize: 15, color: "rgba(235,235,245,0.6)", margin: "0 0 24px", lineHeight: 1.5 }}>
              Cambiar la especie reseteará tu avatar. ¿Continuar?
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={() => setPendingSpecies(null)}
                style={{ flex: 1, padding: "13px", borderRadius: 12, background: "rgba(255,255,255,0.08)", border: "none", cursor: "pointer", fontSize: 15, fontWeight: 600, color: "rgba(235,235,245,0.6)", fontFamily: FONT }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => applySpeciesChange(pendingSpecies)}
                style={{ flex: 1, padding: "13px", borderRadius: 12, background: "#ff453a", border: "none", cursor: "pointer", fontSize: 15, fontWeight: 600, color: "#fff", fontFamily: FONT }}
              >
                Cambiar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
