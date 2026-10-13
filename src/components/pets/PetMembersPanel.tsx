"use client";
import { useEffect, useState, useCallback } from "react";
import { Users, Settings2, UserMinus, UserCheck, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button, Card, Divider, Row, SectionTitle, SkeletonRow, Tag, showToast } from "@/components/ui";
import PermissionsEditor from "./PermissionsEditor";

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

/** Personas con acceso a la mascota: aprobar, revocar y editar permisos. */
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

  useEffect(() => {
    void fetchMembers();
  }, [fetchMembers]);

  async function handleApprove(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("pet_members").update({ status: "active" }).eq("id", id);
    if (error) showToast("No se pudo aprobar el acceso", () => void handleApprove(id), "error");
    void fetchMembers();
  }

  async function handleRevoke(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("pet_members").update({ status: "revoked" }).eq("id", id);
    if (error) showToast("No se pudo quitar el acceso", () => void handleRevoke(id), "error");
    void fetchMembers();
  }

  if (editingPermsMemberId) {
    return (
      <PermissionsEditor
        petMemberId={editingPermsMemberId}
        onClose={() => {
          setEditingPermsMemberId(null);
          void fetchMembers();
        }}
      />
    );
  }

  return (
    <section className="flex flex-col gap-3" aria-label="Personas con acceso">
      <SectionTitle>
        <span className="inline-flex items-center gap-2">
          <Users size={20} className="text-on-variant" aria-hidden="true" /> Personas con acceso
        </span>
      </SectionTitle>

      {loading ? (
        <Card padded={false} className="overflow-hidden" aria-busy="true">
          <SkeletonRow />
        </Card>
      ) : members.length === 0 ? (
        <Card tone="container" elevation={0}>
          <p className="text-[14px] text-on-variant">Nadie más tiene acceso a esta mascota.</p>
        </Card>
      ) : (
        <Card padded={false} className="overflow-hidden">
          {members.map((m, i) => {
            const isCurrentUser = m.member_id === user?.id;
            const pending = m.status === "pending";
            return (
              <div key={m.id}>
                {i > 0 && <Divider className="ml-[72px] mr-0" />}
                <Row
                  icon={pending ? <Clock size={18} aria-hidden="true" /> : <UserCheck size={18} aria-hidden="true" />}
                  iconTone={pending ? "warn" : "primary"}
                  title={
                    <span>
                      {m.member_id.slice(0, 8)}…{isCurrentUser && <span className="ml-1.5 text-[12px] font-semibold text-on-variant">(tú)</span>}
                    </span>
                  }
                  subtitle={pending ? <Tag tone="warn" size="xs">Pendiente de aprobación</Tag> : "Acceso activo"}
                  trailing={
                    <span className="flex gap-1">
                      {pending && !isCurrentUser && (
                        <Button variant="tonal" size="icon" aria-label="Aprobar acceso" onClick={() => void handleApprove(m.id)} className="min-h-[40px] min-w-[40px]">
                          <UserCheck size={16} />
                        </Button>
                      )}
                      {m.status === "active" && (
                        <Button variant="secondary" size="icon" aria-label="Editar permisos" onClick={() => setEditingPermsMemberId(m.id)} className="min-h-[40px] min-w-[40px]">
                          <Settings2 size={16} />
                        </Button>
                      )}
                      {!isCurrentUser && (
                        <Button variant="dangerTonal" size="icon" aria-label="Quitar acceso" onClick={() => void handleRevoke(m.id)} className="min-h-[40px] min-w-[40px] border-transparent">
                          <UserMinus size={16} />
                        </Button>
                      )}
                    </span>
                  }
                />
              </div>
            );
          })}
        </Card>
      )}
    </section>
  );
}
