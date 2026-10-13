"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Pill } from "lucide-react";
import { motion } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { useStore } from "@/store";
import { PageHeader, Button, Card, CardHeader, SegmentedControl, Sheet, EmptyState, Skeleton } from "@/components/ui";
import { fadeUp, stagger } from "@/lib/motion";
import { AddMedicationForm } from "./AddMedicationForm";
import { MedicationCard, type MedicationData, type MedicationLogData } from "./MedicationCard";

type Tab = "activos" | "completados" | "todos";

const TABS: { value: Tab; label: string }[] = [
  { value: "activos", label: "Activos" },
  { value: "completados", label: "Completados" },
  { value: "todos", label: "Todos" },
];

export function MedicationsSkeleton({ embedded }: { embedded?: boolean }) {
  return (
    <div className="flex flex-col gap-3 px-4 pb-8" aria-busy="true">
      {!embedded && (
        <div className="flex items-end justify-between pt-[max(14px,env(safe-area-inset-top))] pb-2">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-8 w-40" />
          </div>
          <Skeleton className="h-11 w-11 rounded-full" />
        </div>
      )}
      <Skeleton className="h-11 w-full rounded-[11px]" />
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-[120px] w-full rounded-card-lg" />
      ))}
    </div>
  );
}

/**
 * Medicamentos de la mascota seleccionada.
 * `embedded`: sin cabecera (cuando se muestra dentro de otra pantalla).
 */
export function MedicationsModule({ embedded = false }: { embedded?: boolean }) {
  const { user } = useAuthContext();
  const { selectedPetId, pets } = useStore();
  const pet = pets.find((p) => p.id === selectedPetId);

  const [tab, setTab] = useState<Tab>("activos");
  const [showAdd, setShowAdd] = useState(false);
  const [medications, setMedications] = useState<MedicationData[]>([]);
  const [logs, setLogs] = useState<MedicationLogData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user || !selectedPetId) return;
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();

      const { data: meds, error: medsErr } = await supabase
        .from("medications")
        .select("*")
        .eq("pet_id", selectedPetId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (medsErr) throw medsErr;

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
      console.error("[MedicationsModule] fetchData error:", err);
      setError("No pudimos cargar los medicamentos.");
    } finally {
      setLoading(false);
    }
  }, [user, selectedPetId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const now = new Date().toISOString().split("T")[0];

  const filteredMeds = medications.filter((m) => {
    if (tab === "activos") return m.active && (!m.end_date || m.end_date >= now);
    if (tab === "completados") return !m.active || (m.end_date != null && m.end_date < now);
    return true;
  });

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

  const addButton = (
    <Button variant="primary" size="icon" aria-label="Nuevo medicamento" onClick={() => setShowAdd(true)}>
      <Plus size={22} />
    </Button>
  );

  return (
    <div className="pb-8">
      {!embedded && <PageHeader back backHref="/salud" eyebrow={pet?.name ?? "Tu mascota"} title="Medicamentos" actions={addButton} />}

      {loading ? (
        <MedicationsSkeleton embedded />
      ) : (
        <div className="flex flex-col gap-4 px-4">
          {embedded && <div className="flex justify-end">{addButton}</div>}

          {todayLogs.length > 0 && (
            <Card tone="warn" elevation={0}>
              <CardHeader title={`Tomas de hoy (${todayLogs.length})`} />
              <ul className="flex flex-col gap-1.5">
                {todayLogs.map((log) => {
                  const med = medications.find((m) => m.id === log.medication_id);
                  if (!med) return null;
                  const timeStr = new Date(log.scheduled_at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
                  return (
                    <li key={log.id} className="flex items-center gap-2 text-[14px]">
                      <Pill size={15} className="shrink-0 text-warn" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">
                        {med.name} · {med.dose_amount} {med.dose_unit}
                      </span>
                      <span className="shrink-0 text-[12px] font-bold text-warn">{timeStr}</span>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}

          <SegmentedControl ariaLabel="Filtro de medicamentos" options={TABS} value={tab} onChange={setTab} />

          {error ? (
            <EmptyState tone="danger" title="No pudimos cargar" description={error} action={<Button full onClick={() => void fetchData()}>Reintentar</Button>} />
          ) : filteredMeds.length === 0 ? (
            <EmptyState
              compact
              icon={<Pill size={26} />}
              title={tab === "activos" ? "Sin medicamentos activos" : tab === "completados" ? "Nada completado aún" : "Sin medicamentos"}
              description={tab === "activos" ? `Cuando ${pet?.name ?? "tu mascota"} tenga un tratamiento, anótalo aquí para no olvidar ninguna toma.` : undefined}
              action={tab === "activos" ? <Button full onClick={() => setShowAdd(true)} leading={<Plus size={18} />}>Agregar medicamento</Button> : undefined}
            />
          ) : (
            <motion.div variants={stagger()} initial="hidden" animate="show" className="flex flex-col gap-3">
              {filteredMeds.map((med) => (
                <motion.div key={med.id} variants={fadeUp}>
                  <MedicationCard medication={med} logs={getLogsForMed(med.id)} onUpdate={() => void fetchData()} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      )}

      <Sheet open={showAdd} onClose={() => setShowAdd(false)} title="Nuevo medicamento" subtitle={pet?.name}>
        <AddMedicationForm onClose={() => setShowAdd(false)} onSuccess={() => void fetchData()} />
      </Sheet>
    </div>
  );
}
