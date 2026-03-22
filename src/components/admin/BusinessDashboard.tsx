"use client";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useBusinesses, type Business } from "@/hooks/useBusinesses";
import { BusinessProfile } from "./BusinessProfile";
import { Building2, Plus, Users, PawPrint, Check, X } from "lucide-react";

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";
const ACCENT = "#0a84ff";

interface PetMember {
  id: string;
  pet_id: string;
  member_id: string;
  status: "pending" | "active" | "revoked";
  created_at: string;
  pet?: { name: string; emoji: string; species: string };
  member?: { email: string; full_name?: string };
}

interface CreateBusinessFormProps {
  onCreate: (name: string, description: string) => Promise<void>;
}

function CreateBusinessForm({ onCreate }: CreateBusinessFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("El nombre es obligatorio"); return; }
    setSaving(true);
    setError("");
    try {
      await onCreate(name.trim(), description.trim());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al crear");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: "0 20px" }}>
      <div style={{ padding: "40px 0 20px", textAlign: "center" }}>
        <div style={{ width: 80, height: 80, borderRadius: 22, background: `${ACCENT}22`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <Building2 size={38} color={ACCENT} />
        </div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#fff" }}>Crear mi negocio</h2>
        <p style={{ margin: "8px 0 0", fontSize: 15, color: "rgba(235,235,245,0.5)" }}>
          Registra tu veterinaria, peluquería canina u otro negocio para vincularte con mascotas de tus clientes.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 16, overflow: "hidden", marginBottom: 12 }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(84,84,88,0.4)" }}>
            <label style={{ fontSize: 12, color: "rgba(235,235,245,0.5)", textTransform: "uppercase", letterSpacing: 1 }}>Nombre del negocio *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Veterinaria Los Pinos"
              required
              style={{
                display: "block", width: "100%", marginTop: 6,
                background: "transparent", border: "none",
                color: "#fff", fontSize: 16, outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ padding: "14px 16px" }}>
            <label style={{ fontSize: 12, color: "rgba(235,235,245,0.5)", textTransform: "uppercase", letterSpacing: 1 }}>Descripción (opcional)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Atención veterinaria integral"
              style={{
                display: "block", width: "100%", marginTop: 6,
                background: "transparent", border: "none",
                color: "#fff", fontSize: 16, outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {error && <p style={{ color: "#ff453a", fontSize: 13, marginBottom: 12 }}>{error}</p>}

        <button
          type="submit"
          disabled={saving}
          style={{
            width: "100%", padding: "14px", borderRadius: 14,
            background: ACCENT, border: "none", color: "#fff", fontSize: 16, fontWeight: 600,
            cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          <Plus size={18} /> {saving ? "Creando…" : "Crear negocio"}
        </button>
      </form>
    </div>
  );
}

export function BusinessDashboard() {
  const { businesses, loading, createBusiness, refetch } = useBusinesses();
  const [petMembers, setPetMembers] = useState<PetMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [activeTab, setActiveTab] = useState<"perfil" | "mascotas">("perfil");

  // Select first business automatically
  useEffect(() => {
    if (businesses.length > 0 && !selectedBusiness) {
      setSelectedBusiness(businesses[0]);
    }
  }, [businesses, selectedBusiness]);

  const fetchPetMembers = useCallback(async (businessId: string) => {
    setLoadingMembers(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("pet_members")
      .select(`
        id, pet_id, member_id, status, created_at,
        pets(name, emoji, species),
        users:member_id(email, full_name)
      `)
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setPetMembers((data ?? []).map((row: any) => ({
      ...row,
      pet: row.pets,
      member: row.users,
    })));
    setLoadingMembers(false);
  }, []);

  useEffect(() => {
    if (selectedBusiness) {
      void fetchPetMembers(selectedBusiness.id);
    }
  }, [selectedBusiness, fetchPetMembers]);

  async function handleApprove(petMemberId: string) {
    const supabase = createClient();
    await supabase.from("pet_members").update({ status: "active" }).eq("id", petMemberId);
    if (selectedBusiness) void fetchPetMembers(selectedBusiness.id);
  }

  async function handleRevoke(petMemberId: string) {
    const supabase = createClient();
    await supabase.from("pet_members").update({ status: "revoked" }).eq("id", petMemberId);
    if (selectedBusiness) void fetchPetMembers(selectedBusiness.id);
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: "rgba(235,235,245,0.4)", fontFamily: FONT }}>Cargando…</div>;
  }

  if (businesses.length === 0) {
    return <CreateBusinessForm onCreate={async (n, d) => { await createBusiness(n, d); }} />;
  }

  const business = selectedBusiness ?? businesses[0];
  const pendingCount = petMembers.filter((pm) => pm.status === "pending").length;

  return (
    <div style={{ fontFamily: FONT, paddingBottom: 40 }}>
      {/* Business selector if multiple */}
      {businesses.length > 1 && (
        <div style={{ padding: "16px 20px 0", display: "flex", gap: 8, overflowX: "auto" }}>
          {businesses.map((b) => (
            <button key={b.id} onClick={() => setSelectedBusiness(b)}
              style={{
                padding: "8px 16px", borderRadius: 20, border: "none", cursor: "pointer",
                background: business.id === b.id ? ACCENT : "rgba(255,255,255,0.08)",
                color: business.id === b.id ? "#fff" : "rgba(235,235,245,0.6)",
                fontSize: 14, fontWeight: 600, whiteSpace: "nowrap",
              }}
            >
              {b.name}
            </button>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", padding: "16px 20px 0", gap: 0, borderBottom: "1px solid rgba(84,84,88,0.4)" }}>
        {(["perfil", "mascotas"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{
              padding: "10px 20px", background: "none", border: "none", cursor: "pointer",
              fontSize: 15, fontWeight: 600,
              color: activeTab === tab ? "#fff" : "rgba(235,235,245,0.4)",
              borderBottom: activeTab === tab ? `2px solid ${ACCENT}` : "2px solid transparent",
              marginBottom: -1, textTransform: "capitalize", position: "relative",
            }}
          >
            {tab === "mascotas" ? "Mascotas" : "Perfil"}
            {tab === "mascotas" && pendingCount > 0 && (
              <span style={{
                position: "absolute", top: 8, right: 6, width: 8, height: 8,
                borderRadius: "50%", background: "#ff9f0a",
              }} />
            )}
          </button>
        ))}
      </div>

      {activeTab === "perfil" && (
        <BusinessProfile business={business} onUpdate={refetch} />
      )}

      {activeTab === "mascotas" && (
        <div style={{ padding: "16px 20px" }}>
          {loadingMembers ? (
            <div style={{ textAlign: "center", color: "rgba(235,235,245,0.4)", padding: 40 }}>Cargando…</div>
          ) : petMembers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <PawPrint size={28} color="rgba(235,235,245,0.3)" />
              </div>
              <p style={{ color: "rgba(235,235,245,0.4)", fontSize: 15 }}>
                Aún no hay mascotas vinculadas.
              </p>
              <p style={{ color: "rgba(235,235,245,0.3)", fontSize: 13 }}>
                Comparte el código QR para que los dueños se vinculen.
              </p>
            </div>
          ) : (
            petMembers.map((pm) => (
              <div key={pm.id} style={{
                background: "rgba(255,255,255,0.06)", borderRadius: 14, marginBottom: 10,
                padding: 16, display: "flex", alignItems: "center", gap: 12,
              }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                  {pm.pet?.emoji ?? "🐾"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#fff" }}>
                    {pm.pet?.name ?? "Mascota"}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(235,235,245,0.4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {pm.member?.email ?? pm.member_id}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {pm.status === "pending" ? (
                    <>
                      <button onClick={() => handleApprove(pm.id)}
                        style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(52,199,89,0.15)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Check size={16} color="#34c759" />
                      </button>
                      <button onClick={() => handleRevoke(pm.id)}
                        style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,69,58,0.12)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <X size={16} color="#ff453a" />
                      </button>
                    </>
                  ) : (
                    <span style={{
                      padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                      background: pm.status === "active" ? "rgba(52,199,89,0.15)" : "rgba(255,69,58,0.12)",
                      color: pm.status === "active" ? "#34c759" : "#ff453a",
                    }}>
                      {pm.status === "active" ? "Activo" : "Revocado"}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}

          <button
            onClick={() => { void createBusiness("Nuevo negocio"); }}
            style={{
              display: "none", // Hide for now — multiple businesses not in scope
            }}
          >
            <Plus size={16} /> Añadir negocio
          </button>
        </div>
      )}

      {/* Add another business button */}
      <div style={{ padding: "0 20px" }}>
        <button
          onClick={async () => {
            const name = window.prompt("Nombre del nuevo negocio:");
            if (name?.trim()) {
              await createBusiness(name.trim());
            }
          }}
          style={{
            width: "100%", padding: "12px", borderRadius: 12,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(235,235,245,0.5)", fontSize: 14, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          <Plus size={15} /> Crear otro negocio
        </button>
      </div>
    </div>
  );
}
