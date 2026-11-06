"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { CalendarDays } from "lucide-react";
import { PetBath } from "@/components/icons/pet";
import { PageHeader, Card, CardHeader, Button, EmptyState, Divider, Tag } from "@/components/ui";
import { showToast } from "@/components/ui/Toast";
import { useActivePet } from "@/hooks/useActivePet";
import { fetchCareCycles, fetchCycleLogs, regenerateCycles, daysUntil } from "@/lib/api/careCycles";
import { HYGIENE_KINDS, CARE_KIND_LABEL, type CareCycle, type CareCycleLog } from "@/types/db";
import { formatCurrency } from "@/lib/utils";
import { stagger } from "@/lib/motion";
import { fetchBusinessNames } from "@/components/salud/api";
import { CompleteCycleSheet, type CompleteCycleResult } from "@/components/salud/CompleteCycleSheet";
import { addDays, isMissingRelation, joinNames, shortDate, toastOnce, weekdayLabel } from "@/components/salud/shared";
import { HigieneSkeleton } from "./HigieneSkeleton";
import { HygieneCycleCard } from "./HygieneCycleCard";
import { HygieneCycleSheet } from "./HygieneCycleSheet";

type LogRow = CareCycleLog & { care_cycles: Pick<CareCycle, "name" | "kind"> | null };

