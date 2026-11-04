"use client";
import { useEffect, useState, useCallback } from "react";
import { Settings2, UserMinus, UserCheck, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button, Card, Divider, Row, SkeletonRow, Tag, showToast } from "@/components/ui";
import PermissionsEditor from "./PermissionsEditor";

interface PetMember {
  id: string;
  pet_id: string;
  member_id: string;
  role?: string | null;
  service_type?: string | null;
  status: "pending" | "active" | "revoked";
  business_id: string | null;
  created_at: string;
}

const ROLE_LABEL: Record<string, string> = { co_owner: "Co-dueño", service_provider: "Proveedor", viewer: "Solo lectura" };
const SERVICE_LABEL: Record<string, string> = { vet: "Veterinaria", groomer: "Peluquería", walker: "Paseador", trainer: "Entrenador", daycare: "Guardería" };

interface Props {
  petId: string;
}

/** Personas con acceso a la mascota: aprobar, revocar y editar permisos. */
export default function PetMembersPanel({ petId }: Props) {
  const { user } = useAuthContext();
  const [members, setMembers] = useState<PetMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [editingPermsMemberId, setEditingPermsMemberId] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("pet_members")
      .select("id, pet_id, user_id, role, service_type, status, business_id, created_at")
      .eq("pet_id", petId)
      .neq("status", "revoked")
      .order("created_at", { ascending: false });
    setLoadError(!!error);
    // La columna en la base es user_id; aquí se usa como member_id
    setMembers(((data ?? []) as (Omit<PetMember, "member_id"> & { user_id: string })[]).map((m) => ({ ...m, member_id: m.user_id })));
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
      {loading ? (
        <Card padded={false} className="overflow-hidden" aria-busy="true">
          <SkeletonRow />
        </Card>
      ) : loadError ? (
        <Card tone="container" elevation={0} className="flex items-center justify-between gap-3">
          <p className="text-body text-text-secondary">No pudimos cargar quién tiene acceso.</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setLoading(true);
              void fetchMembers();
            }}
          >
            Reintentar
          </Button>
        </Card>
      ) : members.length === 0 ? (
        <Card tone="container" elevation={0}>
          <p className="text-body text-text-secondary">Nadie más tiene acceso a esta mascota.</p>
        </Card>
      ) : (
        <Card padded={false} className="overflow-hidden">
          {members.map((m, i) => {
            const isCurrentUser = m.member_id === user?.id;
            const pending = m.status === "pending";
            return (
              <div key={m.id}>
                {i > 0 && <Divider className="ml-18 mr-0" />}
                <Row
                  icon={pending ? <Clock size={18} aria-hidden="true" /> : <UserCheck size={18} aria-hidden="true" />}
                  iconTone={pending ? "warn" : "primary"}
                  title={
                    <span>
                      {ROLE_LABEL[m.role ?? ""] ?? "Miembro"}
                      {m.role === "service_provider" && m.service_type ? ` · ${SERVICE_LABEL[m.service_type] ?? m.service_type}` : ""}
                      {isCurrentUser && <span className="ml-2 text-small font-normal text-text-secondary">(tú)</span>}
                    </span>
                  }
                  subtitle={pending ? <Tag tone="warn" size="xs">Pendiente de aprobación</Tag> : "Acceso activo"}
                  trailing={
                    <span className="flex gap-2">
                      {pending && !isCurrentUser && (
                        <Button variant="secondary" size="icon" aria-label="Aprobar acceso" onClick={() => void handleApprove(m.id)}>
                          <UserCheck size={16} />
                        </Button>
                      )}
                      {m.status === "active" && (
                        <Button variant="secondary" size="icon" aria-label="Editar permisos" onClick={() => setEditingPermsMemberId(m.id)}>
                          <Settings2 size={16} />
                        </Button>
                      )}
                      {!isCurrentUser && (
                        <Button variant="dangerTonal" size="icon" aria-label="Quitar acceso" onClick={() => void handleRevoke(m.id)} className="border-transparent">
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
