"use client";
import { intervalLabel } from "@/lib/api/careCycles";
import { motion } from "motion/react";
import { PawPrint } from "lucide-react";
import { Card, ProgressBar, SEVERITY } from "@/components/ui";
import { cycleProgress } from "@/lib/api/careCycles";
import type { CareCycle } from "@/types/db";
import { cn } from "@/lib/utils";
import { fadeUp } from "@/lib/motion";
import { HYGIENE_ICON, hygieneStatus } from "./hygiene";

export function HygieneCycleCard({ cycle, onOpen }: { cycle: CareCycle; onOpen: (c: CareCycle) => void }) {
  const Icon = HYGIENE_ICON[cycle.kind] ?? PawPrint;
  const status = hygieneStatus(cycle);
  const iconBg = status.tone === "overdue" ? "bg-overdue-soft text-overdue-text" : status.tone === "warn" ? "bg-warning-soft text-warning-text" : "bg-success-soft text-success-text";
  const StatusIcon = SEVERITY[status.severity].icon;
  return (
    <motion.div variants={fadeUp}>
      <Card interactive role="button" tabIndex={0} onClick={() => onOpen(cycle)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(cycle); } }} className="flex h-full flex-col gap-2" aria-label={`${cycle.name}, ${status.label}`}>
        <div className="flex items-start justify-between gap-2">
          <div className={cn("flex h-11 w-11 items-center justify-center rounded-sm", iconBg)}>
            <Icon size={22} />
          </div>
          <div className="text-right">
            <div className={cn("inline-flex items-center gap-1 font-semibold text-title leading-none", status.textClass)}>
              <StatusIcon size={18} aria-hidden="true" />
              {status.label}
            </div>
            {status.days > 0 && <div className="text-label font-semibold text-text-secondary">restantes</div>}
          </div>
        </div>
        <div className="min-w-0">
          <div className="truncate text-subtitle font-semibold text-text">{cycle.name}</div>
          <div className="text-small text-text-secondary">{intervalLabel(cycle)}</div>
        </div>
        <ProgressBar value={cycleProgress(cycle)} tone={status.tone} className="mt-auto" />
      </Card>
    </motion.div>
  );
}
