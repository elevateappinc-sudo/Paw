"use client";
import React, { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";
import { DateField, OptionSelect, TimeField } from "./Pickers";

interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  trailing?: React.ReactNode;
  leading?: React.ReactNode;
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement>, FieldProps {}

/** Evento mínimo para los campos propios: los llamadores solo leen target.value */
function changeEvent(value: string) {
  return { target: { value }, currentTarget: { value } } as unknown as React.ChangeEvent<HTMLInputElement>;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, hint, error, trailing, leading, className, id, ...props }, ref) => {
  const autoId = useId();
  const inputId = id ?? autoId;
  // Fecha y hora usan los selectores del design system, no los nativos
  if (props.type === "date" || props.type === "time") {
    const Field = props.type === "date" ? DateField : TimeField;
    const describedBy = error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined;
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        {label && (
          <label htmlFor={inputId} className="text-small font-semibold text-text-secondary">
            {label}
          </label>
        )}
        <Field
          id={inputId}
          value={String(props.value ?? "")}
          onChange={(v: string) => props.onChange?.(changeEvent(v))}
          min={typeof props.min === "string" ? props.min : undefined}
          max={typeof props.max === "string" ? props.max : undefined}
          disabled={props.disabled}
          required={props.required}
          invalid={!!error}
          aria-label={props["aria-label"]}
          aria-describedby={describedBy}
          placeholder={props.placeholder}
        />
        {error ? (
          <p id={`${inputId}-err`} className="text-small font-semibold text-overdue-text">{error}</p>
        ) : hint ? (
          <p id={`${inputId}-hint`} className="text-small text-text-secondary">{hint}</p>
        ) : null}
      </div>
    );
  }
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <label htmlFor={inputId} className="text-small font-semibold text-text-secondary">
          {label}
        </label>
      )}
      <div
        className={cn(
          "flex min-h-[50px] items-center gap-2 rounded-md border bg-surface px-4 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
          error ? "border-overdue" : "border-border"
        )}
      >
        {leading && <span className="shrink-0 text-text-secondary">{leading}</span>}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined}
          className="min-w-0 flex-1 bg-transparent text-body text-text outline-none placeholder:text-text-secondary"
          {...props}
        />
        {trailing && <span className="shrink-0 text-text-secondary">{trailing}</span>}
      </div>
      {error ? (
        <p id={`${inputId}-err`} className="text-small font-semibold text-overdue-text">{error}</p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-small text-text-secondary">{hint}</p>
      ) : null}
    </div>
  );
});
Input.displayName = "Input";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement>, FieldProps {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, hint, error, className, id, ...props }, ref) => {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && <label htmlFor={inputId} className="text-small font-semibold text-text-secondary">{label}</label>}
      <textarea
        ref={ref}
        id={inputId}
        rows={3}
        className={cn(
          "w-full rounded-md border bg-surface px-4 py-3 text-subtitle text-text outline-none transition-colors placeholder:text-text-secondary focus:border-primary focus:ring-2 focus:ring-primary/20",
          error ? "border-overdue" : "border-border"
        )}
        {...props}
      />
      {error ? <p className="text-small font-semibold text-overdue-text">{error}</p> : hint ? <p className="text-small text-text-secondary">{hint}</p> : null}
    </div>
  );
});
Textarea.displayName = "Textarea";

export interface SelectProps extends Omit<FieldProps, "trailing" | "leading"> {
  options: { value: string; label: string }[];
  placeholder?: string;
  value: string;
  onChange: (e: { target: { value: string } }) => void;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  className?: string;
  "aria-label"?: string;
}

/** Lista de opciones del design system (Popover), con la misma firma de onChange que un select */
export function Select({ label, hint, error, options, placeholder, className, id, value, onChange, disabled, required, ...aria }: SelectProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && <label htmlFor={inputId} className="text-small font-semibold text-text-secondary">{label}</label>}
      <OptionSelect
        id={inputId}
        value={value}
        onChange={(v) => onChange({ target: { value: v } })}
        options={options}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        invalid={!!error}
        aria-label={aria["aria-label"] ?? label}
      />
      {error ? <p className="text-small font-semibold text-overdue-text">{error}</p> : hint ? <p className="text-small text-text-secondary">{hint}</p> : null}
    </div>
  );
}

/** `hideLabel`: solo el interruptor (la etiqueta queda para lectores de pantalla) */
export function Toggle({ checked, onChange, label, id, description, hideLabel }: { checked: boolean; onChange: (v: boolean) => void; label: string; id?: string; description?: string; hideLabel?: boolean }) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <label htmlFor={inputId} className={hideLabel ? "flex min-h-11 shrink-0 cursor-pointer items-center" : "flex min-h-12 cursor-pointer items-center justify-between gap-3"}>
      <span className={hideLabel ? "sr-only" : undefined}>
        <span className="block text-body text-text">{label}</span>
        {description && <span className="block text-small text-text-secondary">{description}</span>}
      </span>
      <span className="relative inline-flex shrink-0">
        <input id={inputId} type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="h-[31px] w-[51px] rounded-full bg-border transition-colors duration-[var(--duration-fast)] peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40" />
        <span className="absolute left-[2px] top-[2px] h-[27px] w-[27px] rounded-full bg-text-secondary shadow-1 transition-[transform,background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] peer-checked:translate-x-5 peer-checked:bg-on-primary" />
      </span>
    </label>
  );
}
