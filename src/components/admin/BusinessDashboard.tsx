"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Business } from "@/hooks/useBusinesses";

interface PetMember {
  id: string;
  pet_id: string;
  member_id: string;
  status: string;
  created_at: string;
  pet: {
    id: string;
    name: string;
    species: string;
    emoji: string;
  };
  member_profile: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface Props {
  business: Business;
}

export default function BusinessDashboard({ business }: Props) {
  const [clients, setClients] = useState<PetMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data, error: err } = await supabase
        .from("pet_members")
        .select(`
          id, pet_id, member_id, status, created_at,
          pet:pets(id, name, species, emoji),
          member_profile:users(id, full_name, avatar_url)
        `)
        .eq("business_id", business.id)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (err) {
        setError(err.message);
      } else {
        setClients((data as unknown as PetMember[]) ?? []);
      }
      setLoading(false);
    };

    void fetchClients();
  }, [business.id]);

  if (loading) {
    return (
      <div style={{ padding: "32px 0", textAlign: "center", color: "rgba(235,235,245,0.4)" }}>
        Cargando clientes...
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 0" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 700 }}>Mascotas-Cliente</h2>
        <span style={{ background: "rgba(10,132,255,0.15)", color: "#0a84ff", fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>
          {clients.length} activas
        </span>
      </div>

      {error && (
        <div style={{ background: "rgba(255,69,58,0.15)", borderRadius: 10, padding: "10px 14px", color: "#ff453a", fontSize: 14, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {clients.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🐾</div>
          <p style={{ color: "rgba(235,235,245,0.5)", fontSize: 15 }}>
            Aún no tienes mascotas-cliente vinculadas.
          </p>
          <p style={{ color: "rgba(235,235,245,0.3)", fontSize: 13, marginTop: 6 }}>
            Comparte tu QR para que los dueños puedan vincular sus mascotas.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {clients.map((client) => (
            <div
              key={client.id}
              style={{
                background: "rgba(255,255,255,0.04)",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.08)",
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: "rgba(10,132,255,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
              }}>
                {client.pet?.emoji ?? "🐾"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "#fff", fontWeight: 600, fontSize: 15 }}>
                  {client.pet?.name ?? "Mascota"}
                </div>
                <div style={{ color: "rgba(235,235,245,0.4)", fontSize: 12, marginTop: 2 }}>
                  {client.member_profile?.full_name ?? "Propietario"} · {client.pet?.species ?? ""}
                </div>
              </div>
              <div style={{
                background: "rgba(48,209,88,0.15)", color: "#30d158",
                fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 8,
              }}>
                Activo
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