export function HigieneView() {
  const router = useRouter();
  const { pet } = useActivePet();
  const [cycles, setCycles] = useState<CareCycle[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [businessNames, setBusinessNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<CareCycle | null>(null);
  const [completing, setCompleting] = useState<CareCycle | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async (petId: string, quiet = false) => {
    if (!quiet) {
      setLoading(true);
      setError(null);
    }
    try {
      const [cs, ls] = await Promise.all([fetchCareCycles(petId), fetchCycleLogs(petId, { kinds: HYGIENE_KINDS, limit: 100 })]);
      setCycles(cs.filter((c) => HYGIENE_KINDS.includes(c.kind)));
      setLogs(ls);
      const ids = ls.map((l) => l.business_id).filter((x): x is string => !!x);
      if (ids.length) {
        try {
          setBusinessNames(await fetchBusinessNames(ids));
        } catch {
          /* nombres opcionales */
        }
      }
    } catch (e) {
      if (isMissingRelation(e)) {
        toastOnce("missing:care_cycles", "Los ciclos de cuidado aún no están disponibles en tu cuenta.");
        setCycles([]);
        setLogs([]);
      } else {
        console.error("[higiene]", e);
        setError("No pudimos cargar la higiene.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!pet) {
      setLoading(false);
      return;
    }
    void load(pet.id);
  }, [pet, load]);

  const banner = useMemo(() => {
    const soon = cycles.filter((c) => daysUntil(c.next_due_at) <= 7).sort((a, b) => (a.next_due_at < b.next_due_at ? -1 : 1));
    if (soon.length < 2) return null;
    const earliest = soon[0];
    const d = daysUntil(earliest.next_due_at);
    const when = d <= 0 ? "Hoy" : `Este ${weekdayLabel(earliest.next_due_at)}`;
    const urgent = soon.some((c) => daysUntil(c.next_due_at) <= 3);
    return { text: `${when}: ${joinNames(soon.map((c) => c.name.toLowerCase()))}`, tone: urgent ? ("warn" as const) : ("primary" as const) };
  }, [cycles]);

  const recentLogs = logs.slice(0, 5);

  async function createPlan() {
    if (!pet) return;
    setCreating(true);
    try {
      const n = await regenerateCycles(pet.id);
      showToast(n > 0 ? `Plan creado con ${n} cuidados` : "No había cuidados nuevos para añadir", undefined, "success");
      await load(pet.id, true);
    } catch (e) {
      if (isMissingRelation(e)) toastOnce("missing:regenerate", "El plan de higiene aún no está disponible en tu cuenta.");
      else showToast("No pudimos crear el plan", () => void createPlan(), "error");
    } finally {
      setCreating(false);
    }
  }

  function onCompleted(cycle: CareCycle, result: CompleteCycleResult) {
    showToast(`${cycle.name} registrado`, undefined, "success");
    setCycles((cs) => cs.map((c) => (c.id === cycle.id ? { ...c, last_done_at: result.done_at, next_due_at: addDays(result.done_at, c.interval_days) } : c)));
    setLogs((ls) => [
      { id: result.logId, cycle_id: cycle.id, pet_id: cycle.pet_id, user_id: cycle.user_id, done_at: result.done_at, product: null, dose: null, cost: result.cost ?? null, business_id: null, booking_id: null, photo_url: null, notes: result.notes ?? null, created_at: new Date().toISOString(), care_cycles: { name: cycle.name, kind: cycle.kind } },
      ...ls,
    ]);
    setSelected(null);
    if (pet) void load(pet.id, true);
  }

  if (!pet) {
    return (
      <div className="pb-8">
        <PageHeader back backHref="/mascotas" title="Higiene y peluquería" />
        <EmptyState title="Añade una mascota" description="Para llevar su higiene necesitas registrarla primero." action={<Button full onClick={() => router.push("/mascotas/nueva")}>Añadir mascota</Button>} />
      </div>
    );
  }

  if (loading) return <HigieneSkeleton />;

  return (
    <div className="pb-8">
      <PageHeader back backHref={`/mascotas/${pet.id}`} eyebrow={pet.name} title="Higiene y peluquería" />

      {error ? (
        <div className="px-4">
          <EmptyState title="No pudimos cargar" description={error} action={<Button full onClick={() => void load(pet.id)}>Reintentar</Button>} />
        </div>
      ) : (
        <div className="flex flex-col gap-4 px-4">
          {banner && (
            <Card tone={banner.tone} elevation={0} className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-label font-semibold opacity-80">Tocan juntos</div>
                <div className="text-body font-semibold leading-snug">{banner.text}</div>
              </div>
              <Button size="sm" variant={banner.tone === "warn" ? "primary" : "secondary"} leading={<CalendarDays size={16} />} onClick={() => router.push("/explorar?cat=peluqueria")}>
                Reservar
              </Button>
            </Card>
          )}

          {cycles.length === 0 ? (
            <EmptyState
              icon={<PetBath size={26} />}
              title="Sin plan de higiene"
              description={`Creamos baños, uñas, oídos y dientes según la especie y edad de ${pet.name}.`}
              action={<Button full loading={creating} onClick={() => void createPlan()}>Crear plan de higiene</Button>}
            />
          ) : (
            <motion.div variants={stagger()} initial="hidden" animate="show" className="grid grid-cols-2 gap-3">
              {cycles.map((c) => (
                <HygieneCycleCard key={c.id} cycle={c} onOpen={setSelected} />
              ))}
            </motion.div>
          )}

          <Card padded={false}>
            <div className="px-4 pt-4">
              <CardHeader title="Historial" subtitle="Últimos cuidados registrados" />
            </div>
            {recentLogs.length === 0 ? (
              <p className="px-4 pb-4 text-body text-text-secondary">Cuando marques un cuidado como hecho aparecerá aquí.</p>
            ) : (
              <ul className="pb-2">
                {recentLogs.map((l, i) => {
                  const biz = l.business_id ? businessNames[l.business_id] : undefined;
                  return (
                    <li key={l.id}>
                      {i > 0 && <Divider />}
                      <div className="flex items-start gap-3 px-4 py-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            {l.care_cycles && <Tag size="xs">{CARE_KIND_LABEL[l.care_cycles.kind]}</Tag>}
                            <span className="text-label font-semibold text-text-secondary">{shortDate(l.done_at)}</span>
                          </div>
                          <div className="mt-1 text-body font-semibold text-text">{l.care_cycles?.name ?? "Cuidado"}</div>
                          {(biz || l.notes) && <div className="text-small text-text-secondary">{[biz ? `En ${biz}` : null, l.notes].filter(Boolean).join(" · ")}</div>}
                          {biz && <div className="text-label font-semibold text-success-text">Registrado por {biz}</div>}
                        </div>
                        {l.cost != null && <div className="shrink-0 text-body font-semibold text-text">{formatCurrency(Number(l.cost))}</div>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      )}

      <HygieneCycleSheet
        cycle={selected}
        logs={logs}
        businessNames={businessNames}
        onClose={() => setSelected(null)}
        onMarkDone={(c) => setCompleting(c)}
        onUpdated={(c) => {
          setCycles((cs) => cs.map((x) => (x.id === c.id ? c : x)));
          setSelected(c);
          showToast("Intervalo actualizado", undefined, "success");
        }}
      />
      <CompleteCycleSheet cycle={completing} open={!!completing} onClose={() => setCompleting(null)} onDone={onCompleted} fields={{ business: true, cost: true, product: false, dose: false }} />
    </div>
  );
}
