"use client";
import { intervalLabel } from "@/lib/api/careCycles";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { Check, CalendarDays } from "lucide-react";
import { useRouter } from "next/navigation";
import { Tag } from "@/components/ui";
import { cycleUrgency, dueLabel } from "@/lib/api/careCycles";
import { CARE_KIND_LABEL, type CareCycle } from "@/types/db";
import { cn } from "@/lib/utils";
import { fadeUp } from "@/lib/motion";
import { kindTone, shortDate } from "./shared";

const SWIPE_THRESHOLD = 120;

export function UpcomingCycleRow({ cycle, justCompleted, onComplete }: {
  cycle: CareCycle;
  /** muestra el check animado antes de pasar a historial */
  justCompleted?: boolean;
  onComplete: (cycle: CareCycle) => void;
}) {
  const reduce = useReducedMotion();
  const router = useRouter();
  const urgency = cycleUrgency(cycle);
  const urgent = urgency === "overdue" || urgency === "soon";
  const dotClass = urgent ? "bg-warn" : cycle.kind === "vaccine" ? "bg-info" : "bg-outline";
  const dateClass = urgency === "overdue" ? "text-danger" : urgency === "soon" ? "text-warn" : "text-on-variant";
  const tagTone = urgent ? "warn" : kindTone(cycle.kind);
  const detail = `${intervalLabel(cycle)} · última ${cycle.last_done_at ? shortDate(cycle.last_done_at) : "sin registro"}`;

  return (
    <motion.li variants={fadeUp} layout className="relative list-none overflow-hidden rounded-card bg-surface">
      {/* fondo que aparece al arrastrar */}
      <div className="absolute inset-0 flex items-center gap-2 bg-ok-container px-5 text-on-ok-container" aria-hidden="true">
        <Check size={20} />
        <span className="text-[14px] font-bold">Marcar como hecho</span>
      </div>
      <motion.div
        drag={reduce || justCompleted ? false : "x"}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0, right: 0.6 }}
        dragSnapToOrigin
        onDragEnd={(_, info) => {
          if (info.offset.x > SWIPE_THRESHOLD) onComplete(cycle);
        }}
        className="relative flex items-center gap-3 bg-surface px-4 py-3"
      >
        <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", dotClass)} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Tag tone={tagTone} size="xs">{CARE_KIND_LABEL[cycle.kind]}</Tag>
            <span className={cn("text-[12px] font-bold", dateClass)}>{dueLabel(cycle.next_due_at)}</span>
          </div>
          <div className="mt-0.5 truncate text-[16px] font-bold text-on">{cycle.name}</div>
          <div className="truncate text-[13px] text-on-variant">{detail}</div>
          {cycle.kind === "vaccine" && !justCompleted && (
            <button
              type="button"
              onClick={() => router.push("/explorar?cat=veterinaria")}
              className="mt-1.5 inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-primary-container px-3 text-[13px] font-bold text-on-primary-container active:scale-95"
            >
              <CalendarDays size={14} />
              Reservar
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => onComplete(cycle)}
          disabled={justCompleted}
          aria-label={`Marcar ${cycle.name} como hecho`}
          className={cn(
            "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            justCompleted ? "border-ok bg-ok text-white" : "border-outline bg-surface text-on-variant active:scale-95"
          )}
        >
          <AnimatePresence initial={false}>
            {justCompleted ? (
              <motion.span
                key="done"
                initial={reduce ? { scale: 1 } : { scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 20 }}
                className="flex"
              >
                <Check size={22} strokeWidth={3} />
              </motion.span>
            ) : (
              <motion.span key="idle" className="flex opacity-60">
                <Check size={18} />
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </motion.div>
    </motion.li>
  );
}
