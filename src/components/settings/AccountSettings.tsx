"use client";
import { useState } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { Link2, LinkIcon, Loader2, CheckCircle2 } from "lucide-react";

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";

interface AccountSettingsProps {
  /** Whether the user's account already has Google linked (from users table) */
  googleLinked: boolean;
  /** Called when link status changes so parent can refresh */
  onGoogleLinkChange?: (linked: boolean) => void;
}

export function AccountSettings({ googleLinked, onGoogleLinkChange }: AccountSettingsProps) {
  const { user } = useAuthContext();
  const { linkGoogleAccount } = useAuth();
  const [linkLoading, setLinkLoading] = useState(false);
  const [unlinkLoading, setUnlinkLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const supabase = createClient();

  async function handleLinkGoogle() {
    if (!user) return;
    setError("");
    setSuccess("");

    // Check if user's Google email matches the account email
    const googleEmail = user.user_metadata?.email ?? user.email;
    if (googleEmail && googleEmail !== user.email) {
      setError(
        `El email de tu cuenta Google (${googleEmail}) no coincide con tu cuenta PAW (${user.email}). Solo puedes vincular con el mismo email.`
      );
      return;
    }

    setLinkLoading(true);
    try {
      const result = await linkGoogleAccount();
      if (!result.ok) {
        setError(result.error ?? "No pudimos vincular tu cuenta de Google.");
        return;
      }
      // OAuth redirect will handle the rest — update DB after redirect via callback
      // For immediate optimistic update:
      const now = new Date().toISOString();
      await supabase
        .from("users")
        .update({
          google_linked: true,
          google_linked_at: now,
        })
        .eq("id", user.id);

      setSuccess("¡Cuenta de Google vinculada exitosamente!");
      onGoogleLinkChange?.(true);
    } catch {
      setError("No pudimos conectar con Google. Intenta de nuevo.");
    } finally {
      setLinkLoading(false);
    }
  }

  async function handleUnlinkGoogle() {
    if (!user) return;
    setError("");
    setSuccess("");
    setUnlinkLoading(true);

    try {
      // Remove Google identity from Supabase Auth
      const { data: identities } = await supabase.auth.getUserIdentities();
      const googleIdentity = identities?.identities?.find((id: { provider: string }) => id.provider === "google");

      if (googleIdentity) {
        const { error: unlinkError } = await supabase.auth.unlinkIdentity(googleIdentity);
        if (unlinkError) {
          setError(unlinkError.message ?? "Error al desvincular Google.");
          return;
        }
      }

      // Update users table
      await supabase
        .from("users")
        .update({
          google_linked: false,
          google_id: null,
          google_linked_at: null,
        })
        .eq("id", user.id);

      setSuccess("Cuenta de Google desvinculada.");
      onGoogleLinkChange?.(false);
    } catch {
      setError("No pudimos desvincular tu cuenta de Google. Intenta de nuevo.");
    } finally {
      setUnlinkLoading(false);
    }
  }

  const isLoading = linkLoading || unlinkLoading;

  return (
    <div style={{ fontFamily: FONT }}>
      <p style={{
        fontSize: 12, fontWeight: 600, letterSpacing: "0.08em",
        textTransform: "uppercase", color: "rgba(235,235,245,0.4)", marginBottom: 10,
      }}>
        Cuentas vinculadas
      </p>

      <div style={{ background: "#1c1c1e", borderRadius: 16, overflow: "hidden", marginBottom: 12 }}>
        {/* Google row */}
        <div style={{
          display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
        }}>
          {/* Google logo */}
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "1px solid rgba(84,84,88,0.3)",
          }}>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: 0 }}>Google</p>
            <p style={{ fontSize: 12, color: "rgba(235,235,245,0.4)", margin: 0 }}>
              {googleLinked ? "Cuenta vinculada" : "No vinculada"}
            </p>
          </div>

          {googleLinked ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle2 size={16} color="#30d158" />
              <button
                onClick={handleUnlinkGoogle}
                disabled={isLoading}
                style={{
                  padding: "7px 14px", borderRadius: 9,
                  background: "rgba(255,69,58,0.12)", border: "1px solid rgba(255,69,58,0.25)",
                  color: "#ff453a", fontSize: 13, fontWeight: 600, cursor: isLoading ? "not-allowed" : "pointer",
                  opacity: isLoading ? 0.7 : 1, fontFamily: FONT,
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                {unlinkLoading ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : null}
                {unlinkLoading ? "Desvinculando..." : "Desvincular"}
              </button>
            </div>
          ) : (
            <button
              onClick={handleLinkGoogle}
              disabled={isLoading}
              style={{
                padding: "7px 14px", borderRadius: 9,
                background: "rgba(10,132,255,0.12)", border: "1px solid rgba(10,132,255,0.25)",
                color: "#0a84ff", fontSize: 13, fontWeight: 600, cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.7 : 1, fontFamily: FONT,
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              {linkLoading
                ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                : <Link2 size={13} />
              }
              {linkLoading ? "Vinculando..." : "Vincular"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{
          padding: "12px 16px", borderRadius: 10, marginBottom: 12,
          background: "rgba(255,69,58,0.15)", fontSize: 14, color: "#ff453a",
        }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{
          padding: "12px 16px", borderRadius: 10, marginBottom: 12,
          background: "rgba(48,209,88,0.12)", fontSize: 14, color: "#30d158",
        }}>
          {success}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
