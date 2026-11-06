"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Download, Plus } from "lucide-react";
import { PageHeader, Chip, ChipRow, Button, EmptyState, SectionTitle, Card, PullToRefresh } from "@/components/ui";
import { showToast } from "@/components/ui/Toast";
import { useActivePet } from "@/hooks/useActivePet";
import { useAuthContext } from "@/contexts/AuthContext";
import { fetchCareCycles, fetchCycleLogs } from "@/lib/api/careCycles";
import { fetchPet, fetchWeightLogs } from "@/lib/api/pets";
import { HEALTH_KINDS, type CareCycle, type CareCycleLog, type PetRow, type WeightLog } from "@/types/db";
import type { ClinicalRecord, VisitType } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { stagger } from "@/lib/motion";
import { fetchAdministeredLogs, fetchBusinessNames, fetchClinicalRecords, fetchMedications, type MedicationData, type MedicationLogData } from "./api";
import { HistoryList, type HistoryItem, type HistoryKind } from "./HistoryList";
import { UpcomingCycleRow } from "./UpcomingCycleRow";
import { CompleteCycleSheet, type CompleteCycleResult } from "./CompleteCycleSheet";
import { PriorHistorySheet, PriorHistoryBanner, cyclesWithoutHistory } from "./PriorHistorySheet";
import { NewRecordSheet, type NewRecordOption } from "./NewRecordSheet";
import { ExportSheet, buildClinicalSummary } from "./ExportSheet";
import { SaludSkeleton } from "./SaludSkeleton";
import { addDays, isMissingRelation, toastOnce } from "./shared";

type Filter = "all" | "vaccine" | "deworm" | "medication" | "consult" | "weight";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Todo" },
  { id: "vaccine", label: "Vacunas" },
  { id: "deworm", label: "Antiparasitarios" },
  { id: "medication", label: "Medicamentos" },
  { id: "consult", label: "Consultas" },
  { id: "weight", label: "Peso" },
];

const VISIT_LABEL: Record<VisitType, string> = {
  consulta_general: "Consulta general",
  emergencia: "Emergencia",
  cirugia: "Cirugía",
  control_rutina: "Control de rutina",
  peluqueria: "Peluquería",
  otro: "Visita",
};

type CycleLogRow = CareCycleLog & { care_cycles: Pick<CareCycle, "name" | "kind"> | null };

function cycleKindToHistory(kind: CareCycle["kind"]): HistoryKind {
  if (kind === "vaccine") return "vaccine";
  if (kind === "deworm_internal" || kind === "deworm_external") return "deworm";
  if (kind === "weight") return "weight";
  return "consult";
}

function cycleMatchesFilter(c: CareCycle, f: Filter): boolean {
  if (f === "all") return true;
  return cycleKindToHistory(c.kind) === f;
}

function localDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface Data {
  cycles: CareCycle[];
  cycleLogs: CycleLogRow[];
  medications: MedicationData[];
  medLogs: MedicationLogData[];
  records: ClinicalRecord[];
  weights: WeightLog[];
  profile: PetRow | null;
}

const EMPTY: Data = { cycles: [], cycleLogs: [], medications: [], medLogs: [], records: [], weights: [], profile: null };

