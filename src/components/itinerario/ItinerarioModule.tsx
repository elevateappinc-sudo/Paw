"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Plus, UtensilsCrossed, Footprints, Pencil, Trash2, Clock, PartyPopper } from "lucide-react";
import { useStore } from "@/store";
import { useAuthContext } from "@/contexts/AuthContext";
import { useActivePet } from "@/hooks/useActivePet";
import { cn } from "@/lib/utils";
import { fadeUp, stagger } from "@/lib/motion";
import { Button, Card, Divider, EmptyState, PageHeader, ProgressBar, SectionTitle, showToast } from "@/components/ui";
import { AnimatedCheck } from "@/components/entrenamiento/AnimatedCheck";
import { ItemForm, DIAS_LABEL } from "./ItemForm";
import { ItinerarioSkeleton } from "./ItinerarioSkeleton";
import type { ItinerarioItem } from "@/types";

function todayDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ── Fila de rutina ───────────────────────────────────────────────────────────
function ItemRow({ item, done, onToggle, onEdit, onDelete }: { item: ItinerarioItem; done: boolean; onToggle: () => void; onEdit: () => void; onDelete: () => void }) {
  const diasStr = item.dias.length === 7 ? "Todos los días" : [...item.dias].sort().map((d) => DIAS_LABEL[d]).join(", ");
  const Icon = item.tipo === "comida" ? UtensilsCrossed : Footprints;

  return (
    <div className="flex min-h-[64px] items-center gap-2 py-2 pr-3 pl-1">
      <AnimatedCheck state={done ? "on" : "off"} onClick={onToggle} label={done ? `Desmarcar ${item.nombre}` : `Marcar ${item.nombre} como hecho`} />
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-control", done ? "bg-surface-2 text-on-variant" : "bg-primary-container text-on-primary-container")}>
        <Icon size={18} aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-[16px] font-bold", done ? "text-on-variant line-through" : "text-on")}>{item.nombre}</p>
        <p className="truncate text-[13px] text-on-variant">
          {item.hora}
          {item.cantidad ? ` · ${item.cantidad}` : ""} · {diasStr}
        </p>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button variant="secondary" size="icon" aria-label={`Editar ${item.nombre}`} onClick={onEdit} className="min-h-[40px] min-w-[40px]">
          <Pencil size={15} />
        </Button>
        <Button variant="dangerTonal" size="icon" aria-label={`Eliminar ${item.nombre}`} onClick={onDelete} className="min-h-[40px] min-w-[40px] border-transparent">
          <Trash2 size={15} />
        </Button>
      </div>
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

  function renderList(items: ItinerarioItem[]) {
    return (
      <Card padded={false} className="overflow-hidden">
        {items.map((item, i) => (
          <div key={item.id}>
            {i > 0 && <Divider className="ml-[60px] mr-0" />}
            <ItemRow
              item={item}
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
    <motion.div className="flex flex-col gap-4 pb-6" variants={reduce ? undefined : stagger()} initial={reduce ? false : "hidden"} animate="show">
      <PageHeader
        title="Rutina diaria"
        eyebrow={pet?.name ?? "Mascota"}
        back
        backHref="/actividad"
        actions={
          petItems.length > 0 ? (
            <Button size="icon" variant="tonal" onClick={() => setShowForm(true)} aria-label="Agregar rutina">
              <Plus size={20} />
            </Button>
          ) : undefined
        }
      />

      {error && petItems.length === 0 ? (
        <div className="px-4">
          <EmptyState
            tone="danger"
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
                <div className="mb-2.5 flex items-center justify-between">
                  <p className="text-[16px] font-bold">Progreso de hoy</p>
                  <span className={cn("text-[14px] font-bold", progress === 1 ? "text-on-primary-container" : "text-primary")}>
                    {doneToday}/{todayItems.length}
                  </span>
                </div>
                <ProgressBar value={progress} tone={progress === 1 ? "ok" : "primary"} />
                {progress === 1 && (
                  <p className="mt-2.5 flex items-center justify-center gap-1.5 text-[13px] font-semibold">
                    <PartyPopper size={15} aria-hidden="true" /> Todo completado hoy
                  </p>
                )}
              </Card>
            </motion.section>
          )}

          {todayItems.length > 0 && (
            <motion.section className="flex flex-col gap-3 px-4" variants={fadeUp}>
              <SectionTitle>Hoy</SectionTitle>
              {renderList(todayItems)}
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
