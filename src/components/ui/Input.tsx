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
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={inputId} className="text-[13px] font-semibold text-on-variant">
          {label}
        </label>
      )}
      <div
        className={cn(
          "flex min-h-[50px] items-center gap-2 rounded-control border bg-surface px-4 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
          error ? "border-danger" : "border-outline-variant"
        )}
      >
        {leading && <span className="shrink-0 text-on-variant">{leading}</span>}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined}
          className="min-w-0 flex-1 bg-transparent text-[16px] text-on outline-none placeholder:text-outline"
          {...props}
        />
        {trailing && <span className="shrink-0 text-on-variant">{trailing}</span>}
      </div>
      {error ? (
        <p id={`${inputId}-err`} className="text-[12px] font-semibold text-danger">{error}</p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-[12px] text-on-variant">{hint}</p>
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
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && <label htmlFor={inputId} className="text-[13px] font-semibold text-on-variant">{label}</label>}
      <textarea
        ref={ref}
        id={inputId}
        rows={3}
        className={cn(
          "w-full rounded-control border bg-surface px-4 py-3 text-[16px] text-on outline-none transition-colors placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/20",
          error ? "border-danger" : "border-outline-variant"
        )}
        {...props}
      />
      {error ? <p className="text-[12px] font-semibold text-danger">{error}</p> : hint ? <p className="text-[12px] text-on-variant">{hint}</p> : null}
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
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && <label htmlFor={inputId} className="text-[13px] font-semibold text-on-variant">{label}</label>}
      <select
        ref={ref}
        id={inputId}
        className={cn(
          "min-h-[50px] w-full appearance-none rounded-control border bg-surface px-4 text-[16px] text-on outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
          error ? "border-danger" : "border-outline-variant"
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error ? <p className="text-[12px] font-semibold text-danger">{error}</p> : hint ? <p className="text-[12px] text-on-variant">{hint}</p> : null}
    </div>
  );
});
Select.displayName = "Select";

export function Toggle({ checked, onChange, label, id, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; id?: string; description?: string }) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <label htmlFor={inputId} className="flex min-h-[50px] cursor-pointer items-center justify-between gap-3">
      <span>
        <span className="block text-[16px] text-on">{label}</span>
        {description && <span className="block text-[13px] text-on-variant">{description}</span>}
      </span>
      <span className="relative inline-flex shrink-0">
        <input id={inputId} type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="h-[31px] w-[51px] rounded-full bg-surface-3 transition-colors peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40" />
        <span className="absolute left-[2px] top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-2 transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