export function SaludView() {
  const router = useRouter();
  const { pet } = useActivePet();
  const { user } = useAuthContext();
  const userId = user?.id ?? null;

  const [filter, setFilter] = useState<Filter>("all");
  const [data, setData] = useState<Data>(EMPTY);
  const [businessNames, setBusinessNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [completing, setCompleting] = useState<CareCycle | null>(null);
  const [justCompletedId, setJustCompletedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newInitial, setNewInitial] = useState<NewRecordOption | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [showPrior, setShowPrior] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (petId: string, quiet = false) => {
    if (!quiet) {
      setLoading(true);
      setError(null);
    }
    const settle = async <T,>(key: string, label: string, p: Promise<T>, fallback: T): Promise<{ value: T; failed: boolean }> => {
      try {
        return { value: await p, failed: false };
      } catch (e) {
        if (isMissingRelation(e)) {
          toastOnce(`missing:${key}`, `${label} aún no está disponible en tu cuenta.`);
          return { value: fallback, failed: false };
        }
        console.error(`[salud:${key}]`, e);
        return { value: fallback, failed: true };
      }
    };
    const [cycles, cycleLogs, medications, medLogs, records, weights, profile] = await Promise.all([
      settle("cycles", "Los ciclos de cuidado", fetchCareCycles(petId), [] as CareCycle[]),
      settle("cycle_logs", "El historial de cuidados", fetchCycleLogs(petId, { kinds: HEALTH_KINDS }), [] as CycleLogRow[]),
      settle("medications", "Medicamentos", fetchMedications(petId), [] as MedicationData[]),
      settle("medication_logs", "Las tomas", fetchAdministeredLogs(petId, 30), [] as MedicationLogData[]),
      settle("clinical_records", "El historial clínico", fetchClinicalRecords(petId), [] as ClinicalRecord[]),
      settle("weight_logs", "El registro de peso", fetchWeightLogs(petId, 50), [] as WeightLog[]),
      settle("pet", "El perfil", fetchPet(petId), null as PetRow | null),
    ]);
    const failures = [cycles, cycleLogs, medications, medLogs, records, weights, profile].filter((r) => r.failed).length;
    if (failures >= 3) {
      setError("No pudimos cargar la salud de tu mascota.");
    } else {
      setData({
        cycles: cycles.value.filter((c) => HEALTH_KINDS.includes(c.kind)),
        cycleLogs: cycleLogs.value,
        medications: medications.value,
        medLogs: medLogs.value,
        records: records.value,
        weights: weights.value,
        profile: profile.value,
      });
      const ids = cycleLogs.value.map((l) => l.business_id).filter((x): x is string => !!x);
      if (ids.length) {
        try {
          setBusinessNames(await fetchBusinessNames(ids));
        } catch {
          /* nombres opcionales */
        }
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!pet) {
      setLoading(false);
      return;
    }
    void load(pet.id);
  }, [pet, load]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const history = useMemo<HistoryItem[]>(() => {
    const medName = (id: string) => data.medications.find((m) => m.id === id)?.name ?? "Medicamento";
    const items: HistoryItem[] = [];
    for (const l of data.cycleLogs) {
      const kind = l.care_cycles ? cycleKindToHistory(l.care_cycles.kind) : "consult";
      const sub = [l.product, l.dose, l.cost != null ? formatCurrency(Number(l.cost)) : null, l.notes].filter(Boolean).join(" · ");
      items.push({ id: `cl-${l.id}`, date: l.done_at, kind, title: l.care_cycles?.name ?? "Cuidado", subtitle: sub || undefined, businessId: l.business_id });
    }
    for (const m of data.medications) {
      items.push({ id: `m-${m.id}`, date: m.start_date, kind: "medication", title: `Inicio: ${m.name}`, subtitle: `${m.dose_amount} ${m.dose_unit}${m.reason ? ` · ${m.reason}` : ""}` });
    }
    for (const l of data.medLogs) {
      if (!l.administered_at) continue;
      items.push({ id: `ml-${l.id}`, date: localDate(l.administered_at), kind: "medication", title: `Toma: ${medName(l.medication_id)}`, subtitle: new Date(l.administered_at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) });
    }
    for (const r of data.records) {
      const sub = [r.vet_name, r.clinic_name, r.diagnosis].filter(Boolean).join(" · ");
      items.push({ id: `r-${r.id}`, date: r.visit_date, kind: "consult", title: VISIT_LABEL[r.visit_type] ?? "Visita", subtitle: sub || undefined });
    }
    for (const w of data.weights) {
      items.push({ id: `w-${w.id}`, date: w.measured_at, kind: "weight", title: `${w.weight_kg} kg`, subtitle: w.notes ?? undefined });
    }
    return items;
  }, [data]);

  const upcoming = useMemo(() => data.cycles.filter((c) => cycleMatchesFilter(c, filter)).sort((a, b) => (a.next_due_at < b.next_due_at ? -1 : 1)), [data.cycles, filter]);
  const filteredHistory = useMemo(() => (filter === "all" ? history : history.filter((h) => h.kind === filter)), [history, filter]);

  const summary = useMemo(
    () => (pet ? buildClinicalSummary({ petName: pet.name, species: pet.species, profile: data.profile, cycles: data.cycles, medications: data.medications, weights: data.weights, history }) : ""),
    [pet, data, history]
  );

  function onCompleted(cycle: CareCycle, result: CompleteCycleResult) {
    setJustCompletedId(cycle.id);
    showToast(`${cycle.name} registrado`, undefined, "success");
    timerRef.current = setTimeout(() => {
      setJustCompletedId(null);
      setData((d) => ({
        ...d,
        cycles: d.cycles.map((c) => (c.id === cycle.id ? { ...c, last_done_at: result.done_at, next_due_at: addDays(result.done_at, c.interval_days), product: result.product ?? c.product, dose: result.dose ?? c.dose } : c)),
        cycleLogs: [
          { id: result.logId, cycle_id: cycle.id, pet_id: cycle.pet_id, user_id: cycle.user_id, done_at: result.done_at, product: result.product ?? null, dose: result.dose ?? null, cost: result.cost ?? null, business_id: null, booking_id: null, photo_url: null, notes: result.notes ?? null, created_at: new Date().toISOString(), care_cycles: { name: cycle.name, kind: cycle.kind } },
          ...d.cycleLogs,
        ],
      }));
      if (pet) void load(pet.id, true);
    }, 700);
  }

  if (!pet) {
    return (
      <div className="pb-6">
        <PageHeader title="Salud" sos />
        <EmptyState title="Añade una mascota" description="Para llevar su salud al día necesitas registrarla primero." action={<Button full onClick={() => router.push("/mascotas/nueva")}>Añadir mascota</Button>} />
      </div>
    );
  }

  if (loading) return <SaludSkeleton />;

  return (
    <PullToRefresh onRefresh={() => (pet ? load(pet.id, true) : undefined)}>
    <div className="pb-20">
      <PageHeader
        sos
        eyebrow={pet.name}
        title="Salud"
        actions={
          <Button variant="secondary" size="icon" aria-label="Exportar resumen clínico" onClick={() => setShowExport(true)}>
            <Download size={20} />
          </Button>
        }
      />

      <div className="px-4">
        <ChipRow className="mb-4">
          {FILTERS.map((f) => (
            <Chip key={f.id} selected={filter === f.id} onClick={() => setFilter(f.id)}>{f.label}</Chip>
          ))}
        </ChipRow>

        {error ? (
          <EmptyState title="No pudimos cargar" description={error} action={<Button full onClick={() => void load(pet.id)}>Reintentar</Button>} />
        ) : (
          <>
            <section aria-label="Próximos" className="mb-6">
              <div className="mb-3">
                <PriorHistoryBanner count={cyclesWithoutHistory(data.cycles).length} onOpen={() => setShowPrior(true)} />
              </div>
              <SectionTitle className="mb-3">Próximos</SectionTitle>
              {upcoming.length === 0 ? (
                <Card tone="container" elevation={0}>
                  <p className="text-body text-text-secondary">
                    {data.cycles.length === 0 ? "Sin ciclos programados. Usa el botón + para añadir vacunas o antiparasitarios." : "Nada pendiente con este filtro."}
                  </p>
                </Card>
              ) : (
                <motion.ul variants={stagger()} initial="hidden" animate="show" className="flex flex-col gap-2">
                  {upcoming.map((c) => (
                    <UpcomingCycleRow key={c.id} cycle={c} justCompleted={justCompletedId === c.id} onComplete={setCompleting} />
                  ))}
                </motion.ul>
              )}
            </section>

            <section aria-label="Historial">
              <SectionTitle className="mb-3">Historial</SectionTitle>
              {filteredHistory.length === 0 ? (
                <EmptyState
                  compact
                  tone="neutral"
                  title="Todavía no hay registros"
                  description={filter === "all" ? `Cuando registres vacunas, consultas o pesos de ${pet.name}, aparecerán aquí.` : "No hay registros de este tipo."}
                  action={filter === "all" ? <Button variant="secondary" full onClick={() => { setNewInitial(null); setShowNew(true); }}>Añadir el primero</Button> : undefined}
                />
              ) : (
                <HistoryList items={filteredHistory} businessNames={businessNames} />
              )}
            </section>
          </>
        )}
      </div>

      {/* FAB */}
      <div className="pointer-events-none fixed inset-x-0 bottom-[var(--content-bottom-padding)] z-40 mx-auto flex w-full max-w-[640px] justify-end px-4">
        <button
          type="button"
          onClick={() => { setNewInitial(null); setShowNew(true); }}
          aria-label="Nuevo registro"
          className="pressable pointer-events-auto flex h-13 w-13 items-center justify-center rounded-full bg-primary text-on-primary shadow-2"
        >
          <Plus size={24} aria-hidden="true" />
        </button>
      </div>

      <CompleteCycleSheet cycle={completing} open={!!completing} onClose={() => setCompleting(null)} onDone={onCompleted} />
      <PriorHistorySheet open={showPrior} onClose={() => setShowPrior(false)} cycles={data.cycles} petName={pet?.name ?? "tu mascota"} petId={pet?.id} onSaved={() => pet && void load(pet.id, true)} />
      {userId && (
        <NewRecordSheet
          open={showNew}
          onClose={() => setShowNew(false)}
          petId={pet.id}
          userId={userId}
          initial={newInitial}
          onSaved={() => {
            showToast("Registro guardado", undefined, "success");
            void load(pet.id, true);
          }}
        />
      )}
      <ExportSheet open={showExport} onClose={() => setShowExport(false)} summary={summary} petName={pet.name} />
    </div>
    </PullToRefresh>
  );
}
