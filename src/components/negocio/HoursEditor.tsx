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
    <div className={cn("flex flex-col divide-y divide-border rounded-md border border-border bg-surface", disabled && "opacity-60")}>
      {DAY_KEYS.map((key) => {
        const slot = value[key]?.[0] ?? null;
        const open = !!slot;
        return (
          <div key={key} className="flex min-h-13 items-center gap-2 px-3 py-2">
            <label className="flex min-w-[112px] cursor-pointer items-center gap-2 text-body font-semibold text-text">
              <input
                type="checkbox"
                className="h-5 w-5 accent-[var(--color-primary)]"
                checked={open}
                disabled={disabled}
                onChange={(e) => setDay(key, e.target.checked ? ["08:00", "18:00"] : null)}
                aria-label={`${DAY_FULL[key]} abierto`}
              />
              {DAY_FULL[key]}
            </label>
            {open ? (
              <div className="flex flex-1 items-center justify-end gap-2 text-body text-text">
                <input type="time" value={slot[0]} disabled={disabled} aria-label={`${DAY_FULL[key]} abre`} onChange={(e) => setDay(key, [e.target.value, slot[1]])} className="min-h-11 rounded-sm border border-border bg-surface-elevated px-2 text-text" />
                <span className="text-text-secondary">a</span>
                <input type="time" value={slot[1]} disabled={disabled} aria-label={`${DAY_FULL[key]} cierra`} onChange={(e) => setDay(key, [slot[0], e.target.value])} className="min-h-11 rounded-sm border border-border bg-surface-elevated px-2 text-text" />
              </div>
            ) : (
              <span className="flex-1 text-right text-small font-semibold text-text-secondary">Cerrado</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
