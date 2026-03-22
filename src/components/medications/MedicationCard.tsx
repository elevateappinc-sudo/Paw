"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useStore } from "@/store";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";

export interface MedicationData {
  id: string;
  name: string;
  dose_amount: number;
  dose_unit: string;
  frequency_value: number;
  frequency_unit: "hours" | "days" | "times_per_day" | "weekly";
  start_date: string;
  end_date: string | null;
  active: boolean;
  vet_name?: string | null;
  reason?: string | null;
}

export interface MedicationLogData {
  id: string;
  medication_id: string;
  scheduled_at: string;
  administered_at: string | null;
  status: "pending" | "administered" | "missed" | "skipped";
}

interface Props {
  medication: MedicationData;
  logs: MedicationLogData[];
  onUpdate: () => void;
}

function frequencyLabel(value: number, unit: string): string {
  switch (unit) {
    case "hours":      return `Cada ${value}h`;
    case "days":       return `Cada ${value} día${value !== 1 ? "s" : ""}`;
    case "times_per_day": return `${value}x/día`;
    case "weekly":     return `Cada ${value} semana${value !== 1 ? "s" : ""}`;
    default:           return `${value} ${unit}`;
  }
}

function getNextDose(logs: MedicationLogData[]): string | null {
  const now = new Date();
  const future = logs
    .filter((l) => l.status === "pending" && new Date(l.scheduled_at) >= now)
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

  if (future.length === 0) return null;

  const next = new Date(future[0].scheduled_at);
  const todayStr = now.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
  const nextDateStr = next.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
  const timeStr = next.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

  if (todayStr === nextDateStr) {
    return `Hoy ${timeStr}`;
  }
  return `${nextDateStr} ${timeStr}`;
}

function hasTodayPending(logs: MedicationLogData[]): MedicationLogData | null {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  return logs.find((l) =>
    l.status === "pending" &&
    new Date(l.scheduled_at) >= startOfDay &&
    new Date(l.scheduled_at) <= endOfDay
  ) ?? null;
}

type BadgeVariant = "success" | "neutral" | "error";
function getBadge(medication: MedicationData): { label: string; variant: BadgeVariant } {
  if (!medication.active) {
    return { label: "Discontinuado", variant: "error" };
  }
  const now = new Date().toISOString().split("T")[0];
  if (medication.end_date && medication.end_date < now) {
    return { label: "Completado", variant: "neutral" };
  }
  return { label: "Activo", variant: "success" };
}

export function MedicationCard({ medication, logs, onUpdate }: Props) {
  const { pets, selectedPetId } = useStore();
  const pet = pets.find((p) => p.id === selectedPetId);
  const accentColor = pet?.color ?? "var(--color-accent)";

  const [loading, setLoading] = useState(false);

  const badge = getBadge(medication);
  const nextDose = getNextDose(logs);
  const todayLog = hasTodayPending(logs);

  async function handleRegisterDose() {
    if (!todayLog) return;
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase
        .from("medication_logs")
        .update({ status: "administered", administered_at: new Date().toISOString() })
        .eq("id", todayLog.id);
      onUpdate();
    } finally {
      setLoading(false);
    }
  }

  async function handleDiscontinue() {
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase
        .from("medications")
        .update({ active: false, updated_at: new Date().toISOString() })
        .eq("id", medication.id);
      onUpdate();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      background: "#1c1c1e", borderRadius: 16, padding: "16px",
      marginBottom: 10, fontFamily: FONT,
      border: medication.active ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(255,69,58,0.15)",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>💊 {medication.name}</span>
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>
          <p style={{ fontSize: 13, color: "rgba(235,235,245,0.5)", margin: "4px 0 0" }}>
            {medication.dose_amount} {medication.dose_unit} · {frequencyLabel(medication.frequency_value, medication.frequency_unit)}
          </p>
          {medication.vet_name && (
            <p style={{ fontSize: 12, color: "rgba(235,235,245,0.35)", margin: "2px 0 0" }}>
              Vet: {medication.vet_name}
            </p>
          )}
        </div>
      </div>

      {/* Next dose */}
      {nextDose && medication.active && (
        <div style={{
          background: `${accentColor}12`, borderRadius: 10, padding: "8px 12px",
          display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
        }}>
          <span style={{ fontSize: 14 }}>⏰</span>
          <p style={{ fontSize: 13, fontWeight: 600, color: accentColor, margin: 0 }}>
            Próxima dosis: {nextDose}
          </p>
        </div>
      )}

      {/* Actions */}
      {medication.active && (
        <div style={{ display: "flex", gap: 8 }}>
          {todayLog && (
            <Button
              variant="primary"
              size="sm"
              loading={loading}
              onClick={() => void handleRegisterDose()}
              className="flex-[2]"
            >
              ✓ Registrar toma
            </Button>
          )}
          <Button
            variant="danger"
            size="sm"
            loading={loading}
            onClick={() => void handleDiscontinue()}
            className="flex-1"
          >
            Discontinuar
          </Button>
        </div>
      )}
    </div>
  );
}
