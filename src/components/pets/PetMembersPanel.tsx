"use client";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { Users, Settings2, UserMinus, UserCheck, Clock } from "lucide-react";
import PermissionsEditor from "./PermissionsEditor";

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";
const ACCENT = "#0a84ff";

interface PetMember {
  id: string;
  pet_id: string;
  member_id: string;
  status: "pending" | "active" | "revoked";
  business_id: string | null;
  created_at: string;
}

interface Props {
  petId: string;
}

export default function PetMembersPanel({ petId }: Props) {
  const { user } = useAuthContext();
  const [members, setMembers] = useState<PetMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPermsMemberId, setEditingPermsMemberId] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("pet_members")
      .select("id, pet_id, member_id, status, business_id, created_at")
      .eq("pet_id", petId)
      .neq("status", "revoked")
      .order("created_at", { ascending: false });
    setMembers((data ?? []) as PetMember[]);
    setLoading(false);
  }, [petId]);

  useEffect(() => { void fetchMembers(); }, [fetchMembers]);

  async function handleApprove(id: string) {
    const supabase = createClient();
    await supabase.from("pet_members").update({ status: "active" }).eq("id", id);
    void fetchMembers();
  }

  async function handleRevoke(id: string) {
    const supabase = createClient();
    await supabase.from("pet_members").update({ status: "revoked" }).eq("id", id);
    void fetchMembers();
  }

  if (editingPermsMemberId) {
    return (
      <PermissionsEditor
        petMemberId={editingPermsMemberId}
        onClose={() => { setEditingPermsMemberId(null); void fetchMembers(); }}
      />
    );
  }

  return (
    <div style={{ fontFamily: FONT }}>
      <div style={{ padding: "20px 20px 8px", display: "flex", alignItems: "center", gap: 10 }}>
        <Users size={18} color="rgba(235,235,245,0.5)" />
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#fff" }}>Personas con acceso</h3>
      </div>

      {loading ? (
        <div style={{ padding: "16px 20px", color: "rgba(235,235,245,0.4)", fontSize: 14 }}>Cargando\u2026</div>
      ) : members.length === 0 ? (
        <div style={{ padding: "16px 20px 8px" }}>
          <p style={{ margin: 0, fontSize: 14, color: "rgba(235,235,245,0.4)" }}>
            Nadie m\u00e1s tiene acceso a esta mascota.
          </p>
        </div>
      ) : (
        <div style={{ padding: "4px 20px 8px" }}>
          {members.map((m) => {
            const isCurrentUser = m.member_id === user?.id;
            return (
              <div key={m.id} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, marginBottom: 8, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: m.status === "active" ? `${ACCENT}22` : "rgba(255,159,10,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {m.status === "pending" ? <Clock size={18} color="#ff9f0a" /> : <UserCheck size={18} color={ACCENT} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#fff" }}>
                    {m.member_id.slice(0, 8)}\u2026
                    {isCurrentUser && <span style={{ marginLeft: 6, fontSize: 11, color: "rgba(235,235,245,0.4)" }}>(t\u00fa)</span>}
                  </p>
                  {m.status === "pending" && (
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "#ff9f0a", fontWeight: 600 }}>Pendiente de aprobaci\u00f3n</p>
                  )}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {m.status === "pending" && !isCurrentUser && (
                    <button onClick={() => handleApprove(m.id)} style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(52,199,89,0.15)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <UserCheck size={15} color="#34c759" />
                    </button>
                  )}
                  {m.status === "active" && (
                    <button onClick={() => setEditingPermsMemberId(m.id)} style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(255,255,255,0.06)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Settings2 size={15} color="rgba(235,235,245,0.6)" />
                    </button>
                  )}
                  {!isCurrentUser && (
                    <button onClick={() => handleRevoke(m.id)} style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(255,69,58,0.1)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <UserMinus size={15} color="#ff453a" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
