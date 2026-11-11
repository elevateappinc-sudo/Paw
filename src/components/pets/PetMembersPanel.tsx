"use client";
import { useCallback, useEffect, useState } from "react";
import { Copy, MessageCircle, MessageSquareText, PawPrint, Settings2, Share2, UserMinus, Link2 } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useStore } from "@/store";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, SkeletonRow, showToast } from "@/components/ui";
import { createShareLink, fetchMemberProfiles, type MemberProfile } from "@/lib/api/sharing";
import PermissionsEditor from "./PermissionsEditor";

interface Props {
  petId: string;
  petName: string;
  /** Solo quien registró la mascota invita y quita accesos */
  isOwner: boolean;
}

/**
 * Compartir la mascota con un enlace de un solo uso (WhatsApp, mensaje de
 * texto, copiar). Quien lo abre llega al inicio de sesión y, al entrar o
 * registrarse, ve y edita lo mismo que el dueño. Debajo, quién tiene acceso.
 */
export default function PetMembersPanel({ petId, petName, isOwner }: Props) {
  const { user } = useAuthContext();
  const { fetchPets } = useStore();
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [editingPermsMemberId, setEditingPermsMemberId] = useState<string | null>(null);
  const [creatingLink, setCreatingLink] = useState(false);
  const [link, setLink] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setMembers(await fetchMemberProfiles(petId));
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    void load();
  }, [load]);

  const message = (url: string) => `Te comparto a ${petName} en Paw para que veas su salud y cuidados: ${url}`;

  async function createLink() {
    setCreatingLink(true);
    try {
      setLink(await createShareLink(petId));
    } catch (e) {
      showToast(e instanceof Error ? e.message : "No pudimos crear el enlace", () => void createLink(), "error");
    } finally {
      setCreatingLink(false);
    }
  }

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(message(url));
      showToast("Enlace copiado", undefined, "success");
    } catch {
      showToast("No pudimos copiar el enlace", undefined, "error");
    }
  }

  async function nativeShare(url: string) {
    try {
      await navigator.share({ title: `${petName} en Paw`, text: message(url) });
    } catch {
      /* cancelado */
    }
  }

  async function removeMember(m: MemberProfile) {
    if (!m.member_id) return;
    const self = m.user_id === user?.id;
    const ok = window.confirm(self ? `¿Dejar de ver a ${petName}?` : `¿Quitar el acceso de ${m.display_name || m.email || "esta persona"}?`);
    if (!ok) return;
    const { error } = await createClient().from("pet_members").update({ status: "revoked" }).eq("id", m.member_id);
    if (error) {
      showToast("No se pudo quitar el acceso", () => void removeMember(m), "error");
      return;
    }
    if (self) {
      await fetchPets();
      window.location.assign("/home");
      return;
    }
    void load();
  }

  if (editingPermsMemberId) {
    return (
      <PermissionsEditor
        petMemberId={editingPermsMemberId}
        onClose={() => {
          setEditingPermsMemberId(null);
          void load();
        }}
      />
    );
  }

  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <div className="flex flex-col gap-5 pb-2">
      {isOwner && (
        <section className="flex flex-col gap-3" aria-label="Invitar">
          {link ? (
            <Card tone="container" elevation={0} className="flex flex-col gap-3">
              <span className="flex items-center gap-2 text-small font-semibold text-text-secondary">
                <Link2 size={16} className="text-primary-text" aria-hidden="true" />
                Enlace para una persona · vence en 30 días
              </span>
              <div className="grid grid-cols-2 gap-2">
                <a href={`https://wa.me/?text=${encodeURIComponent(message(link))}`} target="_blank" rel="noopener noreferrer" className="block">
                  <Button full variant="secondary" leading={<MessageCircle size={18} />}>WhatsApp</Button>
                </a>
                <a href={`sms:?&body=${encodeURIComponent(message(link))}`} className="block">
                  <Button full variant="secondary" leading={<MessageSquareText size={18} />}>Mensaje</Button>
                </a>
                <Button full variant="secondary" leading={<Copy size={18} />} onClick={() => void copyLink(link)}>Copiar</Button>
                {canNativeShare && (
                  <Button full variant="secondary" leading={<Share2 size={18} />} onClick={() => void nativeShare(link)}>Más</Button>
                )}
              </div>
              <button type="button" onClick={() => void createLink()} className="min-h-11 self-start text-small font-semibold text-primary-text">
                Crear otro enlace
              </button>
            </Card>
          ) : (
            <Button full variant="outline" loading={creatingLink} loadingLabel="Creando" leading={<Share2 size={18} />} onClick={() => void createLink()}>
              Crear enlace para compartir
            </Button>
          )}
        </section>
      )}

      <section className="flex flex-col gap-2" aria-label="Personas con acceso">
        <h3 className="eyebrow">Con acceso</h3>
        {loading ? (
          <Card padded={false} className="overflow-hidden" aria-busy="true">
            <SkeletonRow />
          </Card>
        ) : loadError ? (
          <Card tone="container" elevation={0} className="flex items-center justify-between gap-3">
            <p className="text-body text-text-secondary">No pudimos cargar quién tiene acceso.</p>
            <Button variant="secondary" size="sm" onClick={() => { setLoading(true); void load(); }}>
              Reintentar
            </Button>
          </Card>
        ) : (
          <>
            {members.map((m) => {
              const self = m.user_id === user?.id;
              const name = m.display_name || m.email || "Sin nombre";
              return (
                <div key={m.member_id ?? m.user_id} className="flex min-h-16 items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2 shadow-1">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-soft text-primary-text">
                    {m.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <PawPrint size={18} aria-hidden="true" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-body font-semibold text-text">
                      {name}
                      {self && <span className="ml-1 font-normal text-text-secondary">(tú)</span>}
                    </span>
                    <span className="block truncate text-small text-text-secondary">{m.is_owner ? "Dueño" : m.status === "pending" ? "Pendiente" : "Ve lo mismo que tú"}</span>
                  </span>
                  {!m.is_owner && isOwner && m.status === "active" && (
                    <Button variant="secondary" size="icon" aria-label={`Permisos de ${name}`} onClick={() => setEditingPermsMemberId(m.member_id)}>
                      <Settings2 size={16} />
                    </Button>
                  )}
                  {!m.is_owner && (isOwner || self) && (
                    <Button variant="dangerTonal" size="icon" aria-label={self ? "Dejar de ver" : `Quitar a ${name}`} onClick={() => void removeMember(m)} className="border-transparent">
                      <UserMinus size={16} />
                    </Button>
                  )}
                </div>
              );
            })}
            {members.length <= 1 && (
              <p className="text-small text-text-secondary">Solo tú ves a {petName}.</p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
