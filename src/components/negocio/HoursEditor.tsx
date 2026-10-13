"use client";
import type { BusinessHours } from "@/types/db";
import { DAY_FULL, DAY_KEYS, type DayKey } from "./negocioData";
import { cn } from "@/lib/utils";

/** Horario semanal: por día, cerrado o una franja. */
export function HoursEditor({ value, onChange, disabled }: { value: BusinessHours; onChange: (h: BusinessHours) => void; disabled?: boolean }) {
  function setDay(key: DayKey, slot: [string, string] | null) {
    const next: BusinessHours = { ...value };
    if (slot) next[key] = [slot];
    else delete next[key];
    onChange(next);
  }

  return (
    <div className={cn("flex flex-col divide-y divide-outline-variant rounded-control border border-outline-variant bg-surface", disabled && "opacity-60")}>
      {DAY_KEYS.map((key) => {
        const slot = value[key]?.[0] ?? null;
        const open = !!slot;
        return (
          <div key={key} className="flex min-h-[52px] items-center gap-2 px-3 py-1.5">
            <label className="flex min-w-[112px] cursor-pointer items-center gap-2 text-[14px] font-semibold text-on">
              <input
                type="checkbox"
                className="h-5 w-5 accent-[var(--pr)]"
                checked={open}
                disabled={disabled}
                onChange={(e) => setDay(key, e.target.checked ? ["08:00", "18:00"] : null)}
                aria-label={`${DAY_FULL[key]} abierto`}
              />
              {DAY_FULL[key]}
            </label>
            {open ? (
              <div className="flex flex-1 items-center justify-end gap-1.5 text-[14px] text-on">
                <input type="time" value={slot[0]} disabled={disabled} aria-label={`${DAY_FULL[key]} abre`} onChange={(e) => setDay(key, [e.target.value, slot[1]])} className="min-h-[36px] rounded-[8px] border border-outline-variant bg-surface-2 px-2 text-on" />
                <span className="text-on-variant">a</span>
                <input type="time" value={slot[1]} disabled={disabled} aria-label={`${DAY_FULL[key]} cierra`} onChange={(e) => setDay(key, [slot[0], e.target.value])} className="min-h-[36px] rounded-[8px] border border-outline-variant bg-surface-2 px-2 text-on" />
              </div>
            ) : (
              <span className="flex-1 text-right text-[13px] font-semibold text-on-variant">Cerrado</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
