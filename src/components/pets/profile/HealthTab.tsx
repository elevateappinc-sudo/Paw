"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarPlus, ChevronRight, History, ShieldCheck } from "lucide-react";
import { Skeleton, showToast } from "@/components/ui";
import { completeCareCycle, daysUntil, dueLabel, fetchAllCareCycles } from "@/lib/api/careCycles";
import { CARE_KIND_ICON, cycleSeverity } from "@/components/pets/petHelpers";
import { PriorHistorySheet, cyclesWithoutHistory } from "@/components/salud/PriorHistorySheet";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { CareCycle, CareCycleKind } from "@/types/db";

const KINDS: CareCycleKind[] = ["vaccine", "deworm_internal", "deworm_external", "checkup"];

/** Fondo del ícono según el estado (escala de severidad) */
const ICON_BOX = {
  overdue: "bg-overdue-soft text-overdue-text",
  soon: "bg-warning-soft text-warning-text",
  ok: "bg-pastel-mint text-success-text",
  info: "bg-pastel-lilac text-primary-text",
} as const;

/**
 * Historial médico (estilo tarjeta de salud): estado y avance arriba, lo
 * pendiente con su check, lo que está al día en mosaicos con su última
 * fecha, y lo que no tiene registro en una sola fila para completarlo.
 */
