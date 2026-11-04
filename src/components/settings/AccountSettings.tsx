"use client";
import { useState } from "react";
import { Link2 } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, Row, StatusChip, showToast } from "@/components/ui";
import { GoogleLogo } from "./GoogleLogo";

interface AccountSettingsProps {
  /** Si la cuenta ya tiene Google vinculado (tabla users) */
  googleLinked: boolean;
  /** Avisa al padre cuando cambia el estado de vinculación */
  onGoogleLinkChange?: (linked: boolean) => void;
}

/** Sección "Cuentas vinculadas": vincular o desvincular Google. */
export function AccountSettings({ googleLinked, onGoogleLinkChange }: AccountSettingsProps) {
  const { user } = useAuthContext();
  const { linkGoogleAccount } = useAuth();
  const [linked, setLinked] = useState(googleLinked);
  const [linkLoading, setLinkLoading] = useState(false);
  const [unlinkLoading, setUnlinkLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  function setLinkedState(v: boolean) {
    setLinked(v);
    onGoogleLinkChange?.(v);
  }

  async function handleLinkGoogle() {
    if (!user) return;
    setError("");

    const googleEmail = user.user_metadata?.email ?? user.email;
    if (googleEmail && googleEmail !== user.email) {
      setError(`El correo de tu cuenta de Google (${googleEmail}) no coincide con tu cuenta de Paw (${user.email}). Solo puedes vincular con el mismo correo.`);
      return;
    }

    setLinkLoading(true);
    try {
      const result = await linkGoogleAccount();
      if (!result.ok) {
        setError(result.error ?? "No pudimos vincular tu cuenta de Google.");
        return;
      }
      const now = new Date().toISOString();
      await supabase.from("users").update({ google_linked: true, google_linked_at: now }).eq("id", user.id);
      showToast("Cuenta de Google vinculada", undefined, "success");
      setLinkedState(true);
    } catch {
      setError("No pudimos conectar con Google. Inténtalo de nuevo.");
    } finally {
      setLinkLoading(false);
    }
  }

  async function handleUnlinkGoogle() {
    if (!user) return;
    setError("");
    setUnlinkLoading(true);
    try {
      const { data: identities } = await supabase.auth.getUserIdentities();
      const googleIdentity = identities?.identities?.find((id: { provider: string }) => id.provider === "google");
      if (googleIdentity) {
        const { error: unlinkError } = await supabase.auth.unlinkIdentity(googleIdentity);
        if (unlinkError) {
          setError(unlinkError.message ?? "No pudimos desvincular Google.");
          return;
        }
      }
      await supabase.from("users").update({ google_linked: false, google_id: null, google_linked_at: null }).eq("id", user.id);
      showToast("Cuenta de Google desvinculada", undefined, "success");
      setLinkedState(false);
    } catch {
      setError("No pudimos desvincular tu cuenta de Google. Inténtalo de nuevo.");
    } finally {
      setUnlinkLoading(false);
    }
  }

  const isLoading = linkLoading || unlinkLoading;

  return (
    <div className="flex flex-col gap-2">
      <Card padded={false} className="overflow-hidden">
        <Row
          icon={
            <span className="flex h-11 w-11 items-center justify-center rounded-sm border border-border bg-surface">
              <GoogleLogo />
            </span>
          }
          iconTone="container"
          title="Google"
          subtitle={linked ? "Cuenta vinculada" : "No vinculada"}
          trailing={
            linked ? (
              <span className="flex items-center gap-2">
                <StatusChip severity="ok">Vinculada</StatusChip>
                <Button variant="dangerTonal" size="sm" onClick={() => void handleUnlinkGoogle()} loading={unlinkLoading} disabled={isLoading}>
                  Desvincular
                </Button>
              </span>
            ) : (
              <Button variant="secondary" size="sm" leading={<Link2 size={14} />} onClick={() => void handleLinkGoogle()} loading={linkLoading} disabled={isLoading}>
                Vincular
              </Button>
            )
          }
          className="[&>div:first-child]:bg-transparent"
        />
      </Card>
      {error && (
        <Card tone="overdue" elevation={0} role="alert" className="py-3 text-body">
          {error}
        </Card>
      )}
    </div>
  );
}
