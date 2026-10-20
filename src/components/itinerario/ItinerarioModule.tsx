"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Plus, Trash2, Clock, PartyPopper } from "lucide-react";
import { PetFood, PetWalk } from "@/components/icons/pet";
import { useStore } from "@/store";
import { useAuthContext } from "@/contexts/AuthContext";
import { useActivePet } from "@/hooks/useActivePet";
import { cn } from "@/lib/utils";
import { fadeUp, stagger } from "@/lib/motion";
import { Button, Card, Divider, EmptyState, PageHeader, ProgressBar, SectionTitle, showToast, type Severity } from "@/components/ui";
import { TaskCheck, TaskDue, TaskIcon } from "@/components/tasks/TaskRow";
import { ItemForm, DIAS_LABEL } from "./ItemForm";
import { ItinerarioSkeleton } from "./ItinerarioSkeleton";
import type { ItinerarioItem } from "@/types";

function todayDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ── Fila de rutina ───────────────────────────────────────────────────────────
/** Severidad de una rutina de hoy: hora pasada sin hacer = vencida; más tarde hoy = vence pronto */
function itemSeverity(item: ItinerarioItem, done: boolean, isToday: boolean): Severity {
  if (done) return "ok";
  if (!isToday) return "info";
  const [h, m] = item.hora.split(":").map(Number);
  const now = new Date();
  return h * 60 + (m || 0) < now.getHours() * 60 + now.getMinutes() ? "overdue" : "soon";
}

function ItemRow({ item, done, isToday, onToggle, onEdit, onDelete }: { item: ItinerarioItem; done: boolean; isToday: boolean; onToggle: () => void; onEdit: () => void; onDelete: () => void }) {
  const diasStr = item.dias.length === 7 ? "Todos los días" : [...item.dias].sort().map((d) => DIAS_LABEL[d]).join(", ");
  const Icon = item.tipo === "comida" ? PetFood : PetWalk;
  const severity = itemSeverity(item, done, isToday);
  const due = done ? "Hecho" : severity === "overdue" ? `Pendiente desde las ${item.hora}` : isToday ? `Hoy a las ${item.hora}` : item.hora;

  return (
    <div className="flex min-h-16 items-center gap-3 py-2 pr-2 pl-4" style={{ opacity: done ? 0.7 : 1, transition: "opacity var(--duration-slow) var(--ease-standard)" }}>
      <TaskIcon severity={severity}>
        <Icon size={18} />
      </TaskIcon>
      <button type="button" onClick={onEdit} aria-label={`Editar ${item.nombre}`} className="min-h-11 min-w-0 flex-1 text-left">
        <p className={cn("truncate text-subtitle font-semibold", done ? "text-text-secondary line-through" : "text-text")}>{item.nombre}</p>
        <TaskDue severity={severity}>{due}</TaskDue>
        <p className="truncate text-small text-text-secondary">
          {item.cantidad ? `${item.cantidad} · ` : ""}
          {diasStr}
        </p>
      </button>
      <Button variant="dangerTonal" size="icon" aria-label={`Eliminar ${item.nombre}`} onClick={onDelete} className="shrink-0 border-transparent">
        <Trash2 size={16} />
      </Button>
      <TaskCheck done={done} onClick={onToggle} label={done ? `Desmarcar ${item.nombre}` : `Marcar ${item.nombre} como hecho`} />
    </div>
  );
}

