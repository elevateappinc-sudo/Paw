"use client";
import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Bell, Plus, Trash2, CheckCheck, AlertTriangle, AlertCircle, Clock, Check, Trophy, StickyNote } from "lucide-react";
import { useStore } from "@/store";
import { useAuthContext } from "@/contexts/AuthContext";
import { useActivePet } from "@/hooks/useActivePet";
import { cn, today, formatDate } from "@/lib/utils";
import { fadeUp, stagger } from "@/lib/motion";
import { Button, Card, Divider, EmptyState, PageHeader, Row, SectionTitle, StatusChip, Tag, showToast } from "@/components/ui";
import type { ChipTone } from "@/components/ui/Chip";
import { NotaForm, TIPO_LABEL } from "./NotaForm";
import { NotificacionesSkeleton } from "./NotificacionesSkeleton";
import type { Notificacion } from "@/types";

const TIPO_TONE: Record<Notificacion["tipo"], { tone: ChipTone; rowTone: "info" | "warn" | "ok"; icon: typeof Bell }> = {
  nota: { tone: "info", rowTone: "info", icon: StickyNote },
  alerta: { tone: "warn", rowTone: "warn", icon: AlertTriangle },
  logro: { tone: "ok", rowTone: "ok", icon: Trophy },
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `hace ${days} d`;
  if (hours > 0) return `hace ${hours} h`;
  if (mins > 0) return `hace ${mins} min`;
  return "ahora";
}

