"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";

export interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date) => void;
  label?: string;
  error?: string;
  minDate?: Date;
  maxDate?: Date;
}

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const DAYS_ES = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

function formatDateES(date: Date): string {
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isDisabled(day: Date, minDate?: Date, maxDate?: Date): boolean {
  if (minDate && day < minDate) return true;
  if (maxDate && day > maxDate) return true;
  return false;
}

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const firstDay = new Date(year, month, 1);
  // Week starts on Monday (0=Mon…6=Sun). getDay() returns 0=Sun,1=Mon…
  const startDow = (firstDay.getDay() + 6) % 7; // shift so Mon=0
  // Fill leading blanks
  for (let i = 0; i < startDow; i++) {
    days.push(new Date(year, month, -(startDow - 1 - i)));
  }
  const last = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= last; d++) {
    days.push(new Date(year, month, d));
  }
  return days;
}

export function DatePicker({
  value,
  onChange,
  label,
  error,
  minDate,
  maxDate,
}: DatePickerProps) {
  // ---------- Mobile: native input ----------
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // ---------- Desktop state ----------
  const [open, setOpen] = useState(false);
  const today = new Date();
  const [viewYear, setViewYear] = useState(value?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(value?.getMonth() ?? today.getMonth());
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLInputElement>(null);

  const days = getDaysInMonth(viewYear, viewMonth);
  const currentMonthDays = days.filter((d) => d.getMonth() === viewMonth);

  const prevMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 0) { setViewYear((y) => y - 1); return 11; }
      return m - 1;
    });
    setFocusedIdx(null);
  }, []);

  const nextMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 11) { setViewYear((y) => y + 1); return 0; }
      return m + 1;
    });
    setFocusedIdx(null);
  }, []);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Keyboard handler on the popover
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); triggerRef.current?.focus(); return; }
      if (!open) return;
      const validDays = days.filter((d) => d.getMonth() === viewMonth);
      if (e.key === "Tab") {
        // Let browser handle tab naturally within the popover
        return;
      }
      if (e.key === "Enter" && focusedIdx !== null) {
        const day = validDays[focusedIdx];
        if (day && !isDisabled(day, minDate, maxDate)) {
          onChange(day);
          setOpen(false);
        }
        e.preventDefault();
      }
      if (e.key === "ArrowRight") {
        setFocusedIdx((i) => Math.min((i ?? -1) + 1, validDays.length - 1));
        e.preventDefault();
      }
      if (e.key === "ArrowLeft") {
        setFocusedIdx((i) => Math.max((i ?? 1) - 1, 0));
        e.preventDefault();
      }
      if (e.key === "ArrowDown") {
        setFocusedIdx((i) => Math.min((i ?? -7) + 7, validDays.length - 1));
        e.preventDefault();
      }
      if (e.key === "ArrowUp") {
        setFocusedIdx((i) => Math.max((i ?? 7) - 7, 0));
        e.preventDefault();
      }
    },
    [open, days, viewMonth, focusedIdx, minDate, maxDate, onChange]
  );

  // ---------- Render ----------
  const inputId = label ? label.toLowerCase().replace(/\s+/g, "-") + "-datepicker" : "datepicker";

  if (!isDesktop) {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <input
          id={inputId}
          type="date"
          className={`w-full rounded-xl px-4 py-3 bg-surface text-white outline-none transition-colors border ${
            error ? "border-red-500" : "border-border focus:border-accent"
          }`}
          value={value ? value.toISOString().split("T")[0] : ""}
          min={minDate?.toISOString().split("T")[0]}
          max={maxDate?.toISOString().split("T")[0]}
          onChange={(e) => {
            if (e.target.value) onChange(new Date(e.target.value + "T00:00:00"));
          }}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }

  // Desktop
  const validDays = days.filter((d) => d.getMonth() === viewMonth);

  return (
    <div className="flex flex-col gap-1 relative">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <input
        ref={triggerRef}
        id={inputId}
        readOnly
        className={`w-full rounded-xl px-4 py-3 bg-surface text-white outline-none transition-colors border cursor-pointer ${
          error ? "border-red-500" : "border-border focus:border-accent"
        }`}
        value={value ? formatDateES(value) : ""}
        placeholder="Seleccionar fecha"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") { setOpen((o) => !o); e.preventDefault(); }
          if (e.key === "Escape") setOpen(false);
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}

      {open && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label="Calendario"
          className="absolute top-full mt-2 left-0 z-50 rounded-2xl p-4 shadow-xl bg-surface-2 border border-border w-72"
          onKeyDown={handleKeyDown}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-text-secondary hover:text-white transition-colors"
              aria-label="Mes anterior"
            >
              ←
            </button>
            <span className="text-sm font-semibold text-white">
              {MONTHS_ES[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-text-secondary hover:text-white transition-colors"
              aria-label="Mes siguiente"
            >
              →
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS_ES.map((d) => (
              <div key={d} className="text-center text-xs text-text-secondary py-1 font-medium">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid — render all cells including leading blanks */}
          <div className="grid grid-cols-7 gap-y-1">
            {days.map((day, idx) => {
              const inMonth = day.getMonth() === viewMonth;
              if (!inMonth) return <div key={idx} />;

              const validIdx = validDays.indexOf(day);
              const selected = value ? isSameDay(day, value) : false;
              const disabled = isDisabled(day, minDate, maxDate);
              const focused = focusedIdx === validIdx;

              return (
                <button
                  key={idx}
                  type="button"
                  tabIndex={focused ? 0 : -1}
                  disabled={disabled}
                  onClick={() => {
                    if (!disabled) { onChange(day); setOpen(false); }
                  }}
                  onFocus={() => setFocusedIdx(validIdx)}
                  className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full text-sm transition-colors
                    ${selected ? "bg-accent text-[#000000] font-semibold" : ""}
                    ${!selected && !disabled ? "hover:bg-white/10 text-white" : ""}
                    ${disabled ? "opacity-30 cursor-not-allowed text-text-secondary" : ""}
                    ${focused && !selected ? "ring-2 ring-accent" : ""}
                  `}
                  aria-pressed={selected}
                  aria-label={formatDateES(day)}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
