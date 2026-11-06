"use client";
import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover } from "./Popover";

/*
 * Selectores propios del design system (reemplazan los nativos del navegador,
 * que no se pueden tematizar): calendario, campo de fecha, campo de hora y
 * lista de opciones. Todos usan tokens, abren en un Popover y se manejan con
 * teclado.
 */

const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const MONTHS_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sept", "oct", "nov", "dic"];
const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];
const WEEKDAYS_FULL = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

const pad = (n: number) => String(n).padStart(2, "0");
const toIso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
function parseIso(iso: string | undefined | null): { y: number; m: number; d: number } | null {
  const r = iso ? /^(\d{4})-(\d{2})-(\d{2})/.exec(iso) : null;
  return r ? { y: Number(r[1]), m: Number(r[2]) - 1, d: Number(r[3]) } : null;
}
function todayIso(): string {
  const t = new Date();
  return toIso(t.getFullYear(), t.getMonth(), t.getDate());
}
function shiftIso(iso: string, days: number): string {
  const p = parseIso(iso)!;
  const d = new Date(p.y, p.m, p.d + days);
  return toIso(d.getFullYear(), d.getMonth(), d.getDate());
}
const cap = (s: string) => s.charAt(0).toLocaleUpperCase("es") + s.slice(1);

/** "5 nov 2026" */
export function formatShortDate(iso: string): string {
  const p = parseIso(iso);
  return p ? `${p.d} ${MONTHS_SHORT[p.m]} ${p.y}` : "";
}

/** Caja de campo compartida (misma geometría que Input) */
export function fieldBoxClass({ invalid, compact, disabled }: { invalid?: boolean; compact?: boolean; disabled?: boolean }) {
  return cn(
    "flex w-full min-w-0 items-center gap-2 rounded-md border text-left text-body outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
    compact ? "min-h-11 bg-bg px-3" : "min-h-[50px] bg-surface px-4",
    invalid ? "border-overdue" : "border-border",
    disabled && "cursor-not-allowed opacity-50"
  );
}

/* ───────────────────────── Calendario ───────────────────────── */

type View = "days" | "months" | "years";

