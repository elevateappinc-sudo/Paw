"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Stethoscope } from "lucide-react";
import { Card, CardHeader, Skeleton, showToast } from "@/components/ui";
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
  const toasted = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    const warn = () => {
      if (!toasted.current) {
        toasted.current = true;
        showToast("No pudimos cargar parte del historial", undefined, "error");
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
  }, [petId]);

  return (
    <div className="flex flex-col gap-4 px-4 pt-4">
      <Card padded={false}>
        <CardHeader title="Visitas" subtitle="Últimas 5 del historial clínico" className="px-4 pt-4" action={<Link href={`/salud/historial?pet=${petId}`}>Ver todo</Link>} />
        {visits === null ? (
          <div className="flex flex-col gap-2 px-4 pb-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : visits.length === 0 ? (
          <p className="px-4 pb-4 text-[14px] text-on-variant">Sin visitas registradas.</p>
        ) : (
          <ul>
            {visits.map((v) => (
              <li key={v.id} className="flex items-center gap-3 border-t border-outline-variant px-4 py-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-info-container text-info">
                  <Stethoscope size={20} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-bold text-on">{VISIT_LABEL[v.visit_type] ?? "Visita"}{v.diagnosis ? ` · ${v.diagnosis}` : ""}</span>
                  <span className="block truncate text-[13px] text-on-variant">
                    {formatDate(v.visit_date)}
                    {v.clinic_name ? ` · ${v.clinic_name}` : v.vet_name ? ` · ${v.vet_name}` : ""}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card padded={false}>
        <CardHeader title="Cuidados hechos" subtitle="Últimos registros del plan" className="px-4 pt-4" />
        {logs === null ? (
          <div className="flex flex-col gap-2 px-4 pb-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <p className="px-4 pb-4 text-[14px] text-on-variant">Todavía no has marcado ningún cuidado como hecho.</p>
        ) : (
          <ul>
            {logs.map((l) => {
              const Icon = CARE_KIND_ICON[l.care_cycles?.kind ?? "other"];
              return (
                <li key={l.id} className="flex items-center gap-3 border-t border-outline-variant px-4 py-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-primary-container text-on-primary-container">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-bold text-on">{l.care_cycles?.name ?? "Cuidado"}</span>
                    <span className="block truncate text-[13px] text-on-variant">
                      {formatDate(l.done_at)}
                      {l.business_name ? ` · ${l.business_name}` : l.product ? ` · ${l.product}` : ""}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