export function NotificacionesModule() {
  const { notificaciones, vacunas, marcarLeida, deleteNotificacion, marcarTodasLeidas, selectedPetId, fetchNotificaciones, fetchVacunas, loadingNotifications } =
    useStore();
  const { user: currentUser } = useAuthContext();
  const { pet } = useActivePet();
  const reduce = useReducedMotion();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!selectedPetId) return;
    void fetchNotificaciones();
    void fetchVacunas();
  }, [selectedPetId, fetchNotificaciones, fetchVacunas]);

  const todayStr = today();
  const petNotifs = useMemo(() => notificaciones.filter((n) => n.petId === selectedPetId), [notificaciones, selectedPetId]);
  const unreadCount = petNotifs.filter((n) => !n.leida).length;

  const petVacunas = useMemo(() => vacunas.filter((v) => v.petId === selectedPetId), [vacunas, selectedPetId]);
  const overdueVacunas = petVacunas.filter((v) => v.proximaFecha && v.proximaFecha < todayStr);
  const upcomingVacunas = petVacunas.filter((v) => {
    if (!v.proximaFecha || v.proximaFecha < todayStr) return false;
    const diffDays = Math.ceil((new Date(v.proximaFecha).getTime() - Date.now()) / 86400000);
    return diffDays <= 7;
  });

  function authorName(authorId: string) {
    return authorId === currentUser?.id ? "Tú" : "Usuario";
  }

  async function handleMarkAll() {
    try {
      await marcarTodasLeidas();
    } catch {
      showToast("No se pudieron marcar como leídas", () => void handleMarkAll(), "error");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteNotificacion(id);
    } catch {
      showToast("No se pudo eliminar la nota", () => void handleDelete(id), "error");
    }
  }

  const hasAlerts = overdueVacunas.length > 0 || upcomingVacunas.length > 0;
  const isEmpty = petNotifs.length === 0 && !hasAlerts;

  if (loadingNotifications && petNotifs.length === 0) return <NotificacionesSkeleton />;

  return (
    <motion.div className="enter-list flex flex-col gap-4 pb-6" variants={reduce ? undefined : stagger()} animate="show">
      <PageHeader
        title="Notificaciones"
        eyebrow={pet?.name ?? "Mascota"}
        back
        actions={
          !isEmpty ? (
            <Button size="icon" variant="secondary" onClick={() => setShowForm(true)} aria-label="Nueva nota">
              <Plus size={20} />
            </Button>
          ) : undefined
        }
      />

      {hasAlerts && (
        <motion.section className="flex flex-col gap-3 px-4" variants={fadeUp}>
          <SectionTitle>Alertas automáticas</SectionTitle>
          <div className="flex flex-col gap-2">
            {overdueVacunas.map((v) => (
              <Card key={v.id} tone="overdue" padded={false} elevation={0}>
                <Row
                  icon={<AlertCircle size={20} aria-hidden="true" />}
                  iconTone="overdue"
                  title="Vacuna vencida"
                  subtitle={`${v.nombre} · venció el ${formatDate(v.proximaFecha!)}`}
                  href={`/salud/vacunas?pet=${v.petId}`}
                  trailing={<StatusChip severity="overdue" />}
                />
              </Card>
            ))}
            {upcomingVacunas.map((v) => {
              const days = Math.ceil((new Date(v.proximaFecha!).getTime() - Date.now()) / 86400000);
              return (
                <Card key={v.id} tone="warn" padded={false} elevation={0}>
                  <Row
                    icon={<Clock size={20} aria-hidden="true" />}
                    iconTone="warn"
                    title="Vacuna próxima"
                    subtitle={`${v.nombre} · en ${days} día${days !== 1 ? "s" : ""} (${formatDate(v.proximaFecha!)})`}
                    href={`/salud/vacunas?pet=${v.petId}`}
                    trailing={<StatusChip severity="soon" />}
                  />
                </Card>
              );
            })}
          </div>
        </motion.section>
      )}

      {petNotifs.length > 0 && (
        <motion.section className="flex flex-col gap-3 px-4" variants={fadeUp}>
          <SectionTitle
            action={
              unreadCount > 0 ? (
                <Button variant="ghost" size="sm" leading={<CheckCheck size={14} />} onClick={() => void handleMarkAll()}>
                  Marcar todas
                </Button>
              ) : undefined
            }
          >
            Actividad{unreadCount > 0 ? ` · ${unreadCount} nueva${unreadCount !== 1 ? "s" : ""}` : ""}
          </SectionTitle>
          <Card padded={false} className="overflow-hidden">
            {petNotifs.map((n, i) => {
              const cfg = TIPO_TONE[n.tipo];
              const Icon = cfg.icon;
              return (
                <div key={n.id}>
                  {i > 0 && <Divider className="ml-18 mr-0" />}
                  <div className={cn("relative", !n.leida && "bg-primary-soft/25")}>
                    {!n.leida && <span className="absolute top-1/2 left-2 h-2 w-2 -translate-y-1/2 rounded-full bg-primary" aria-hidden="true" />}
                    <Row
                      icon={<Icon size={18} aria-hidden="true" />}
                      iconTone={cfg.rowTone}
                      title={
                        <span className="flex items-center gap-2">
                          <span className={cn("truncate", !n.leida && "font-semibold")}>{n.titulo}</span>
                          {!n.leida && <span className="sr-only">(sin leer)</span>}
                        </span>
                      }
                      subtitle={
                        <span className="flex flex-wrap items-center gap-2">
                          <Tag tone={cfg.tone} size="xs">
                            {TIPO_LABEL[n.tipo]}
                          </Tag>
                          <span>
                            {authorName(n.autorId)} · {timeAgo(n.createdAt)}
                          </span>
                          {n.mensaje && <span className="w-full truncate text-text">{n.mensaje}</span>}
                        </span>
                      }
                      className="items-start"
                      trailing={
                        <div className="flex flex-col gap-1">
                          {!n.leida && (
                            <Button variant="secondary" size="icon" aria-label={`Marcar "${n.titulo}" como leída`} onClick={() => void marcarLeida(n.id)}>
                              <Check size={15} />
                            </Button>
                          )}
                          {n.autorId === currentUser?.id && (
                            <Button variant="dangerTonal" size="icon" aria-label={`Eliminar "${n.titulo}"`} onClick={() => void handleDelete(n.id)} className="border-transparent">
                              <Trash2 size={15} />
                            </Button>
                          )}
                        </div>
                      }
                    />
                  </div>
                </div>
              );
            })}
          </Card>
        </motion.section>
      )}

      {isEmpty && (
        <motion.div className="px-4" variants={fadeUp}>
          <Card>
            <EmptyState
              compact
              icon={<Bell size={24} />}
              title="Sin notificaciones"
              description={`Publica notas sobre ${pet?.name ?? "tu mascota"} visibles para todas las personas con acceso.`}
              action={
                <Button full leading={<Plus size={18} />} onClick={() => setShowForm(true)}>
                  Publicar primera nota
                </Button>
              }
            />
          </Card>
        </motion.div>
      )}

      {!isEmpty && (
        <motion.div className="px-4" variants={fadeUp}>
          <Button full size="lg" leading={<Plus size={18} />} onClick={() => setShowForm(true)}>
            Nueva nota
          </Button>
        </motion.div>
      )}

      {showForm && <NotaForm open onClose={() => setShowForm(false)} />}
    </motion.div>
  );
}