export function Calendar({ value, min, max, onSelect, onClear }: { value?: string; min?: string; max?: string; onSelect: (iso: string) => void; onClear?: () => void }) {
  const today = todayIso();
  const start = parseIso(value) ?? parseIso(max && today > max ? max : min && today < min ? min : today)!;
  const [year, setYear] = useState(start.y);
  const [month, setMonth] = useState(start.m);
  const [view, setView] = useState<View>("days");
  const [focus, setFocus] = useState(value || toIso(start.y, start.m, Math.min(start.d, 28)));
  const keyNav = useRef(false);
  const grid = useRef<HTMLDivElement | null>(null);

  const out = (iso: string) => (!!min && iso < min) || (!!max && iso > max);
  const minP = parseIso(min);
  const maxP = parseIso(max);
  const canPrev = !minP || year * 12 + month > minP.y * 12 + minP.m;
  const canNext = !maxP || year * 12 + month < maxP.y * 12 + maxP.m;

  useEffect(() => {
    if (!keyNav.current) return;
    keyNav.current = false;
    grid.current?.querySelector<HTMLButtonElement>(`[data-iso="${focus}"]`)?.focus();
  }, [focus, month, year]);

  function goMonth(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  function onGridKey(e: React.KeyboardEvent) {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    if (!step) return;
    e.preventDefault();
    const next = shiftIso(focus, step);
    if (out(next)) return;
    const p = parseIso(next)!;
    keyNav.current = true;
    setFocus(next);
    if (p.m !== month || p.y !== year) {
      setYear(p.y);
      setMonth(p.m);
    }
  }

  const blanks = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysIn = new Date(year, month + 1, 0).getDate();
  const yearsStart = year - (year % 12);

  return (
    <div className="w-[296px] select-none">
      {/* Encabezado: mes y año (toca para saltar de año) y flechas */}
      <div className="flex items-center justify-between gap-2 pb-2">
        <button
          type="button"
          onClick={() => setView(view === "days" ? "years" : "days")}
          aria-label={view === "days" ? "Elegir mes y año" : "Volver a los días"}
          className="pressable flex min-h-11 items-center gap-1 rounded-full px-2 text-subtitle font-semibold text-text"
        >
          {view === "years" ? `${yearsStart} – ${yearsStart + 11}` : view === "months" ? year : `${cap(MONTHS[month])} ${year}`}
          <ChevronDown size={16} className={cn("text-text-secondary transition-transform duration-[var(--duration-fast)]", view !== "days" && "rotate-180")} aria-hidden="true" />
        </button>
        {view !== "months" && (
          <div className="flex items-center gap-1">
            <NavButton label={view === "years" ? "Años anteriores" : "Mes anterior"} disabled={view === "days" && !canPrev} onClick={() => (view === "years" ? setYear(year - 12) : goMonth(-1))}>
              <ChevronLeft size={18} aria-hidden="true" />
            </NavButton>
            <NavButton label={view === "years" ? "Años siguientes" : "Mes siguiente"} disabled={view === "days" && !canNext} onClick={() => (view === "years" ? setYear(year + 12) : goMonth(1))}>
              <ChevronRight size={18} aria-hidden="true" />
            </NavButton>
          </div>
        )}
      </div>

      {view === "days" && (
        <div ref={grid} role="grid" aria-label={`${cap(MONTHS[month])} ${year}`} onKeyDown={onGridKey}>
          <div role="row" className="grid grid-cols-7">
            {WEEKDAYS.map((w, i) => (
              <span key={w + i} role="columnheader" aria-label={WEEKDAYS_FULL[i]} className="flex h-8 items-center justify-center text-label font-semibold text-text-secondary">
                {w}
              </span>
            ))}
          </div>
          <div role="row" className="grid grid-cols-7 gap-y-1">
            {Array.from({ length: blanks }, (_, i) => (
              <span key={`b${i}`} aria-hidden="true" />
            ))}
            {Array.from({ length: daysIn }, (_, i) => {
              const iso = toIso(year, month, i + 1);
              const selected = iso === value;
              const isToday = iso === today;
              const disabled = out(iso);
              return (
                <span key={iso} role="gridcell" className="flex justify-center">
                  <button
                    type="button"
                    data-iso={iso}
                    tabIndex={iso === focus || (!focus.startsWith(`${year}-${pad(month + 1)}`) && i === 0) ? 0 : -1}
                    disabled={disabled}
                    aria-pressed={selected}
                    aria-current={isToday ? "date" : undefined}
                    aria-label={`${i + 1} de ${MONTHS[month]} de ${year}`}
                    onClick={() => onSelect(iso)}
                    onFocus={() => setFocus(iso)}
                    className={cn(
                      "relative flex h-10 w-10 items-center justify-center rounded-full text-body tabular-nums transition-colors duration-[var(--duration-fast)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary",
                      selected
                        ? "bg-primary font-semibold text-on-primary"
                        : disabled
                          ? "text-text-secondary opacity-40"
                          : isToday
                            ? "font-semibold text-primary-text active:bg-primary-soft"
                            : "text-text active:bg-primary-soft"
                    )}
                  >
                    {i + 1}
                    {isToday && !selected && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-current" aria-hidden="true" />}
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {view === "years" && (
        <div className="grid grid-cols-3 gap-2 py-1">
          {Array.from({ length: 12 }, (_, i) => yearsStart + i).map((y) => {
            const disabled = (!!minP && y < minP.y) || (!!maxP && y > maxP.y);
            return (
              <GridChoice key={y} selected={y === parseIso(value)?.y} disabled={disabled} onClick={() => { setYear(y); setView("months"); }}>
                {y}
              </GridChoice>
            );
          })}
        </div>
      )}

      {view === "months" && (
        <div className="grid grid-cols-3 gap-2 py-1">
          {MONTHS_SHORT.map((m, i) => {
            const ym = year * 12 + i;
            const disabled = (!!minP && ym < minP.y * 12 + minP.m) || (!!maxP && ym > maxP.y * 12 + maxP.m);
            const v = parseIso(value);
            return (
              <GridChoice key={m} selected={!!v && v.y === year && v.m === i} disabled={disabled} onClick={() => { setMonth(i); setView("days"); }}>
                {cap(m)}
              </GridChoice>
            );
          })}
        </div>
      )}

      {/* Pie: borrar y hoy */}
      <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
        {onClear ? (
          <button type="button" onClick={onClear} className="pressable min-h-11 rounded-full px-3 text-small font-semibold text-text-secondary">
            Borrar
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          disabled={out(today)}
          onClick={() => onSelect(today)}
          className="pressable min-h-11 rounded-full bg-primary-soft px-4 text-small font-semibold text-primary-text disabled:opacity-40"
        >
          Hoy
        </button>
      </div>
    </div>
  );
}

function NavButton({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="pressable flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-text disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function GridChoice({ selected, disabled, onClick, children }: { selected: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "pressable min-h-11 rounded-full text-body tabular-nums disabled:opacity-30",
        selected ? "bg-primary font-semibold text-on-primary" : "bg-surface-elevated text-text"
      )}
    >
      {children}
    </button>
  );
}

/* ───────────────────────── Campo de fecha ───────────────────────── */

export interface DateFieldProps {
  value: string;
  onChange: (iso: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  invalid?: boolean;
  /** Campo pequeño para filas y tarjetas (44 px, fondo bg) */
  compact?: boolean;
  className?: string;
}

export function DateField({ value, onChange, min, max, placeholder = "Elegir fecha", disabled, required, id, invalid, compact, className, ...aria }: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement | null>(null);
  return (
    <>
      <button
        ref={btn}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={aria["aria-label"] ? `${aria["aria-label"]}${value ? `: ${formatShortDate(value)}` : ""}` : undefined}
        aria-describedby={aria["aria-describedby"]}
        onClick={() => setOpen((o) => !o)}
        className={cn(fieldBoxClass({ invalid, compact, disabled }), open && "border-primary", className)}
      >
        <span className={cn("min-w-0 flex-1 truncate tabular-nums", value ? "text-text" : "text-text-secondary")}>{value ? formatShortDate(value) : placeholder}</span>
        <CalendarDays size={18} className="shrink-0 text-text-secondary" aria-hidden="true" />
      </button>
      {/* Mantiene la validación nativa de `required` en formularios */}
      {required && <input tabIndex={-1} aria-hidden="true" className="sr-only" required value={value} onChange={() => {}} onFocus={() => btn.current?.focus()} />}
      <Popover open={open} anchor={btn} onClose={() => setOpen(false)} label="Elegir fecha">
        <Calendar
          value={value}
          min={min}
          max={max}
          onSelect={(iso) => {
            onChange(iso);
            setOpen(false);
            btn.current?.focus();
          }}
          onClear={
            required
              ? undefined
              : () => {
                  onChange("");
                  setOpen(false);
                  btn.current?.focus();
                }
          }
        />
      </Popover>
    </>
  );
}

/* ───────────────────────── Campo de hora ───────────────────────── */

export interface TimeFieldProps {
  value: string;
  onChange: (hhmm: string) => void;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  "aria-label"?: string;
  invalid?: boolean;
  compact?: boolean;
  className?: string;
  placeholder?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => pad(i));
const MINUTES = Array.from({ length: 12 }, (_, i) => pad(i * 5));

export function TimeField({ value, onChange, disabled, required, id, invalid, compact, className, placeholder = "--:--", ...aria }: TimeFieldProps) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement | null>(null);
  const [h, m] = value ? value.split(":") : ["", ""];
  const minutes = m && !MINUTES.includes(m) ? [...MINUTES, m].sort() : MINUTES;
  const set = (hh: string, mm: string) => onChange(`${hh || "08"}:${mm || "00"}`);
  return (
    <>
      <button
        ref={btn}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={aria["aria-label"] ? `${aria["aria-label"]}${value ? `: ${value}` : ""}` : undefined}
        onClick={() => setOpen((o) => !o)}
        className={cn(fieldBoxClass({ invalid, compact, disabled }), open && "border-primary", className)}
      >
        <span className={cn("min-w-0 flex-1 tabular-nums", value ? "text-text" : "text-text-secondary")}>{value || placeholder}</span>
        <Clock size={18} className="shrink-0 text-text-secondary" aria-hidden="true" />
      </button>
      {required && <input tabIndex={-1} aria-hidden="true" className="sr-only" required value={value} onChange={() => {}} onFocus={() => btn.current?.focus()} />}
      <Popover open={open} anchor={btn} onClose={() => setOpen(false)} label="Elegir hora">
        <div className="w-[208px]">
          <div className="grid grid-cols-2 gap-2">
            <TimeColumn label="Hora" items={HOURS} selected={h} onPick={(v) => set(v, m)} />
            <TimeColumn label="Minutos" items={minutes} selected={m} onPick={(v) => set(h, v)} />
          </div>
          <button
            type="button"
            onClick={() => {
              if (!value) set("", "");
              setOpen(false);
              btn.current?.focus();
            }}
            className="pressable mt-3 flex min-h-11 w-full items-center justify-center rounded-full bg-primary text-body font-semibold text-on-primary"
          >
            Listo
          </button>
        </div>
      </Popover>
    </>
  );
}

function TimeColumn({ label, items, selected, onPick }: { label: string; items: string[]; selected: string; onPick: (v: string) => void }) {
  const list = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    list.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ block: "center" });
  }, []);
  return (
    <div>
      <div className="eyebrow pb-1 text-center">{label}</div>
      <div ref={list} role="listbox" aria-label={label} className="no-scrollbar flex h-48 flex-col gap-1 overflow-y-auto rounded-lg bg-surface-elevated p-1">
        {items.map((v) => (
          <button
            key={v}
            type="button"
            role="option"
            aria-selected={v === selected}
            onClick={() => onPick(v)}
            className={cn("min-h-10 shrink-0 rounded-md text-body tabular-nums", v === selected ? "bg-primary font-semibold text-on-primary" : "text-text")}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── Lista de opciones ───────────────────────── */

export interface OptionSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  invalid?: boolean;
  compact?: boolean;
  className?: string;
}

export function OptionSelect({ value, onChange, options, placeholder = "Elegir", disabled, required, id, invalid, compact, className, ...aria }: OptionSelectProps) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement | null>(null);
  const listId = useId();
  const all = useMemo(() => (placeholder && !required ? [{ value: "", label: placeholder }, ...options] : options), [options, placeholder, required]);
  const current = options.find((o) => o.value === value);
  const [active, setActive] = useState(0);
  const list = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const i = Math.max(0, all.findIndex((o) => o.value === value));
    setActive(i);
    requestAnimationFrame(() => list.current?.querySelectorAll<HTMLElement>('[role="option"]')[i]?.focus());
  }, [open, all, value]);

  function pick(v: string) {
    onChange(v);
    setOpen(false);
    btn.current?.focus();
  }

  function onListKey(e: React.KeyboardEvent) {
    const n = all.length;
    let i = active;
    if (e.key === "ArrowDown") i = (active + 1) % n;
    else if (e.key === "ArrowUp") i = (active - 1 + n) % n;
    else if (e.key === "Home") i = 0;
    else if (e.key === "End") i = n - 1;
    else if (e.key === "Tab") return setOpen(false);
    else return;
    e.preventDefault();
    setActive(i);
    list.current?.querySelectorAll<HTMLElement>('[role="option"]')[i]?.focus();
  }

  return (
    <>
      <button
        ref={btn}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={aria["aria-label"] ? `${aria["aria-label"]}: ${current?.label ?? placeholder}` : undefined}
        aria-describedby={aria["aria-describedby"]}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={cn(fieldBoxClass({ invalid, compact, disabled }), open && "border-primary", className)}
      >
        <span className={cn("min-w-0 flex-1 truncate", current ? "text-text" : "text-text-secondary")}>{current?.label ?? placeholder}</span>
        <ChevronDown size={18} className={cn("shrink-0 text-text-secondary transition-transform duration-[var(--duration-fast)]", open && "rotate-180")} aria-hidden="true" />
      </button>
      {required && <input tabIndex={-1} aria-hidden="true" className="sr-only" required value={value} onChange={() => {}} onFocus={() => btn.current?.focus()} />}
      <Popover open={open} anchor={btn} onClose={() => setOpen(false)} label={aria["aria-label"] ?? "Opciones"} matchWidth className="p-1">
        <ul ref={list} id={listId} role="listbox" aria-label={aria["aria-label"]} onKeyDown={onListKey} className="max-h-72 overflow-y-auto">
          {all.map((o, i) => {
            const selected = o.value === value;
            return (
              <li key={o.value || "__empty"}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  tabIndex={i === active ? 0 : -1}
                  onClick={() => pick(o.value)}
                  className={cn(
                    "flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-body focus-visible:bg-primary-soft focus-visible:outline-none active:bg-primary-soft",
                    selected ? "font-semibold text-text" : o.value === "" ? "text-text-secondary" : "text-text"
                  )}
                >
                  <span className="min-w-0 flex-1">{o.label}</span>
                  {selected && <Check size={18} className="shrink-0 text-primary-text" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
      </Popover>
    </>
  );
}
