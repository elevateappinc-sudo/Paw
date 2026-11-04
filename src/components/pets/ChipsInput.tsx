"use client";
import { useId, useState } from "react";
import { Plus, X } from "lucide-react";

/** Chips libres (alergias, condiciones): escribe y pulsa Enter o "+" */
export function ChipsInput({ label, value, onChange, placeholder, tone = "neutral" }: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  tone?: "neutral" | "warn";
}) {
  const id = useId();
  const [draft, setDraft] = useState("");

  function add() {
    const v = draft.trim();
    if (!v) return;
    if (!value.some((x) => x.toLowerCase() === v.toLowerCase())) onChange([...value, v]);
    setDraft("");
  }

  const chipClass = tone === "warn" ? "bg-warning-soft text-warning-text" : "bg-surface-elevated text-text";

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-small font-semibold text-text-secondary">{label}</label>
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {value.map((v) => (
            <li key={v} className={`inline-flex min-h-9 items-center gap-1 rounded-full pl-3 pr-1 text-label font-semibold ${chipClass}`}>
              {v}
              <button type="button" onClick={() => onChange(value.filter((x) => x !== v))} aria-label={`Quitar ${v}`} className="relative flex h-7 w-7 items-center justify-center rounded-full after:absolute after:-inset-2 after:content-[''] active:opacity-70">
                <X size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex min-h-12 items-center gap-2 rounded-md border border-border bg-surface pl-4 pr-1 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-body text-text outline-none placeholder:text-text-secondary"
        />
        <button type="button" onClick={add} aria-label="Añadir" className="pressable flex h-11 w-11 items-center justify-center rounded-full text-primary-text">
          <Plus size={20} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
