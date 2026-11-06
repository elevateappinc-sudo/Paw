"use client";
import { motion } from "motion/react";
import { Tag, Card, Divider } from "@/components/ui";
import type { ChipTone } from "@/components/ui/Chip";
import { cn } from "@/lib/utils";
import { fadeUp, stagger } from "@/lib/motion";
import { monthKey, monthLabel, shortDate } from "./shared";

export type HistoryKind = "vaccine" | "deworm" | "medication" | "consult" | "weight";

export interface HistoryItem {
  id: string;
  date: string; // YYYY-MM-DD
  kind: HistoryKind;
  title: string;
  subtitle?: string;
  businessId?: string | null;
}

export const HISTORY_KIND_LABEL: Record<HistoryKind, string> = {
  vaccine: "Vacuna",
  deworm: "Antiparasitario",
  medication: "Medicamento",
  consult: "Consulta",
  weight: "Peso",
};

export const HISTORY_KIND_TONE: Record<HistoryKind, ChipTone> = {
  vaccine: "info",
  deworm: "neutral",
  medication: "primary",
  consult: "warn",
  weight: "ok",
};

const dotClass: Record<HistoryKind, string> = {
  vaccine: "bg-primary",
  deworm: "bg-text-secondary",
  medication: "bg-primary",
  consult: "bg-warning",
  weight: "bg-success",
};

export function groupByMonth(items: HistoryItem[]): { key: string; label: string; items: HistoryItem[] }[] {
  const sorted = [...items].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const groups: { key: string; label: string; items: HistoryItem[] }[] = [];
  for (const it of sorted) {
    const key = monthKey(it.date);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(it);
    else groups.push({ key, label: monthLabel(it.date), items: [it] });
  }
  return groups;
}

export function HistoryList({ items, businessNames }: { items: HistoryItem[]; businessNames: Record<string, string> }) {
  const groups = groupByMonth(items);
  return (
    <motion.div variants={stagger(0.03)} initial="hidden" animate="show" className="flex flex-col gap-5">
      {groups.map((g) => (
        <section key={g.key} aria-label={g.label}>
          <h3 className="mb-2 px-1 text-small font-semibold text-text-secondary">{g.label}</h3>
          <Card padded={false} elevation={0} className="overflow-hidden">
            {g.items.map((it, i) => {
              const biz = it.businessId ? businessNames[it.businessId] : undefined;
              return (
                <motion.div key={it.id} variants={fadeUp}>
                  {i > 0 && <Divider />}
                  <div className="flex items-start gap-3 px-4 py-3">
                    <span className={cn("mt-2 h-2 w-2 shrink-0 rounded-full", dotClass[it.kind])} aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <Tag tone={HISTORY_KIND_TONE[it.kind]} size="xs">{HISTORY_KIND_LABEL[it.kind]}</Tag>
                        <span className="text-small font-semibold text-text-secondary">{shortDate(it.date)}</span>
                      </div>
                      <div className="mt-1 truncate text-body font-semibold text-text">{it.title}</div>
                      {it.subtitle && <div className="truncate text-small text-text-secondary">{it.subtitle}</div>}
                      {biz && <div className="mt-1 text-small font-semibold text-success-text">Registrado por {biz}</div>}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </Card>
        </section>
      ))}
    </motion.div>
  );
}
