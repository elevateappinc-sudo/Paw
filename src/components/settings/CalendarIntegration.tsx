"use client";
// PAW · CalendarIntegration Settings Component
// Sprint 3 · T003

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { Calendar, CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react";

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";

const EVENT_TYPE_LABELS: Record<string, string> = {
  comida: "🍽️ Comida",
  salida: "🚶 Salida",
  cita_vet: "🏥 Cita veterinario",
  entrenamiento: "🏋️ Entrenamiento",
};

const ALL_EVENT_TYPES = Object.keys(EVENT_TYPE_LABELS);

interface CalendarIntegrationRow {
  user_id: string;
  sync_enabled: boolean;
  synced_event_types: string[];
  updated_at: string;
}

export function CalendarIntegration() {
  const { user } = useAuthContext();
  const supabase = createClient();

  const [integration, setIntegration] = useState<CalendarIntegrationRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Handle redirect query params from OAuth callback
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const gcal = params.get("gcal");
    if (gcal === "connected") {
      setSuccess("✅ Google Calendar conectado correctamente.");
      // Remove query param from URL without reload
      window.history.replaceState({}, "", window.location.pathname);
    } else if (gcal === "denied") {
      setError("Acceso denegado. Puedes intentarlo de nuevo cuando quieras.");
      window.history.replaceState({}, "", window.location.pathname);
    } else if (gcal === "error") {
      const reason = params.get("reason") ?? "unknown";
      setError(`Error al conectar Google Calendar (${reason}). Intenta de nuevo.`);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const fetchIntegration = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from("calendar_integrations")
      .select("user_id, sync_enabled, synced_event_types, updated_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError) {
      console.error("CalendarIntegration fetch error:", fetchError);
    }
    setIntegration(data ?? null);
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    fetchIntegration();
  }, [fetchIntegration]);

  const isConnected = !!integration;

  async function handleConnect() {
    window.location.href = "/auth/google-calendar";
  }

  async function handleDisconnect() {
    if (!user || !integration) return;
    setDisconnecting(true);
    setError("");
    setSuccess("");

    const { error: deleteError } = await supabase
      .from("calendar_integrations")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) {
      setError("Error al desconectar. Intenta de nuevo.");
    } else {
      setIntegration(null);
      setSuccess("Google Calendar desconectado.");
    }
    setDisconnecting(false);
  }

  async function handleToggleSync(enabled: boolean) {
    if (!user || !integration) return;
    setSaving(true);
    setError("");

    const { error: updateError } = await supabase
      .from("calendar_integrations")
      .update({ sync_enabled: enabled })
      .eq("user_id", user.id);

    if (updateError) {
      setError("Error al guardar. Intenta de nuevo.");
    } else {
      setIntegration({ ...integration, sync_enabled: enabled });
    }
    setSaving(false);
  }

  async function handleToggleEventType(type: string, checked: boolean) {
    if (!user || !integration) return;
    setSaving(true);
    setError("");

    const current = integration.synced_event_types ?? [];
    const updated = checked
      ? [...new Set([...current, type])]
      : current.filter((t) => t !== type);

    const { error: updateError } = await supabase
      .from("calendar_integrations")
      .update({ synced_event_types: updated })
      .eq("user_id", user.id);

    if (updateError) {
      setError("Error al guardar. Intenta de nuevo.");
    } else {
      setIntegration({ ...integration, synced_event_types: updated });
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(235,235,245,0.4)", fontFamily: FONT, fontSize: 14 }}>
        <Loader2 size={16} className="animate-spin" />
        Cargando integración…
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, fontFamily: FONT }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: isConnected ? "rgba(52,199,89,0.15)" : "rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Calendar size={22} color={isConnected ? "#34c759" : "rgba(235,235,245,0.4)"} />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "rgba(235,235,245,0.9)" }}>
            Google Calendar
          </div>
          <div style={{ fontSize: 12, color: "rgba(235,235,245,0.4)", marginTop: 2 }}>
            {isConnected ? (
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#34c759", display: "inline-block" }} />
                Conectado
              </span>
            ) : "No conectado"}
          </div>
        </div>

        {/* Connect / Disconnect button */}
        <div style={{ marginLeft: "auto" }}>
          {isConnected ? (
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              style={{
                padding: "7px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                background: "rgba(255,59,48,0.12)", color: "#ff3b30",
                border: "1px solid rgba(255,59,48,0.2)", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
                opacity: disconnecting ? 0.6 : 1,
              }}
            >
              {disconnecting ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
              Desconectar
            </button>
          ) : (
            <button
              onClick={handleConnect}
              style={{
                padding: "7px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                background: "rgba(10,132,255,0.15)", color: "#0a84ff",
                border: "1px solid rgba(10,132,255,0.25)", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <CheckCircle2 size={13} />
              Conectar Google Calendar
            </button>
          )}
        </div>
      </div>

      {/* Settings — only shown when connected */}
      {isConnected && (
        <>
          {/* Sync toggle */}
          <div style={{
            background: "rgba(255,255,255,0.04)", borderRadius: 14,
            padding: "14px 16px", border: "1px solid rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "rgba(235,235,245,0.9)" }}>
                Sincronización activa
              </div>
              <div style={{ fontSize: 12, color: "rgba(235,235,245,0.4)", marginTop: 2 }}>
                Sincronizar eventos automáticamente
              </div>
            </div>
            <button
              onClick={() => handleToggleSync(!integration.sync_enabled)}
              disabled={saving}
              aria-label={integration.sync_enabled ? "Desactivar sync" : "Activar sync"}
              style={{
                width: 44, height: 26, borderRadius: 13, border: "none",
                background: integration.sync_enabled ? "#34c759" : "rgba(255,255,255,0.1)",
                cursor: "pointer", position: "relative", transition: "background 0.2s",
                opacity: saving ? 0.6 : 1,
              }}
            >
              <span style={{
                position: "absolute", top: 3,
                left: integration.sync_enabled ? 21 : 3,
                width: 20, height: 20, borderRadius: "50%",
                background: "white", transition: "left 0.2s",
                boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
              }} />
            </button>
          </div>

          {/* Event types */}
          <div style={{
            background: "rgba(255,255,255,0.04)", borderRadius: 14,
            padding: "14px 16px", border: "1px solid rgba(255,255,255,0.08)",
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(235,235,245,0.6)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Tipos de evento a sincronizar
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {ALL_EVENT_TYPES.map((type) => {
                const checked = (integration.synced_event_types ?? []).includes(type);
                return (
                  <label key={type} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => handleToggleEventType(type, e.target.checked)}
                      disabled={saving || !integration.sync_enabled}
                      style={{ width: 16, height: 16, accentColor: "#0a84ff", cursor: "pointer" }}
                    />
                    <span style={{ fontSize: 14, color: integration.sync_enabled ? "rgba(235,235,245,0.8)" : "rgba(235,235,245,0.35)" }}>
                      {EVENT_TYPE_LABELS[type]}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Last sync info */}
          <div style={{ fontSize: 12, color: "rgba(235,235,245,0.3)", display: "flex", alignItems: "center", gap: 6 }}>
            <RefreshCw size={12} />
            Última actualización:{" "}
            {integration.updated_at
              ? new Date(integration.updated_at).toLocaleString("es-ES", {
                  day: "2-digit", month: "short", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })
              : "nunca"}
          </div>
        </>
      )}

      {/* Feedback messages */}
      {error && (
        <div style={{
          padding: "10px 14px", borderRadius: 10,
          background: "rgba(255,59,48,0.1)", border: "1px solid rgba(255,59,48,0.2)",
          color: "#ff6b6b", fontSize: 13,
        }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{
          padding: "10px 14px", borderRadius: 10,
          background: "rgba(52,199,89,0.1)", border: "1px solid rgba(52,199,89,0.2)",
          color: "#34c759", fontSize: 13,
        }}>
          {success}
        </div>
      )}
    </div>
  );
}
