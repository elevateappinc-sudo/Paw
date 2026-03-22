"use client";
import { useState } from "react";
import { useStore } from "@/store";
import { useAuthContext } from "@/contexts/AuthContext";
import { Pencil, UserPlus, X, Users, Crown } from "lucide-react";
import { PetPhotos } from "./PetPhotos";
import { PetForm } from "./PetForm";
import { PetAvatar } from "./PetAvatar";
import { formatDate } from "@/lib/utils";

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";

export function PetInfoModule() {
  const { pets, selectedPetId, selectPet } = useStore();
  const { user: currentUser } = useAuthContext();
  const pet = pets.find((p) => p.id === selectedPetId);
  const [editing, setEditing] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareError, setShareError] = useState("");
  const [shareSuccess, setShareSuccess] = useState("");

  if (!pet) return null;

  const isOwner = pet.ownerId === currentUser?.id;
  const collaborators: { id: string; name: string; email: string }[] = [];

  function calcAge(birthDate: string) {
    const birth = new Date(birthDate);
    const now = new Date();
    const totalMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    if (totalMonths < 12) return `${totalMonths} meses`;
    return `${Math.floor(totalMonths / 12)} año${Math.floor(totalMonths / 12) !== 1 ? "s" : ""}`;
  }

  function handleShare(e: React.FormEvent) {
    e.preventDefault();
    setShareError("");
    setShareSuccess("");
    // TODO: Implement sharing via Supabase in future sprint
    setShareError("Compartir pets via Supabase se implementará próximamente.");
  }

  const rows = [
    { label: "Nombre",     value: pet.name },
    { label: "Especie",    value: pet.species.charAt(0).toUpperCase() + pet.species.slice(1) },
    { label: "Raza",       value: pet.breed || null },
    { label: "Nacimiento", value: pet.birthDate ? formatDate(pet.birthDate) : null },
    { label: "Edad",       value: pet.birthDate ? calcAge(pet.birthDate) : null },
  ].filter((r) => r.value !== null) as { label: string; value: string }[];

  const sep = (ml = 16) => <div style={{ height: 1, background: "rgba(84,84,88,0.65)", marginLeft: ml }} />;

  return (
    <div style={{ paddingBottom: 40, fontFamily: FONT }}>

      {/* Hero */}
      <div style={{ padding: "56px 24px 32px", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <PetAvatar
            pet={pet}
            size="lg"
            style={{
              borderRadius: 28,
              border: `2px solid ${pet.color}33`,
              width: 100, height: 100,
            }}
          />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", margin: 0 }}>{pet.name}</h1>
        <p style={{ fontSize: 15, color: "rgba(235,235,245,0.5)", marginTop: 6 }}>
          {pet.species.charAt(0).toUpperCase() + pet.species.slice(1)}
          {pet.breed ? ` · ${pet.breed}` : ""}
        </p>
        {!isOwner && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 8, padding: "4px 12px", borderRadius: 999, background: "rgba(10,132,255,0.12)" }}>
            <Users size={12} color="#0a84ff" />
            <span style={{ fontSize: 12, color: "#0a84ff", fontWeight: 600 }}>
              Compartida por otro usuario
            </span>
          </div>
        )}
      </div>

      <div style={{ padding: "0 16px" }}>

        {/* Info rows */}
        <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(235,235,245,0.4)", marginBottom: 10 }}>
          Información
        </p>
        <div style={{ background: "#1c1c1e", borderRadius: 16, overflow: "hidden", marginBottom: 20 }}>
          {rows.map((row, i) => (
            <div key={row.label}>
              {i > 0 && sep()}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px" }}>
                <span style={{ fontSize: 16, color: "rgba(235,235,245,0.55)" }}>{row.label}</span>
                <span style={{ fontSize: 16, fontWeight: 500, color: "#ffffff" }}>{row.value}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Sharing section — owner only */}
        {isOwner && (
          <>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(235,235,245,0.4)", marginBottom: 10 }}>
              Acceso compartido
            </p>

            <div style={{ background: "#1c1c1e", borderRadius: 16, overflow: "hidden", marginBottom: 12 }}>
              {/* Owner row */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: `${pet.color}22`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Crown size={16} color={pet.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: 0 }}>
                    {(currentUser?.user_metadata?.full_name as string | undefined) ?? currentUser?.email?.split("@")[0] ?? "Tú"}
                  </p>
                  <p style={{ fontSize: 12, color: "rgba(235,235,245,0.4)", margin: 0 }}>{currentUser?.email}</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 999, background: `${pet.color}18`, color: pet.color }}>
                  Dueño
                </span>
              </div>

              {/* Collaborators — populated from Supabase in future sprint */}
              {collaborators.map((collab) => (
                <div key={collab.id}>
                  {sep(60)}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px" }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: "rgba(255,255,255,0.06)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 15, fontWeight: 700, color: "rgba(235,235,245,0.6)",
                    }}>
                      {collab.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: 0 }}>{collab.name}</p>
                      <p style={{ fontSize: 12, color: "rgba(235,235,245,0.4)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{collab.email}</p>
                    </div>
                    <button
                      onClick={() => { /* TODO: unshare via Supabase */ }}
                      style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,69,58,0.12)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                    >
                      <X size={13} color="#ff453a" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Share by email form */}
            <div style={{ background: "#1c1c1e", borderRadius: 16, overflow: "hidden", marginBottom: 20 }}>
              <form onSubmit={handleShare}>
                <div style={{ display: "flex", alignItems: "center", padding: "4px 8px 4px 16px", gap: 8 }}>
                  <UserPlus size={16} color="rgba(235,235,245,0.3)" style={{ flexShrink: 0 }} />
                  <input
                    type="email"
                    value={shareEmail}
                    onChange={(e) => { setShareEmail(e.target.value); setShareError(""); setShareSuccess(""); }}
                    placeholder="Email del usuario a invitar"
                    style={{
                      flex: 1, padding: "12px 0", fontSize: 15, color: "#fff",
                      background: "transparent", border: "none", outline: "none",
                      fontFamily: FONT,
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      padding: "8px 16px", borderRadius: 10, background: pet.color,
                      border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600,
                      color: "#fff", fontFamily: FONT, flexShrink: 0,
                    }}
                  >
                    Invitar
                  </button>
                </div>
              </form>
              {shareError && (
                <div style={{ padding: "8px 16px 12px", fontSize: 13, color: "#ff453a" }}>
                  {shareError}
                </div>
              )}
              {shareSuccess && (
                <div style={{ padding: "8px 16px 12px", fontSize: 13, color: "#30d158" }}>
                  {shareSuccess}
                </div>
              )}
            </div>
          </>
        )}

        {/* Photos */}
        <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(235,235,245,0.4)", marginBottom: 10 }}>
          Fotos {pet.photos?.length > 0 ? `· ${pet.photos.length}` : ""}
        </p>
        <div style={{ marginBottom: 20 }}>
          <PetPhotos
            petId={pet.id}
            photos={pet.photos ?? []}
            accentColor={pet.color}
            canEdit={true}
          />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {isOwner && (
            <button onClick={() => setEditing(true)} style={{
              width: "100%", padding: "16px", borderRadius: 13, border: "none",
              background: pet.color, color: "#fff", fontSize: 17, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              fontFamily: FONT,
            }}>
              <Pencil size={18} /> Editar información
            </button>
          )}
          <button onClick={() => selectPet(null)} style={{
            width: "100%", padding: "16px", borderRadius: 13, border: "none",
            background: "rgba(255,255,255,0.07)", color: "rgba(235,235,245,0.6)", fontSize: 17, fontWeight: 600, cursor: "pointer",
            fontFamily: FONT,
          }}>
            Cambiar mascota
          </button>
        </div>
      </div>

      {editing && <PetForm onClose={() => setEditing(false)} editPet={pet} />}
    </div>
  );
}
