"use client";
import { intervalLabel } from "@/lib/api/careCycles";
import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { Card, ProgressBar } from "@/components/ui";
import { cycleProgress } from "@/lib/api/careCycles";
import type { CareCycle } from "@/types/db";
import { cn } from "@/lib/utils";
import { fadeUp } from "@/lib/motion";
import { HYGIENE_ICON, hygieneStatus } from "./hygiene";

export function HygieneCycleCard({ cycle, onOpen }: { cycle: CareCycle; onOpen: (c: CareCycle) => void }) {
  const Icon = HYGIENE_ICON[cycle.kind] ?? Sparkles;
  const status = hygieneStatus(cycle);
  const iconBg = status.tone === "danger" ? "bg-danger-container text-danger" : status.tone === "warn" ? "bg-warn-container text-warn" : "bg-primary-container text-on-primary-container";
  return (
    <motion.div variants={fadeUp}>
      <Card interactive role="button" tabIndex={0} onClick={() => onOpen(cycle)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(cycle); } }} className="flex h-full flex-col gap-2" aria-label={`${cycle.name}, ${status.label}`}>
        <div className="flex items-start justify-between gap-2">
          <div className={cn("flex h-11 w-11 items-center justify-center rounded-control", iconBg)}>
            <Icon size={22} />
          </div>
          <div className="text-right">
            <div className={cn("font-display text-[20px] leading-none", status.textClass)}>{status.label}</div>
            {status.days > 0 && <div className="text-[11px] font-semibold text-on-variant">restantes</div>}
          </div>
        </div>
        <div className="min-w-0">
          <div className="truncate text-[16px] font-bold text-on">{cycle.name}</div>
          <div className="text-[13px] text-on-variant">{intervalLabel(cycle)}</div>
        </div>
        <ProgressBar value={cycleProgress(cycle)} tone={status.tone === "ok" ? "primary" : status.tone} className="mt-auto" />
      </Card>
    </motion.div>
  );
}
