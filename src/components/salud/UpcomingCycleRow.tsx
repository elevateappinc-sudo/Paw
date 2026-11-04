"use client";
import { motion, useReducedMotion } from "motion/react";
import { Check, CalendarDays } from "lucide-react";
import { useRouter } from "next/navigation";
import { severityFromDays } from "@/components/ui";
import { daysUntil, dueLabel, intervalLabel } from "@/lib/api/careCycles";
import { CARE_KIND_LABEL, type CareCycle } from "@/types/db";
import { fadeUp } from "@/lib/motion";
import { TaskCheck, TaskDue, TaskIcon } from "@/components/tasks/TaskRow";
import { CARE_KIND_ICON } from "@/components/tasks/careIcons";
import { shortDate } from "./shared";

const SWIPE_THRESHOLD = 120;

export function UpcomingCycleRow({ cycle, justCompleted, onComplete }: {
  cycle: CareCycle;
  /** muestra el check animado antes de pasar a historial */
  justCompleted?: boolean;
  onComplete: (cycle: CareCycle) => void;
}) {
  const reduce = useReducedMotion();
  const router = useRouter();
  // Escala de severidad: vencido · vence en 7 días o menos · al día
  const severity = justCompleted ? "ok" : severityFromDays(daysUntil(cycle.next_due_at));
  const Icon = CARE_KIND_ICON[cycle.kind];
  const detail = `${CARE_KIND_LABEL[cycle.kind]} · ${intervalLabel(cycle)} · última ${cycle.last_done_at ? shortDate(cycle.last_done_at) : "sin registro"}`;

  return (
    <motion.li variants={fadeUp} layout className="relative list-none overflow-hidden rounded-md bg-surface">
      {/* fondo que aparece al arrastrar */}
      <div className="absolute inset-0 flex items-center gap-2 bg-success-soft px-4 text-success-text" aria-hidden="true">
        <Check size={20} />
        <span className="text-body font-semibold">Marcar como hecho</span>
      </div>
      <motion.div
        drag={reduce || justCompleted ? false : "x"}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0, right: 0.6 }}
        dragSnapToOrigin
        onDragEnd={(_, info) => {
          if (info.offset.x > SWIPE_THRESHOLD) onComplete(cycle);
        }}
        className="relative flex items-center gap-3 bg-surface py-3 pr-2 pl-4"
        style={{ opacity: justCompleted ? 0.6 : 1, transition: "opacity var(--duration-slow) var(--ease-standard)" }}
      >
        <TaskIcon severity={severity}>
          <Icon size={18} />
        </TaskIcon>
        <div className="min-w-0 flex-1">
          <div className="truncate text-subtitle font-semibold text-text">{cycle.name}</div>
          <TaskDue severity={severity}>{justCompleted ? "Hecho" : dueLabel(cycle.next_due_at)}</TaskDue>
          <div className="truncate text-small text-text-secondary">{detail}</div>
          {cycle.kind === "vaccine" && !justCompleted && (
            <button
              type="button"
              onClick={() => router.push("/explorar?cat=veterinaria")}
              className="pressable mt-1 inline-flex min-h-11 items-center gap-2 text-label font-semibold text-primary-text"
            >
              <CalendarDays size={14} aria-hidden="true" />
              Reservar
            </button>
          )}
        </div>
        <TaskCheck done={!!justCompleted} disabled={justCompleted} onClick={() => onComplete(cycle)} label={`Marcar ${cycle.name} como hecho`} />
      </motion.div>
    </motion.li>
  );
}
