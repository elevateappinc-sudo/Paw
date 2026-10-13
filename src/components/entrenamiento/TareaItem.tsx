"use client";
import { useStore } from "@/store";
import { cn } from "@/lib/utils";
import { Tag, type ChipTone } from "@/components/ui/Chip";
import { AnimatedCheck, type CheckState } from "./AnimatedCheck";
import type { TareaEntrenamiento, TaskStatus } from "@/types";

const STATUS_CONFIG: Record<TaskStatus, { label: string; tone: ChipTone; check: CheckState }> = {
  pendiente: { label: "Pendiente", tone: "warn", check: "off" },
  en_progreso: { label: "En progreso", tone: "info", check: "partial" },
  completado: { label: "Completado", tone: "ok", check: "on" },
};
const STATUS_ORDER: TaskStatus[] = ["pendiente", "en_progreso", "completado"];

interface TareaItemProps {
  tarea: TareaEntrenamiento;
  claseId: string;
}

export function TareaItem({ tarea, claseId }: TareaItemProps) {
  const { updateTarea } = useStore();
  const cfg = STATUS_CONFIG[tarea.estado];

  function cycleStatus() {
    const idx = STATUS_ORDER.indexOf(tarea.estado);
    void updateTarea(claseId, tarea.id, STATUS_ORDER[(idx + 1) % STATUS_ORDER.length]);
  }

  return (
    <div className="flex min-h-[52px] items-center gap-2 py-1 pr-3 pl-1">
      <AnimatedCheck state={cfg.check} onClick={cycleStatus} label={`${tarea.descripcion}: ${cfg.label}. Cambiar estado`} />
      <span className={cn("flex-1 text-[14px]", tarea.estado === "completado" ? "text-on-variant line-through" : "text-on")}>{tarea.descripcion}</span>
      <Tag size="xs" tone={cfg.tone}>
        {cfg.label}
      </Tag>
    </div>
  );
}
