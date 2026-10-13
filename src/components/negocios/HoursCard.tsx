"use client";
import { Card, CardHeader } from "@/components/ui";
import { DAY_LABEL, closesAtLabel, isOpenNow } from "@/lib/api/businesses";
import type { BusinessHours } from "@/types/db";
import { cn } from "@/lib/utils";

const DAYS: (keyof BusinessHours)[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const TODAY_KEY: (keyof BusinessHours)[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export function HoursCard({ hours, emergency }: { hours: BusinessHours | null; emergency: boolean }) {
  const today = TODAY_KEY[new Date().getDay()];
  const openNow = isOpenNow(hours, emergency);
  const closes = closesAtLabel(hours);

  return (
    <Card>
      <CardHeader
        title="Horario"
        subtitle={emergency ? "Urgencias 24 h, todos los días" : openNow ? `Abierto ahora${closes ? ` · ${closes}` : ""}` : closes ? `Cerrado · ${closes}` : "Cerrado hoy"}
      />
      <div className="grid grid-cols-7 gap-1.5" aria-hidden="true">
        {DAYS.map((d) => {
          const has = emergency || !!hours?.[d]?.length;
          const isToday = d === today;
          const tone = isToday ? (openNow ? "bg-ok" : "bg-warn") : has ? "bg-surface-3" : "bg-surface-2";
          return (
            <div key={d} className="flex flex-col items-center gap-1">
              <div className={cn("h-2 w-full rounded-full", tone)} />
              <span className={cn("text-[11px] font-bold", isToday ? "text-on" : "text-on-variant")}>{DAY_LABEL[d]}</span>
            </div>
          );
        })}
      </div>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[13px]">
        {DAYS.map((d) => {
          const slots = hours?.[d];
          const isToday = d === today;
          return (
            <div key={d} className="contents">
              <dt className={cn("font-bold", isToday ? "text-on" : "text-on-variant")}>{DAY_LABEL[d]}</dt>
              <dd className={cn(isToday ? "text-on" : "text-on-variant")}>
                {emergency ? "24 h" : slots && slots.length ? slots.map(([a, b]) => `${a}–${b}`).join(", ") : "Cerrado"}
              </dd>
            </div>
          );
        })}
      </dl>
    </Card>
  );
}
