"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface LocalPet {
  id: string;
  name: string;
  species: "perro" | "gato" | "ave" | "conejo" | "otro";
  breed?: string;
  birthDate?: string;
  weight?: number;
  emoji?: string;
  color?: string;
  sharedWith?: string[];
}

interface LocalStore {
  state?: {
    pets?: LocalPet[];
  };
}

interface MigrationModalProps {
  user: User;
  onComplete: () => void;
}

type MigrationStatus = "idle" | "loading" | "success" | "error";

export function MigrationModal({ user, onComplete }: MigrationModalProps) {
  const [status, setStatus] = useState<MigrationStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleMigrate() {
    setStatus("loading");
    setErrorMsg("");

    try {
      const supabase = createClient();
      const rawStore = localStorage.getItem("paw-store-v3");
      const parsedStore: LocalStore | null = rawStore ? (JSON.parse(rawStore) as LocalStore) : null;
      const localPets = parsedStore?.state?.pets ?? [];

      if (localPets.length > 0) {
        const petsToInsert = localPets.map((pet) => ({
          user_id: user.id,
          name: pet.name,
          species: pet.species,
          breed: pet.breed ?? null,
          birth_date: pet.birthDate ?? null,
          weight: pet.weight ?? null,
          emoji: pet.emoji ?? null,
          color: pet.color ?? null,
          shared_with: [],
        }));

        const { error: insertError } = await supabase.from("pets").insert(petsToInsert);
        if (insertError) throw insertError;
      }

      // Mark migration as completed
      const { error: updateError } = await supabase
        .from("users")
        .update({ migration_completed: true })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Clear localStorage pets (keep other state)
      if (rawStore) {
        const parsed: LocalStore = JSON.parse(rawStore) as LocalStore;
        if (parsed.state) {
          parsed.state.pets = [];
        }
        localStorage.setItem("paw-store-v3", JSON.stringify(parsed));
      }

      setStatus("success");
      setTimeout(() => onComplete(), 2000);
    } catch (err) {
      console.error("Migration error:", err);
      setErrorMsg("No pudimos migrar algunos datos. Intenta de nuevo.");
      setStatus("error");
    }
  }

  async function handleSkip() {
    const supabase = createClient();
    await supabase
      .from("users")
      .update({ migration_completed: true })
      .eq("id", user.id);
    onComplete();
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.8)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
    }}>
      <div style={{
        background: "#1c1c1e", borderRadius: 20,
        padding: 28, maxWidth: 360, width: "100%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
      }}>
        {status === "success" ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🐾</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#ffffff", margin: "0 0 8px" }}>
              ¡Todo listo!
            </h2>
            <p style={{ fontSize: 15, color: "rgba(235,235,245,0.6)", margin: 0 }}>
              Tus datos están seguros en la nube.
            </p>
          </div>
        ) : status === "loading" ? (
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 17, color: "#ffffff", margin: 0 }}>
              Migrando tus datos... 🐾
            </p>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#ffffff", margin: "0 0 12px" }}>
              Datos guardados localmente
            </h2>
            <p style={{ fontSize: 15, color: "rgba(235,235,245,0.6)", margin: "0 0 24px", lineHeight: 1.5 }}>
              Encontramos datos guardados localmente. ¿Los migramos a tu cuenta?
            </p>

            {status === "error" && (
              <div style={{
                padding: "12px 16px", borderRadius: 10, marginBottom: 16,
                background: "rgba(255,69,58,0.15)",
                fontSize: 14, color: "#ff453a",
              }}>
                {errorMsg}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={handleMigrate}
                style={{
                  width: "100%", padding: "14px", borderRadius: 13, border: "none",
                  background: "#0a84ff", color: "#ffffff",
                  fontSize: 16, fontWeight: 600, cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {status === "error" ? "Reintentar migración" : "Migrar mis datos"}
              </button>
              <button
                onClick={handleSkip}
                style={{
                  width: "100%", padding: "14px", borderRadius: 13, border: "none",
                  background: "rgba(120,120,128,0.24)", color: "rgba(235,235,245,0.6)",
                  fontSize: 16, fontWeight: 600, cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Empezar de cero
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
