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
    <div ref={ref} className={cn("relative flex flex-col gap-1.5", className)}>
      {label && <span className="text-[13px] font-semibold text-on-variant">{label}</span>}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex min-h-[50px] w-full items-center justify-between rounded-control border border-outline-variant bg-surface px-4 text-[16px] transition-colors focus-visible:border-primary",
          value ? "text-on" : "text-outline"
        )}
      >
        <span>{value || placeholder}</span>
        <ChevronDown size={18} className={cn("text-on-variant transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>

      {open && (
        <div role="listbox" className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-card border border-outline-variant bg-surface shadow-3">
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
                  className={cn("flex min-h-[44px] w-full items-center justify-between px-4 text-[15px] transition-colors hover:bg-surface-2", active ? "font-bold text-primary" : "text-on")}
                >
                  {opt}
                  {active && <Check size={16} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
          {onAddOption && (
            <div className="border-t border-outline-variant p-2">
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  placeholder="Agregar nuevo…"
                  aria-label="Nueva opción"
                  className="min-h-[40px] flex-1 rounded-control border border-outline-variant bg-surface-2 px-3 text-[14px] text-on outline-none placeholder:text-outline focus:border-primary"
                />
                <button type="button" onClick={handleAdd} aria-label="Agregar" className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-control bg-primary text-on-primary">
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
