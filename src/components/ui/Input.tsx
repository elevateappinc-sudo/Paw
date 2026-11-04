"use client";
import React, { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  trailing?: React.ReactNode;
  leading?: React.ReactNode;
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement>, FieldProps {}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, hint, error, trailing, leading, className, id, ...props }, ref) => {
  const autoId = useId();
  const inputId = id ?? autoId;
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
        <p id={`${inputId}-err`} className="text-label font-semibold text-overdue-text">{error}</p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-label text-text-secondary">{hint}</p>
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
      {error ? <p className="text-label font-semibold text-overdue-text">{error}</p> : hint ? <p className="text-label text-text-secondary">{hint}</p> : null}
    </div>
  );
});
Textarea.displayName = "Textarea";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement>, FieldProps {
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ label, hint, error, options, placeholder, className, id, ...props }, ref) => {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && <label htmlFor={inputId} className="text-small font-semibold text-text-secondary">{label}</label>}
      <select
        ref={ref}
        id={inputId}
        className={cn(
          "min-h-[50px] w-full appearance-none rounded-md border bg-surface px-4 text-subtitle text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
          error ? "border-overdue" : "border-border"
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error ? <p className="text-label font-semibold text-overdue-text">{error}</p> : hint ? <p className="text-label text-text-secondary">{hint}</p> : null}
    </div>
  );
});
Select.displayName = "Select";

export function Toggle({ checked, onChange, label, id, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; id?: string; description?: string }) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <label htmlFor={inputId} className="flex min-h-12 cursor-pointer items-center justify-between gap-3">
      <span>
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