// ── Módulo ───────────────────────────────────────────────────────────────────
export function ItinerarioModule() {
  const { itinerario, registros, toggleRegistro, deleteItinerarioItem, selectedPetId, fetchItinerario, loadingItinerary } = useStore();
  const { user } = useAuthContext();
  const { pet } = useActivePet();
  const reduce = useReducedMotion();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<ItinerarioItem | null>(null);
  const [error, setError] = useState(false);

  const fetchData = useCallback(async () => {
    if (!selectedPetId) return;
    setError(false);
    try {
      await fetchItinerario();
    } catch {
      setError(true);
      showToast("No pudimos cargar la rutina", () => void fetchData(), "error");
    }
  }, [selectedPetId, fetchItinerario]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const today = todayDate();
  const todayDow = new Date().getDay();

  const petItems = useMemo(
    () => itinerario.filter((i) => i.petId === selectedPetId).sort((a, b) => a.hora.localeCompare(b.hora)),
    [itinerario, selectedPetId]
  );
  const todayItems = useMemo(() => petItems.filter((i) => i.dias.includes(todayDow)), [petItems, todayDow]);

  const isItemDone = useCallback(
    (itemId: string) => registros.find((r) => r.itemId === itemId && r.fecha === today)?.completado ?? false,
    [registros, today]
  );

  const { comidas, salidas } = useMemo(() => {
    const todayItemIds = new Set(todayItems.map((i) => i.id));
    return {
      comidas: petItems.filter((i) => i.tipo === "comida" && !todayItemIds.has(i.id)),
      salidas: petItems.filter((i) => i.tipo === "salida" && !todayItemIds.has(i.id)),
    };
  }, [petItems, todayItems]);

  const doneToday = todayItems.filter((i) => isItemDone(i.id)).length;
  const progress = todayItems.length > 0 ? doneToday / todayItems.length : 0;

  async function handleDelete(id: string) {
    try {
      await deleteItinerarioItem(id);
    } catch {
      showToast("No se pudo eliminar", () => void handleDelete(id), "error");
    }
  }

  async function handleToggle(itemId: string) {
    try {
      await toggleRegistro(itemId, today, user?.id ?? "");
    } catch {
      showToast("No se pudo guardar el cambio", () => void handleToggle(itemId), "error");
    }
  }

  function renderList(items: ItinerarioItem[], isToday = false) {
    return (
      <Card padded={false} className="overflow-hidden">
        {items.map((item, i) => (
          <div key={item.id}>
            {i > 0 && <Divider className="ml-15 mr-0" />}
            <ItemRow
              item={item}
              isToday={isToday}
              done={isItemDone(item.id)}
              onToggle={() => void handleToggle(item.id)}
              onEdit={() => setEditItem(item)}
              onDelete={() => void handleDelete(item.id)}
            />
          </div>
        ))}
      </Card>
    );
  }

  if (loadingItinerary && petItems.length === 0 && !error) return <ItinerarioSkeleton />;

  return (
    <motion.div className="enter-list flex flex-col gap-4 pb-6" variants={reduce ? undefined : stagger()} animate="show">
      <PageHeader
        title="Rutina diaria"
        eyebrow={pet?.name ?? "Mascota"}
        back
        backHref="/actividad"
        actions={
          petItems.length > 0 ? (
            <Button size="icon" variant="secondary" onClick={() => setShowForm(true)} aria-label="Agregar rutina">
              <Plus size={20} />
            </Button>
          ) : undefined
        }
      />

      {error && petItems.length === 0 ? (
        <div className="px-4">
          <EmptyState
            icon={<Clock size={24} />}
            title="No pudimos cargar la rutina"
            description="Revisa tu conexión e inténtalo otra vez."
            action={<Button full onClick={() => void fetchData()}>Reintentar</Button>}
          />
        </div>
      ) : petItems.length === 0 ? (
        <div className="px-4">
          <Card>
            <EmptyState
              compact
              icon={<Clock size={24} />}
              title="Sin rutina aún"
              description={`Agrega las comidas y salidas de ${pet?.name ?? "tu mascota"} para marcarlas cada día.`}
              action={
                <Button full leading={<Plus size={18} />} onClick={() => setShowForm(true)}>
                  Crear primera rutina
                </Button>
              }
            />
          </Card>
        </div>
      ) : (
        <>
          {todayItems.length > 0 && (
            <motion.section className="px-4" variants={fadeUp} aria-label="Progreso de hoy">
              <Card tone={progress === 1 ? "primary" : "surface"}>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-subtitle font-semibold">Progreso de hoy</p>
                  <span className="text-body font-semibold text-primary-text">
                    {doneToday}/{todayItems.length}
                  </span>
                </div>
                <ProgressBar value={progress} tone={progress === 1 ? "ok" : "primary"} />
                {progress === 1 && (
                  <p className="mt-3 flex items-center justify-center gap-2 text-small font-semibold">
                    <PartyPopper size={16} aria-hidden="true" /> Todo completado hoy
                  </p>
                )}
              </Card>
            </motion.section>
          )}

          {todayItems.length > 0 && (
            <motion.section className="flex flex-col gap-3 px-4" variants={fadeUp}>
              <SectionTitle>Hoy</SectionTitle>
              {renderList(todayItems, true)}
            </motion.section>
          )}

          {comidas.length > 0 && (
            <motion.section className="flex flex-col gap-3 px-4" variants={fadeUp}>
              <SectionTitle>Comidas ({comidas.length})</SectionTitle>
              {renderList(comidas)}
            </motion.section>
          )}

          {salidas.length > 0 && (
            <motion.section className="flex flex-col gap-3 px-4" variants={fadeUp}>
              <SectionTitle>Salidas ({salidas.length})</SectionTitle>
              {renderList(salidas)}
            </motion.section>
          )}

          <motion.div className="px-4" variants={fadeUp}>
            <Button full size="lg" leading={<Plus size={18} />} onClick={() => setShowForm(true)}>
              Agregar rutina
            </Button>
          </motion.div>
        </>
      )}

      {showForm && <ItemForm open onClose={() => setShowForm(false)} />}
      {editItem && <ItemForm key={editItem.id} open editItem={editItem} onClose={() => setEditItem(null)} />}
    </motion.div>
  );
}
