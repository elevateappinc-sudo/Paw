"use client";
import { ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PetHealth } from "@/components/icons/pet";
import { Skeleton, showToast } from "@/components/ui";
import { ExpensesTab } from "./ExpensesTab";
import { createClient } from "@/lib/supabase/client";
import { fetchCycleLogs } from "@/lib/api/careCycles";
import { CARE_KIND_ICON } from "@/components/pets/petHelpers";
import { formatDate } from "@/lib/utils";
import type { ClinicalRecord, VisitType } from "@/types";
import type { CareCycleLog, CareCycle } from "@/types/db";

const VISIT_LABEL: Record<VisitType, string> = {
  consulta_general: "Consulta general",
  emergencia: "Urgencia",
  cirugia: "Cirugía",
  control_rutina: "Control de rutina",
  peluqueria: "Peluquería",
  otro: "Visita",
};

type Visit = Pick<ClinicalRecord, "id" | "visit_date" | "visit_type" | "clinic_name" | "vet_name" | "diagnosis">;
type Log = CareCycleLog & { care_cycles: Pick<CareCycle, "name" | "kind"> | null; business_name?: string | null };

export function HistoryTab({ petId }: { petId: string }) {
  const [visits, setVisits] = useState<Visit[] | null>(null);
  const [logs, setLogs] = useState<Log[] | null>(null);
  const [attempt, setAttempt] = useState(0);
  const toasted = useRef(false);

  useEffect(() => {
    let cancelled = false;
    toasted.current = false;
    const supabase = createClient();
    const warn = () => {
      if (!toasted.current) {
        toasted.current = true;
        showToast("No pudimos cargar parte del historial", () => {
          setVisits(null);
          setLogs(null);
          setAttempt((n) => n + 1);
        }, "error");
      }
    };
    (async () => {
      const { data, error } = await supabase
        .from("clinical_records")
        .select("id, visit_date, visit_type, clinic_name, vet_name, diagnosis")
        .eq("pet_id", petId)
        .order("visit_date", { ascending: false })
        .limit(5);
      if (cancelled) return;
      if (error) warn();
      setVisits((data ?? []) as Visit[]);
    })();
    (async () => {
      try {
        const rows = (await fetchCycleLogs(petId, { limit: 5 })) as Log[];
        const ids = Array.from(new Set(rows.map((r) => r.business_id).filter((x): x is string => !!x)));
        if (ids.length > 0) {
          const { data } = await supabase.from("businesses").select("id, name").in("id", ids);
          const names = new Map<string, string>(((data ?? []) as { id: string; name: string }[]).map((b) => [b.id, b.name]));
          rows.forEach((r) => (r.business_name = r.business_id ? names.get(r.business_id) ?? null : null));
        }
        if (!cancelled) setLogs(rows);
      } catch {
        if (!cancelled) {
          setLogs([]);
          warn();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [petId, attempt]);

  // Una sola línea de tiempo: visitas y cuidados hechos, lo más reciente primero
  const items =
    visits === null || logs === null
      ? null
      : [
          ...visits.map((v) => ({
            key: `v-${v.id}`,
            date: v.visit_date,
            icon: PetHealth,
            tone: "bg-pastel-lilac text-primary-text",
            title: `${VISIT_LABEL[v.visit_type] ?? "Visita"}${v.diagnosis ? ` · ${v.diagnosis}` : ""}`,
            place: v.clinic_name ?? v.vet_name ?? null,
          })),
          ...logs.map((l) => ({
            key: `l-${l.id}`,
            date: l.done_at,
            icon: CARE_KIND_ICON[l.care_cycles?.kind ?? "other"],
            tone: "bg-pastel-mint text-success-text",
            title: l.care_cycles?.name ?? "Cuidado",
            place: l.business_name ?? l.product ?? null,
          })),
        ]
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, 8);

  return (
    <div className="flex flex-col gap-4 px-4 pt-4">
      <section aria-labelledby="history-title" className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex items-center justify-between gap-3 py-2 pr-2 pl-4">
          <h3 id="history-title" className="text-subtitle font-semibold text-text">
            Actividad reciente
          </h3>
          <Link href={`/salud/historial?pet=${petId}`} aria-label="Ver todo el historial" className="pressable flex h-11 w-11 items-center justify-center rounded-full text-text-secondary">
            <ChevronRight size={20} aria-hidden="true" />
          </Link>
        </div>
        {items === null ? (
          <div className="flex flex-col gap-2 px-4 pb-4" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="px-4 pb-4 text-small text-text-secondary">Aún no hay visitas ni cuidados registrados.</p>
        ) : (
          <ul className="enter-soft-list">
            {items.map((it) => {
              const Icon = it.icon;
              return (
                <li key={it.key} className="flex items-center gap-3 border-t border-border px-4 py-3">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${it.tone}`}>
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-body font-semibold text-text">{it.title}</span>
                    <span className="block truncate text-small text-text-secondary">
                      {formatDate(it.date.slice(0, 10))}
                      {it.place ? ` · ${it.place}` : ""}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <ExpensesTab petId={petId} />
    </div>
  );
}
