"use client";
import { useState } from "react";
import { Pill, Clock, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, Tag, Button } from "@/components/ui";
import type { ChipTone } from "@/components/ui/Chip";

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

export function frequencyLabel(value: number, unit: string): string {
  switch (unit) {
    case "hours":
      return `Cada ${value} h`;
    case "days":
      return `Cada ${value} día${value !== 1 ? "s" : ""}`;
    case "times_per_day":
      return `${value} ${value === 1 ? "vez" : "veces"} al día`;
    case "weekly":
      return `Cada ${value} semana${value !== 1 ? "s" : ""}`;
    default:
      return `${value} ${unit}`;
  }
}

function getNextDose(logs: MedicationLogData[]): string | null {
  const now = new Date();
  const future = logs
    .filter((l) => l.status === "pending" && new Date(l.scheduled_at) >= now)
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

  if (future.length === 0) return null;

  const next = new Date(future[0].scheduled_at);
  const todayStr = now.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
  const nextDateStr = next.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
  const timeStr = next.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });

  if (todayStr === nextDateStr) return `Hoy ${timeStr}`;
  return `${nextDateStr} ${timeStr}`;
}

function hasTodayPending(logs: MedicationLogData[]): MedicationLogData | null {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  return logs.find((l) => l.status === "pending" && new Date(l.scheduled_at) >= startOfDay && new Date(l.scheduled_at) <= endOfDay) ?? null;
}

function getBadge(medication: MedicationData): { label: string; tone: ChipTone } {
  if (!medication.active) return { label: "Suspendido", tone: "danger" };
  const now = new Date().toISOString().split("T")[0];
  if (medication.end_date && medication.end_date < now) return { label: "Completado", tone: "neutral" };
  return { label: "Activo", tone: "ok" };
}

export function MedicationCard({ medication, logs, onUpdate }: Props) {
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
    <Card tone={medication.active ? "surface" : "container"} elevation={medication.active ? 1 : 0}>
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-primary-container text-on-primary-container">
          <Pill size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate text-[16px] font-bold text-on">{medication.name}</span>
            <Tag tone={badge.tone} size="xs">{badge.label}</Tag>
          </div>
          <p className="mt-0.5 text-[13px] text-on-variant">
            {medication.dose_amount} {medication.dose_unit} · {frequencyLabel(medication.frequency_value, medication.frequency_unit)}
          </p>
          {medication.vet_name && <p className="text-[12px] text-on-variant">Vet: {medication.vet_name}</p>}
        </div>
      </div>

      {nextDose && medication.active && (
        <div className="mt-3 flex items-center gap-2 rounded-control bg-info-container px-3 py-2 text-[13px] font-bold text-on-info-container">
          <Clock size={15} className="text-info" aria-hidden="true" />
          Próxima dosis: {nextDose}
        </div>
      )}

      {medication.active && (
        <div className="mt-3 flex gap-2">
          {todayLog && (
            <Button onClick={() => void handleRegisterDose()} loading={loading} leading={<Check size={16} />} className="flex-[2]" size="sm">
              Registrar toma
            </Button>
          )}
          <Button variant="dangerTonal" size="sm" onClick={() => void handleDiscontinue()} disabled={loading} className="flex-1">
            Suspender
          </Button>
        </div>
      )}
    </Card>
  );
}
