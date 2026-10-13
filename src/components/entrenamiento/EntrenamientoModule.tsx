"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { Plus, Dumbbell } from "lucide-react";
import { useStore } from "@/store";
import { useActivePet } from "@/hooks/useActivePet";
import { formatDate } from "@/lib/utils";
import { fadeUp, stagger } from "@/lib/motion";
import { Button, Card, Divider, EmptyState, InfoCell, PageHeader, Row, SectionTitle, Tag, showToast } from "@/components/ui";
import { ClaseForm } from "./ClaseForm";
import { ClaseCard } from "./ClaseCard";
import { EntrenamientoSkeleton } from "./EntrenamientoSkeleton";

export function EntrenamientoModule() {
  const { clases, selectedPetId, fetchClases, loadingTraining } = useStore();
  const { pet } = useActivePet();
  const params = useSearchParams();
  const router = useRouter();
  const reduce = useReducedMotion();
  const [showForm, setShowForm] = useState(() => params.get("nuevo") === "1");
  const [error, setError] = useState(false);

  const fetchData = useCallback(async () => {
    if (!selectedPetId) return;
    setError(false);
    try {
      await fetchClases();
    } catch {
      setError(true);
      showToast("No pudimos cargar las clases", () => void fetchData(), "error");
    }
  }, [selectedPetId, fetchClases]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const petClases = useMemo(() => clases.filter((c) => c.petId === selectedPetId), [clases, selectedPetId]);
  const sorted = useMemo(() => [...petClases].sort((a, b) => b.fecha.localeCompare(a.fecha)), [petClases]);

  const stats = useMemo(() => {
    const allTareas = petClases.flatMap((c) => c.tareas);
    const pending = allTareas.filter((t) => t.estado === "pendiente").length;
    const inProgress = allTareas.filter((t) => t.estado === "en_progreso").length;
    const completed = allTareas.filter((t) => t.estado === "completado").length;
    return { totalClases: petClases.length, pending, inProgress, completed };
  }, [petClases]);

  const pendingTareas = useMemo(
    () => petClases.flatMap((c) => c.tareas.filter((t) => t.estado !== "completado").map((t) => ({ ...t, claseId: c.id, claseFecha: c.fecha }))).slice(0, 5),
    [petClases]
  );

  function closeForm() {
    setShowForm(false);
    if (params.get("nuevo")) router.replace("/actividad/entrenamiento");
  }

  if (loadingTraining && petClases.length === 0 && !error) return <EntrenamientoSkeleton />;

  return (
    <motion.div className="flex flex-col gap-4 pb-6" variants={reduce ? undefined : stagger()} initial={reduce ? false : "hidden"} animate="show">
      <PageHeader
        title="Entrenamiento"
        eyebrow={pet?.name ?? "Mascota"}
        back
        backHref="/actividad"
        actions={
          sorted.length > 0 ? (
            <Button size="icon" variant="tonal" onClick={() => setShowForm(true)} aria-label="Nueva clase">
              <Plus size={20} />
            </Button>
          ) : undefined
        }
      />

      {error && petClases.length === 0 ? (
        <div className="px-4">
          <EmptyState
            tone="danger"
            icon={<Dumbbell size={24} />}
            title="No pudimos cargar las clases"
            description="Revisa tu conexión e inténtalo otra vez."
            action={<Button full onClick={() => void fetchData()}>Reintentar</Button>}
          />
        </div>
      ) : sorted.length === 0 ? (
        <div className="px-4">
          <Card>
            <EmptyState
              compact
              icon={<Dumbbell size={24} />}
              title="Sin clases aún"
              description={`Registra la primera clase de ${pet?.name ?? "tu mascota"} y lleva el seguimiento de sus tareas.`}
              action={
                <Button full leading={<Plus size={18} />} onClick={() => setShowForm(true)}>
                  Registrar clase
                </Button>
              }
            />
          </Card>
        </div>
      ) : (
        <>
          <motion.section className="px-4" variants={fadeUp} aria-label="Resumen">
            <div className="grid grid-cols-2 gap-2">
              <InfoCell label="Clases totales" value={String(stats.totalClases)} />
              <InfoCell label="Completadas" value={String(stats.completed)} tone="ok" />
              <InfoCell label="En progreso" value={String(stats.inProgress)} tone="info" />
              <InfoCell label="Pendientes" value={String(stats.pending)} tone={stats.pending > 0 ? "warn" : undefined} />
            </div>
          </motion.section>

          {pendingTareas.length > 0 && (
            <motion.section className="flex flex-col gap-3 px-4" variants={fadeUp}>
              <SectionTitle>Tareas pendientes</SectionTitle>
              <Card padded={false} className="overflow-hidden">
                {pendingTareas.map((t, i) => (
                  <div key={t.id}>
                    {i > 0 && <Divider />}
                    <Row
                      title={t.descripcion}
                      subtitle={`Clase del ${formatDate(t.claseFecha)}`}
                      trailing={
                        <Tag size="xs" tone={t.estado === "en_progreso" ? "info" : "warn"}>
                          {t.estado === "en_progreso" ? "En progreso" : "Pendiente"}
                        </Tag>
                      }
                      className="min-h-[56px]"
                    />
                  </div>
                ))}
              </Card>
            </motion.section>
          )}

          <motion.section className="flex flex-col gap-3 px-4" variants={fadeUp}>
            <SectionTitle>Historial de clases</SectionTitle>
            <Card padded={false} className="overflow-hidden">
              {sorted.map((clase, i) => (
                <div key={clase.id}>
                  {i > 0 && <Divider className="mx-0" />}
                  <ClaseCard clase={clase} />
                </div>
              ))}
            </Card>
          </motion.section>

          <motion.div className="px-4" variants={fadeUp}>
            <Button full size="lg" leading={<Plus size={18} />} onClick={() => setShowForm(true)}>
              Nueva clase
            </Button>
          </motion.div>
        </>
      )}

      {showForm && <ClaseForm open onClose={closeForm} />}
    </motion.div>
  );
}
