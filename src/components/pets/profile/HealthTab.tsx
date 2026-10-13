"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, Tag, Skeleton, buttonVariants } from "@/components/ui";
import { cycleUrgency, fetchAllCareCycles } from "@/lib/api/careCycles";
import { URGENCY_TAG } from "@/components/pets/petHelpers";
import { PriorHistorySheet, PriorHistoryBanner, cyclesWithoutHistory } from "@/components/salud/PriorHistorySheet";
import { formatDate } from "@/lib/utils";
import type { CareCycle, CareCycleKind } from "@/types/db";

const KINDS: CareCycleKind[] = ["vaccine", "deworm_internal", "deworm_external", "checkup"];

export function HealthTab({ petId, petName, cycles, onRefresh }: { petId: string; petName: string; cycles: CareCycle[] | null; onRefresh: () => void }) {
  const rows = cycles?.filter((c) => KINDS.includes(c.kind)) ?? null;
  const missing = cyclesWithoutHistory(cycles);
  const [open, setOpen] = useState(false);
  const [allCycles, setAllCycles] = useState<CareCycle[] | null>(null);
  useEffect(() => {
    if (!open) return;
    fetchAllCareCycles(petId).then(setAllCycles).catch(() => setAllCycles(null));
  }, [open, petId, cycles]);
  return (
    <div className="flex flex-col gap-4 px-4 pt-4">
      <PriorHistoryBanner count={missing.length} onOpen={() => setOpen(true)} />
      <Card padded={false}>
        <CardHeader title="Salud" subtitle="Vacunas, antiparasitarios y controles" className="px-4 pt-4" action={<Link href={`/salud?pet=${petId}`}>Ver línea de tiempo</Link>} />
        {rows === null ? (
          <div className="flex flex-col gap-2 px-4 pb-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="px-4 pb-4 text-[14px] text-on-variant">Sin ciclos de salud todavía.</p>
        ) : (
          <table className="w-full border-collapse text-[13px]">
            <thead className="sr-only">
              <tr>
                <th>Cuidado</th>
                <th>Última</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const t = c.last_done_at ? URGENCY_TAG[cycleUrgency(c)] : { label: "Sin registro", tone: "neutral" as const };
                return (
                  <tr key={c.id} className="h-10 border-t border-outline-variant">
                    <td className="max-w-0 truncate px-4 font-bold text-on">{c.name}</td>
                    <td className="whitespace-nowrap px-2 text-on-variant">{c.last_done_at ? formatDate(c.last_done_at) : "—"}</td>
                    <td className="whitespace-nowrap px-4 text-right">
                      {c.last_done_at ? (
                        <Tag tone={t.tone} size="xs">{t.label}</Tag>
                      ) : (
                        <button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-[32px] items-center rounded-full bg-surface-2 px-2.5 text-[11px] font-bold text-on-variant">
                          Sin registro · añadir
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
      <Link href="/explorar?cat=veterinaria" className={buttonVariants({ variant: "tonal", size: "lg", full: true })}>
        Reservar refuerzo
      </Link>
      <PriorHistorySheet open={open} onClose={() => setOpen(false)} cycles={allCycles ?? cycles ?? []} petName={petName} petId={petId} onSaved={() => onRefresh()} />
    </div>
  );
}
