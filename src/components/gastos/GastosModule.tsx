"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { Plus, Wallet } from "lucide-react";
import { useStore } from "@/store";
import { useActivePet } from "@/hooks/useActivePet";
import { formatCurrency, formatDate, getMonthKey } from "@/lib/utils";
import { fadeUp, stagger } from "@/lib/motion";
import { Button, Card, Divider, EmptyState, InfoCell, PageHeader, Row, SectionTitle, showToast } from "@/components/ui";
import { GastoForm } from "./GastoForm";
import { GastosChart } from "./GastosChart";
import { GastosSkeleton } from "./GastosSkeleton";
import { MonthDetail } from "./MonthDetail";

export function GastosModule() {
  const { gastos, selectedPetId, fetchGastos, loadingExpenses } = useStore();
  const { pet } = useActivePet();
  const params = useSearchParams();
  const router = useRouter();
  const reduce = useReducedMotion();
  const [showForm, setShowForm] = useState(() => params.get("nuevo") === "1");
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const fetchData = useCallback(async () => {
    if (!selectedPetId) return;
    setError(false);
    try {
      await fetchGastos();
    } catch {
      setError(true);
      showToast("No pudimos cargar los gastos", () => void fetchData(), "error");
    }
  }, [selectedPetId, fetchGastos]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const petGastos = useMemo(() => gastos.filter((g) => g.petId === selectedPetId), [gastos, selectedPetId]);

  const stats = useMemo(() => {
    const now = new Date();
    const mk = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const thisMonth = petGastos.filter((g) => getMonthKey(g.fecha) === mk);
    const total = petGastos.reduce((s, g) => s + g.monto, 0);
    const thisMonthTotal = thisMonth.reduce((s, g) => s + g.monto, 0);
    const map: Record<string, number> = {};
    for (const g of petGastos) map[g.concepto] = (map[g.concepto] ?? 0) + g.monto;
    const topConcepto = Object.entries(map).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
    return { total, thisMonthTotal, count: petGastos.length, topConcepto };
  }, [petGastos]);

  const recentGastos = useMemo(() => [...petGastos].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 5), [petGastos]);

  function closeForm() {
    setShowForm(false);
    if (params.get("nuevo")) router.replace("/gastos");
  }

  if (loadingExpenses && petGastos.length === 0 && !error) return <GastosSkeleton />;

  return (
    <motion.div
      className="flex flex-col gap-4 pb-6"
      variants={reduce ? undefined : stagger()}
      initial={reduce ? false : "hidden"}
      animate="show"
    >
      <PageHeader
        title="Gastos"
        eyebrow={pet?.name ?? "Mascota"}
        back
        actions={
          petGastos.length > 0 ? (
            <Button size="icon" variant="tonal" onClick={() => setShowForm(true)} aria-label="Nuevo gasto">
              <Plus size={20} />
            </Button>
          ) : undefined
        }
      />

      {error && petGastos.length === 0 ? (
        <div className="px-4">
          <EmptyState
            tone="danger"
            icon={<Wallet size={24} />}
            title="No pudimos cargar los gastos"
            description="Revisa tu conexión e inténtalo otra vez."
            action={<Button full onClick={() => void fetchData()}>Reintentar</Button>}
          />
        </div>
      ) : petGastos.length === 0 ? (
        <div className="px-4">
          <Card>
            <EmptyState
              compact
              icon={<Wallet size={24} />}
              title="Sin gastos aún"
              description={`Registra el primer gasto de ${pet?.name ?? "tu mascota"} para ver resúmenes y gráficos.`}
              action={
                <Button full leading={<Plus size={18} />} onClick={() => setShowForm(true)}>
                  Agregar gasto
                </Button>
              }
            />
          </Card>
        </div>
      ) : (
        <>
          <motion.section className="px-4" variants={fadeUp} aria-label="Resumen">
            <div className="grid grid-cols-2 gap-2">
              <InfoCell label="Este mes" value={formatCurrency(stats.thisMonthTotal)} />
              <InfoCell label="Total histórico" value={formatCurrency(stats.total)} />
              <InfoCell label="Registros" value={String(stats.count)} />
              <InfoCell label="Mayor gasto" value={stats.topConcepto} />
            </div>
          </motion.section>

          <motion.section className="flex flex-col gap-3 px-4" variants={fadeUp}>
            <SectionTitle>Evolución mensual</SectionTitle>
            <Card>
              <GastosChart onMonthClick={(m) => setSelectedMonth(m === selectedMonth ? null : m)} selectedMonth={selectedMonth} />
            </Card>
          </motion.section>

          {selectedMonth && (
            <motion.section className="px-4" variants={fadeUp}>
              <MonthDetail month={selectedMonth} onClose={() => setSelectedMonth(null)} />
            </motion.section>
          )}

          {!selectedMonth && recentGastos.length > 0 && (
            <motion.section className="flex flex-col gap-3 px-4" variants={fadeUp}>
              <SectionTitle>Recientes</SectionTitle>
              <Card padded={false} className="overflow-hidden">
                {recentGastos.map((g, i) => (
                  <div key={g.id}>
                    {i > 0 && <Divider className="ml-[72px] mr-0" />}
                    <Row
                      icon={<span className="text-[16px] font-bold">{g.concepto.charAt(0).toUpperCase()}</span>}
                      iconTone="primary"
                      title={g.concepto}
                      subtitle={`${formatDate(g.fecha)} · ${g.quien}`}
                      trailing={<span className="text-[15px] font-bold text-on">{formatCurrency(g.monto)}</span>}
                    />
                  </div>
                ))}
              </Card>
            </motion.section>
          )}

          <motion.div className="px-4" variants={fadeUp}>
            <Button full size="lg" leading={<Plus size={18} />} onClick={() => setShowForm(true)}>
              Nuevo gasto
            </Button>
          </motion.div>
        </>
      )}

      {showForm && <GastoForm open onClose={closeForm} />}
    </motion.div>
  );
}
