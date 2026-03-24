"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { useStore } from "@/store";
import { Modal } from "@/components/ui/Modal";
import { AddMedicationForm } from "./AddMedicationForm";
import { MedicationCard, type MedicationData, type MedicationLogData } from "./MedicationCard";

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";
type Tab = "activos" | "completados" | "todos";

export function MedicationsModule() {
  const { user } = useAuthContext();
  const { selectedPetId, pets } = useStore();
  const pet = pets.find((p) => p.id === selectedPetId);
  const accentColor = pet?.color ?? "#0a84ff";

  const [tab, setTab] = useState<Tab>("activos");
  const [showAdd, setShowAdd] = useState(false);
  const [medications, setMedications] = useState<MedicationData[]>([]);
  const [logs, setLogs] = useState<MedicationLogData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user || !selectedPetId) return;
    setLoading(true);
    try {
      const supabase = createClient();

      const { data: meds } = await supabase
        .from("medications")
        .select("*")
        .eq("pet_id", selectedPetId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setMedications((meds ?? []) as MedicationData[]);

      if (meds && meds.length > 0) {
        const medIds = meds.map((m: MedicationData) => m.id);
        const { data: logsData } = await supabase
          .from("medication_logs")
          .select("*")
          .in("medication_id", medIds)
          .gte("scheduled_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order("scheduled_at", { ascending: true });

        setLogs((logsData ?? []) as MedicationLogData[]);
      } else {
        setLogs([]);
      }
  } catch (err) {
    console.error('[MedicationsModule] fetchData error:', err);
  } finally {
    setLoading(false);
  }
  }, [user, selectedPetId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const now = new Date().toISOString().split("T")[0];

  const filteredMeds = medications.filter((m) => {
    if (tab === "activos")     return m.active && (!m.end_date || m.end_date >= now);
    if (tab === "completados") return !m.active || (m.end_date != null && m.end_date < now);
    return true;
  });

  // Today's pending logs across all active medications
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todayLogs = logs.filter((l) => {
    const t = new Date(l.scheduled_at);
    return l.status === "pending" && t >= todayStart && t <= todayEnd;
  });

  function getLogsForMed(medId: string) {
    return logs.filter((l) => l.medication_id === medId);
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "activos",     label: "Activos" },
    { id: "completados", label: "Completados" },
    { id: "todos",       label: "Todos" },
  ];

  return (
    <div style={{ paddingBottom: 24, fontFamily: FONT }}>
      {/* Header */}
      <div style={{ padding: "56px 24px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", margin: 0, letterSpacing: -0.5 }}>
              Medicamentos
            </h1>
            <p style={{ fontSize: 15, color: "rgba(235,235,245,0.5)", margin: "4px 0 0" }}>
              {pet?.name ?? "Tu mascota"}
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            style={{
              width: 40, height: 40, borderRadius: 12,
              background: accentColor, border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Plus size={20} color="#fff" />
          </button>
        </div>
      </div>

      {/* Tomas de hoy */}
      {todayLogs.length > 0 && (
        <div style={{ padding: "0 16px", marginBottom: 20 }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(235,235,245,0.4)", marginBottom: 10 }}>
            Tomas de hoy ({todayLogs.length})
          </p>
          <div style={{ background: "rgba(255,159,10,0.08)", borderRadius: 14, padding: "12px 14px", border: "1px solid rgba(255,159,10,0.2)" }}>
            {todayLogs.map((log) => {
              const med = medications.find((m) => m.id === log.medication_id);
              if (!med) return null;
              const t = new Date(log.scheduled_at);
              const timeStr = t.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
              return (
                <div key={log.id} style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 6 }}>
                  <span style={{ fontSize: 14 }}>💊</span>
                  <span style={{ fontSize: 14, color: "rgba(235,235,245,0.85)" }}>
                    {med.name} — {med.dose_amount} {med.dose_unit}
                  </span>
                  <span style={{ fontSize: 12, color: "rgba(255,159,10,0.8)", marginLeft: "auto" }}>{timeStr}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ padding: "0 16px", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 4, background: "#1c1c1e", borderRadius: 12, padding: 4 }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, padding: "8px 0", borderRadius: 9, border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 600, fontFamily: FONT,
                background: tab === t.id ? accentColor : "transparent",
                color: tab === t.id ? "#fff" : "rgba(235,235,245,0.4)",
                transition: "all 0.15s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div style={{ padding: "0 16px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(235,235,245,0.3)", fontSize: 15 }}>
            Cargando...
          </div>
        ) : filteredMeds.length === 0 ? (
          <div style={{ background: "#1c1c1e", borderRadius: 20, padding: "36px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💊</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: 0 }}>
              No hay medicamentos {tab === "activos" ? "activos" : tab === "completados" ? "completados" : ""}
              {tab === "activos" ? ` para ${pet?.name ?? "tu mascota"}` : ""}
            </p>
            {tab === "activos" && (
              <p style={{ fontSize: 14, color: "rgba(235,235,245,0.5)", marginTop: 6, marginBottom: 20 }}>
                No hay medicamentos activos para {pet?.name ?? "tu mascota"}. Agrega el primero 💊
              </p>
            )}
            {tab === "activos" && (
              <button
                onClick={() => setShowAdd(true)}
                style={{
                  padding: "14px 28px", borderRadius: 13, background: accentColor,
                  border: "none", cursor: "pointer", fontSize: 15, fontWeight: 700,
                  color: "#fff", fontFamily: FONT,
                }}
              >
                Agregar medicamento
              </button>
            )}
          </div>
        ) : (
          filteredMeds.map((med) => (
            <MedicationCard
              key={med.id}
              medication={med}
              logs={getLogsForMed(med.id)}
              onUpdate={() => void fetchData()}
            />
          ))
        )}
      </div>

      {/* Add modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Nuevo medicamento">
        <AddMedicationForm
          onClose={() => setShowAdd(false)}
          onSuccess={() => void fetchData()}
        />
      </Modal>
    </div>
  );
}
