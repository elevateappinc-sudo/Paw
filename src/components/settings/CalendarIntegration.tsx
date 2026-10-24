"use client";
// Paw · Integración con Google Calendar (ajustes)

import { useState, useEffect, useCallback } from "react";
import { Calendar, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button, Card, Divider, PawDotsLoader, Row, SkeletonRow, Toggle, showToast } from "@/components/ui";

const EVENT_TYPE_LABELS: Record<string, string> = {
  comida: "Comidas",
  salida: "Salidas",
  cita_vet: "Citas veterinarias",
  entrenamiento: "Entrenamiento",
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

  // Resultado del callback OAuth (?gcal=connected|denied|error)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const gcal = params.get("gcal");
    if (!gcal) return;
    if (gcal === "connected") showToast("Google Calendar conectado", undefined, "success");
    else if (gcal === "denied") setError("Acceso denegado. Puedes intentarlo de nuevo cuando quieras.");
    else if (gcal === "error") setError(`No se pudo conectar Google Calendar (${params.get("reason") ?? "desconocido"}). Inténtalo de nuevo.`);
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  const fetchIntegration = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from("calendar_integrations")
      .select("user_id, sync_enabled, synced_event_types, updated_at")
      .eq("user_id", user.id)
      .maybeSingle();
    if (fetchError) console.error("CalendarIntegration fetch error:", fetchError);
    setIntegration(data ?? null);
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    void fetchIntegration();
  }, [fetchIntegration]);

  const isConnected = !!integration;

  function handleConnect() {
    window.location.href = "/auth/google-calendar";
  }

  async function handleDisconnect() {
    if (!user || !integration) return;
    setDisconnecting(true);
    setError("");
    const { error: deleteError } = await supabase.from("calendar_integrations").delete().eq("user_id", user.id);
    if (deleteError) setError("No se pudo desconectar. Inténtalo de nuevo.");
    else {
      setIntegration(null);
      showToast("Google Calendar desconectado");
    }
    setDisconnecting(false);
  }

  async function handleToggleSync(enabled: boolean) {
    if (!user || !integration) return;
    setSaving(true);
    setError("");
    const { error: updateError } = await supabase.from("calendar_integrations").update({ sync_enabled: enabled }).eq("user_id", user.id);
    if (updateError) setError("No se pudo guardar. Inténtalo de nuevo.");
    else setIntegration({ ...integration, sync_enabled: enabled });
    setSaving(false);
  }

  async function handleToggleEventType(type: string, checked: boolean) {
    if (!user || !integration) return;
    setSaving(true);
    setError("");
    const current = integration.synced_event_types ?? [];
    const updated = checked ? [...new Set([...current, type])] : current.filter((t) => t !== type);
    const { error: updateError } = await supabase.from("calendar_integrations").update({ synced_event_types: updated }).eq("user_id", user.id);
    if (updateError) setError("No se pudo guardar. Inténtalo de nuevo.");
    else setIntegration({ ...integration, synced_event_types: updated });
    setSaving(false);
  }

  if (loading) {
    return (
      <Card padded={false} className="overflow-hidden" aria-busy="true">
        <SkeletonRow />
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Card padded={false} className="overflow-hidden">
        <Row
          icon={<Calendar size={20} aria-hidden="true" />}
          iconTone={isConnected ? "ok" : "container"}
          title="Google Calendar"
          subtitle={isConnected ? "Conectado" : "No conectado"}
          trailing={
            isConnected ? (
              <Button variant="dangerTonal" size="sm" onClick={() => void handleDisconnect()} loading={disconnecting}>
                Desconectar
              </Button>
            ) : (
              <Button size="sm" onClick={handleConnect}>
                Conectar
              </Button>
            )
          }
        />
      </Card>

      {isConnected && integration && (
        <Card padded={false} className="overflow-hidden">
          <div className="px-4">
            <Toggle label="Sincronización activa" description="Añade los eventos de Paw a tu calendario" checked={integration.sync_enabled} onChange={(v) => void handleToggleSync(v)} />
          </div>
          <Divider className="mx-0" />
          <fieldset className="px-4 py-2" disabled={saving || !integration.sync_enabled}>
            <legend className="pt-2 text-small font-semibold text-text-secondary">Tipos de evento a sincronizar</legend>
            {ALL_EVENT_TYPES.map((type) => {
              const checked = (integration.synced_event_types ?? []).includes(type);
              return (
                <label key={type} className={cn("flex min-h-11 cursor-pointer items-center gap-3", !integration.sync_enabled && "opacity-50")}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => void handleToggleEventType(type, e.target.checked)}
                    className="h-5 w-5 rounded-sm accent-primary"
                  />
                  <span className="text-body text-text">{EVENT_TYPE_LABELS[type]}</span>
                </label>
              );
            })}
          </fieldset>
          <Divider className="mx-0" />
          <p className="flex items-center gap-2 px-4 py-3 text-small text-text-secondary">
            <RefreshCw size={14} aria-hidden="true" />
            Última actualización:{" "}
            {integration.updated_at
              ? new Date(integration.updated_at).toLocaleString("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
              : "nunca"}
            {saving && <PawDotsLoader size={16} label="Guardando" />}
          </p>
        </Card>
      )}

      {error && (
        <Card tone="overdue" elevation={0} role="alert" className="py-3 text-body">
          {error}
        </Card>
      )}
    </div>
  );
}
