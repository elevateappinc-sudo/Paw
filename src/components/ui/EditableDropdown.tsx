"use client";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditableDropdownProps {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  onAddOption?: (v: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
}

export function EditableDropdown({ options, value, onChange, onAddOption, placeholder = "Seleccionar…", className, label }: EditableDropdownProps) {
  const [open, setOpen] = useState(false);
  const [newOption, setNewOption] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleAdd() {
    const trimmed = newOption.trim();
    if (!trimmed) return;
    onAddOption?.(trimmed);
    onChange(trimmed);
    setNewOption("");
    setOpen(false);
  }

  return (
    <div ref={ref} className={cn("relative flex flex-col gap-2", className)}>
      {label && <span className="text-small font-semibold text-text-secondary">{label}</span>}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex min-h-[50px] w-full items-center justify-between rounded-md border border-border bg-surface px-4 text-subtitle transition-colors focus-visible:border-primary",
          value ? "text-text" : "text-text-secondary"
        )}
      >
        <span>{value || placeholder}</span>
        <ChevronDown size={18} className={cn("text-text-secondary transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>

      {open && (
        <div role="listbox" className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border border-border bg-surface shadow-3">
          <div className="max-h-48 overflow-y-auto py-1">
            {options.map((opt) => {
              const active = value === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  className={cn("flex min-h-[44px] w-full items-center justify-between px-4 text-body transition-colors hover:bg-surface-elevated", active ? "font-semibold text-primary" : "text-text")}
                >
                  {opt}
                  {active && <Check size={16} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
          {onAddOption && (
            <div className="border-t border-border p-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  placeholder="Agregar nuevo…"
                  aria-label="Nueva opción"
                  className="min-h-11 flex-1 rounded-md border border-border bg-surface-elevated px-3 text-body text-text outline-none placeholder:text-text-secondary focus:border-primary"
                />
                <button type="button" onClick={handleAdd} aria-label="Agregar" className="flex min-h-11 min-w-11 items-center justify-center rounded-md bg-primary text-on-primary">
                  <Plus size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