export function HealthTab({ petId, petName, cycles, onRefresh }: { petId: string; petName: string; cycles: CareCycle[] | null; onRefresh: () => void }) {
  const rows = cycles ? cycles.filter((c) => KINDS.includes(c.kind)).sort((a, b) => a.next_due_at.localeCompare(b.next_due_at)) : null;
  const missing = cyclesWithoutHistory(cycles);
  const [open, setOpen] = useState(false);
  const [allCycles, setAllCycles] = useState<CareCycle[] | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);
  useEffect(() => {
    if (!open) return;
    fetchAllCareCycles(petId).then(setAllCycles).catch(() => setAllCycles(null));
  }, [open, petId, cycles]);

  async function complete(c: CareCycle) {
    if (completing) return;
    setCompleting(c.id);
    try {
      await completeCareCycle(c.id);
      showToast(`${c.name}: hecho`, undefined, "success");
      onRefresh();
    } catch {
      showToast("No pudimos marcarlo como hecho", () => void complete(c), "error");
    } finally {
      setCompleting(null);
    }
  }

  const withHistory = rows?.filter((c) => c.last_done_at) ?? [];
  const pending = withHistory.filter((c) => daysUntil(c.next_due_at) <= 7);
  const upToDate = withHistory.filter((c) => daysUntil(c.next_due_at) > 7);
  const noDate = rows?.filter((c) => !c.last_done_at) ?? [];
  const total = rows?.length ?? 0;
  const allGood = total > 0 && pending.length === 0 && noDate.length === 0;

  return (
    <div className="flex flex-col gap-4 px-4 pt-4">
      <section aria-labelledby="health-title" className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="health-title" className="text-subtitle font-semibold text-text">
              Historial médico
            </h2>
            <p className="text-small text-text-secondary">Vacunas, antiparasitarios y controles</p>
          </div>
          {rows !== null && total > 0 && (
            allGood ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success px-3 py-1 text-label font-semibold text-on-primary">
                Al día <ShieldCheck size={14} aria-hidden="true" />
              </span>
            ) : pending.length > 0 ? (
              <span className="inline-flex shrink-0 items-center rounded-full bg-warning-soft px-3 py-1 text-label font-semibold text-warning-text">
                {pending.length} {pending.length === 1 ? "pendiente" : "pendientes"}
              </span>
            ) : null
          )}
        </div>

        {rows === null ? (
          <div className="mt-4 flex flex-col gap-3" aria-hidden="true">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-2 w-full rounded-full" />
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          </div>
        ) : total === 0 ? (
          <p className="mt-3 text-body text-text-secondary">Aún no hay vacunas ni controles en su plan.</p>
        ) : (
          <>
            {/* Avance */}
            <p className="mt-4 text-small text-text">
              <span className="font-semibold">
                {upToDate.length} de {total}
              </span>{" "}
              al día{allGood ? "" : upToDate.length / total >= 0.6 ? ", ¡casi listo!" : ""}
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-elevated" role="progressbar" aria-valuenow={upToDate.length} aria-valuemin={0} aria-valuemax={total} aria-label="Cuidados de salud al día">
              <div
                className={cn("h-full rounded-full transition-transform duration-[var(--duration-slow)] ease-[var(--ease-standard)]", allGood ? "bg-success" : "bg-warning")}
                style={{ transform: `scaleX(${upToDate.length / total})`, transformOrigin: "left" }}
              />
            </div>

            {/* Pendientes: vencido o en los próximos 7 días, con check */}
            {pending.length > 0 && (
              <>
                <h3 className="mt-5 text-label font-semibold text-text-secondary">Próximos</h3>
                <ul className="enter-soft-list mt-2 flex flex-col gap-2">
                  {pending.map((c) => {
                    const sev = cycleSeverity(c);
                    const Icon = CARE_KIND_ICON[c.kind];
                    const busy = completing === c.id;
                    return (
                      <li key={c.id} className={cn("flex items-center gap-3 rounded-lg bg-surface-elevated py-2 pr-1 pl-2 transition-opacity", busy && "opacity-60")}>
                        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-md", ICON_BOX[sev])}>
                          <Icon size={20} aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-body font-semibold text-text">{c.name}</span>
                          <span className={cn("block text-small", sev === "overdue" ? "text-overdue-text" : "text-warning-text")}>{dueLabel(c.next_due_at)}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => void complete(c)}
                          disabled={!!completing}
                          aria-label={`Marcar ${c.name} como hecho`}
                          aria-busy={busy || undefined}
                          className="pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-full disabled:cursor-default"
                        >
                          <span className={cn("h-7 w-7 rounded-full border-2 transition-colors duration-[var(--duration-fast)]", busy ? "border-success bg-success" : "border-border bg-surface")} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}

            {/* Al día: mosaicos con la última fecha */}
            {upToDate.length > 0 && (
              <>
                <h3 className="mt-5 text-label font-semibold text-text-secondary">Al día</h3>
                <ul className="enter-soft-list mt-2 grid grid-cols-2 gap-3">
                  {upToDate.map((c) => {
                    const Icon = CARE_KIND_ICON[c.kind];
                    return (
                      <li key={c.id} className="flex items-center gap-2">
                        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-md", ICON_BOX.ok)}>
                          <Icon size={20} aria-hidden="true" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-small font-semibold text-text">{c.name}</span>
                          <span className="block text-label text-text-secondary">{formatDate(c.last_done_at!.slice(0, 10))}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}

            {/* Sin registro: una sola fila para completarlos */}
            {noDate.length > 0 && (
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="pressable mt-5 flex w-full items-center gap-3 rounded-lg border border-dashed border-border p-3 text-left"
              >
                <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-md", ICON_BOX.info)}>
                  <CalendarPlus size={20} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-body font-semibold text-text">Añadir fechas</span>
                  <span className="block truncate text-small text-text-secondary">{noDate.map((c) => c.name).join(", ")}</span>
                </span>
                <ChevronRight size={18} className="shrink-0 text-text-secondary" aria-hidden="true" />
              </button>
            )}
          </>
        )}
      </section>

      {/* Acciones secundarias */}
      <div className="grid grid-cols-2 gap-3">
        <Link href={`/salud?pet=${petId}`} className="pressable flex min-h-12 items-center justify-center gap-2 rounded-full border border-border bg-surface text-body font-semibold text-text">
          <History size={18} aria-hidden="true" /> Línea de tiempo
        </Link>
        <Link href="/explorar?cat=veterinaria" className="pressable flex min-h-12 items-center justify-center gap-2 rounded-full bg-pastel-lilac text-body font-semibold text-text">
          Reservar refuerzo
        </Link>
      </div>

      <PriorHistorySheet open={open} onClose={() => setOpen(false)} cycles={allCycles ?? cycles ?? []} petName={petName} petId={petId} onSaved={() => onRefresh()} />
      {missing.length > 0 && noDate.length === 0 && (
        <button type="button" onClick={() => setOpen(true)} className="min-h-11 text-label font-semibold text-primary-text">
          Completar historial ({missing.length})
        </button>
      )}
    </div>
  );
}
