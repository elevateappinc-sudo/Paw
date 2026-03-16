"use client";
import { useState } from "react";
import { useStore } from "@/store";
import { Plus, ChevronRight, LogOut, Trash2, Users } from "lucide-react";
import { PetForm } from "./PetForm";

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";

export function PetSelector() {
  const { currentUser, pets, users, selectPet, logout, deletePet } = useStore();
  const [showForm, setShowForm] = useState(false);

  const myPets     = pets.filter((p) => p.ownerId === currentUser?.id);
  const sharedPets = pets.filter((p) => p.ownerId !== currentUser?.id && (p.sharedWith ?? []).includes(currentUser?.id ?? ""));

  function ownerName(ownerId: string) {
    return users.find((u) => u.id === ownerId)?.name ?? "Desconocido";
  }

  function PetRow({ pet, isOwner }: { pet: typeof pets[0]; isOwner: boolean }) {
    return (
      <div style={{ marginBottom: 12 }}>
        <div
          onClick={() => selectPet(pet.id)}
          style={{
            background: "#1c1c1e", borderRadius: 16,
            padding: "16px 20px",
            display: "flex", alignItems: "center", gap: 16,
            cursor: "pointer", position: "relative", overflow: "hidden",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          {/* Color accent bar */}
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: pet.color, borderRadius: "16px 0 0 16px" }} />

          {/* Avatar */}
          <div style={{
            width: 56, height: 56, borderRadius: 16, flexShrink: 0,
            background: `${pet.color}22`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28,
          }}>
            {pet.emoji}
          </div>

          {/* Info */}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: "#ffffff", margin: 0 }}>{pet.name}</p>
              {!isOwner && (
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 999,
                  background: "rgba(10,132,255,0.15)", color: "#0a84ff",
                  letterSpacing: "0.04em",
                }}>
                  Compartida
                </span>
              )}
            </div>
            <p style={{ fontSize: 13, color: "rgba(235,235,245,0.5)", margin: "2px 0 0" }}>
              {pet.species.charAt(0).toUpperCase() + pet.species.slice(1)}
              {pet.breed ? ` · ${pet.breed}` : ""}
              {!isOwner ? ` · de ${ownerName(pet.ownerId)}` : ""}
            </p>
          </div>

          <ChevronRight size={18} color="rgba(235,235,245,0.3)" />
        </div>

        {/* Delete button — only for owner */}
        {isOwner && (
          <button
            onClick={() => {
              if (confirm(`¿Eliminar a ${pet.name}? Se borrarán todos sus datos.`)) {
                deletePet(pet.id);
              }
            }}
            style={{
              marginTop: 4, width: "100%", padding: "10px",
              background: "rgba(255,69,58,0.08)", borderRadius: 10,
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              fontSize: 13, color: "#ff453a", fontWeight: 500,
              fontFamily: FONT,
            }}
          >
            <Trash2 size={13} /> Eliminar
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100dvh", background: "#000000",
      fontFamily: FONT,
      display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{ padding: "60px 24px 32px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 13, color: "rgba(235,235,245,0.5)", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
              Bienvenido, {currentUser?.name?.split(" ")[0]}
            </p>
            <h1 style={{ fontSize: 34, fontWeight: 700, color: "#ffffff", margin: 0, letterSpacing: -0.5 }}>
              Mis mascotas
            </h1>
          </div>
          <button onClick={logout}
            style={{ padding: "8px 14px", borderRadius: 10, background: "rgba(255,255,255,0.08)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "rgba(235,235,245,0.6)", fontSize: 14, fontWeight: 500, fontFamily: FONT }}>
            <LogOut size={15} />
            Salir
          </button>
        </div>
      </div>

      <div style={{ flex: 1, padding: "0 24px", overflowY: "auto" }}>

        {/* My pets */}
        {myPets.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            {myPets.map((pet) => <PetRow key={pet.id} pet={pet} isOwner={true} />)}
          </div>
        )}

        {/* Shared with me */}
        {sharedPets.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(235,235,245,0.4)", marginBottom: 10, marginTop: 4 }}>
              Compartidas conmigo
            </p>
            {sharedPets.map((pet) => <PetRow key={pet.id} pet={pet} isOwner={false} />)}
          </div>
        )}

        {/* Empty state */}
        {myPets.length === 0 && sharedPets.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🐾</div>
            <p style={{ fontSize: 20, fontWeight: 700, color: "#ffffff", margin: 0 }}>Sin mascotas aún</p>
            <p style={{ fontSize: 15, color: "rgba(235,235,245,0.5)", marginTop: 8 }}>
              Agrega tu primera mascota para empezar
            </p>
          </div>
        )}

        {/* Info tip when only shared pets */}
        {myPets.length === 0 && sharedPets.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", background: "rgba(10,132,255,0.1)", borderRadius: 12, marginBottom: 16 }}>
            <Users size={15} color="#0a84ff" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: "rgba(235,235,245,0.7)", margin: 0 }}>
              Tienes mascotas compartidas contigo. También puedes crear las tuyas.
            </p>
          </div>
        )}

        {/* Add button */}
        <button
          onClick={() => setShowForm(true)}
          style={{
            width: "100%", padding: "16px", borderRadius: 13,
            background: "#0a84ff", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            fontSize: 17, fontWeight: 600, color: "#ffffff",
            boxShadow: "0 4px 20px rgba(10,132,255,0.3)",
            fontFamily: FONT,
          }}
        >
          <Plus size={20} /> Agregar mascota
        </button>

        <div style={{ height: 40 }} />
      </div>

      {showForm && <PetForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
