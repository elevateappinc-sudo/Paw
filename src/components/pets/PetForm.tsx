"use client";
import { useState } from "react";
import { useStore } from "@/store";
import { X } from "lucide-react";
import type { Pet } from "@/types";

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";
const EMOJIS = ["🐶", "🐱", "🐰", "🐹", "🐦", "🐠", "🦜", "🐢", "🦎", "🐇"];
const COLORS = ["#0a84ff", "#30d158", "#ff9f0a", "#ff453a", "#bf5af2", "#64d2ff", "#ff6b6b", "#ffd60a"];
const SPECIES = [
  { value: "perro", label: "Perro" },
  { value: "gato",  label: "Gato" },
  { value: "ave",   label: "Ave" },
  { value: "conejo",label: "Conejo" },
  { value: "otro",  label: "Otro" },
] as const;

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
  const [name,      setName]      = useState(editPet?.name ?? "");
  const [species,   setSpecies]   = useState<Pet["species"]>(editPet?.species ?? "perro");
  const [breed,     setBreed]     = useState(editPet?.breed ?? "");
  const [birthDate, setBirthDate] = useState(editPet?.birthDate ?? "");
  const [emoji,     setEmoji]     = useState(editPet?.emoji ?? "🐶");
  const [color,     setColor]     = useState(editPet?.color ?? "#0a84ff");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (editPet) updatePet(editPet.id, { name: name.trim(), species, breed, birthDate, emoji, color });
    else addPet({ name: name.trim(), species, breed, birthDate, emoji, color });
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

          {/* Emoji + Color preview */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <div style={{
              width: 88, height: 88, borderRadius: 24,
              background: `${color}22`, fontSize: 44,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: `2px solid ${color}44`,
            }}>
              {emoji}
            </div>
          </div>

          {/* Emoji picker */}
          <label style={sectionLabel}>Emoji</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {EMOJIS.map((e) => (
              <button key={e} type="button" onClick={() => setEmoji(e)}
                style={{
                  width: 44, height: 44, borderRadius: 12, border: "none", cursor: "pointer",
                  fontSize: 22,
                  background: emoji === e ? `${color}25` : "rgba(255,255,255,0.06)",
                  outline: emoji === e ? `2px solid ${color}` : "none", outlineOffset: 1,
                }}>
                {e}
              </button>
            ))}
          </div>

          {/* Color picker */}
          <label style={sectionLabel}>Color</label>
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
          <div style={{ background: "#2c2c2e", borderRadius: 13, overflow: "hidden", marginBottom: 28 }}>
            {SPECIES.map((s, i) => (
              <div key={s.value}>
                {i > 0 && sep}
                <button type="button" onClick={() => setSpecies(s.value)}
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
    </div>
  );
}
