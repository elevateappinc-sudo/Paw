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

  const chipClass = tone === "warn" ? "bg-warn-container text-on-warn-container" : "bg-surface-2 text-on";

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-on-variant">{label}</label>
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {value.map((v) => (
            <li key={v} className={`inline-flex min-h-[36px] items-center gap-1 rounded-full pl-3 pr-1 text-[13px] font-bold ${chipClass}`}>
              {v}
              <button type="button" onClick={() => onChange(value.filter((x) => x !== v))} aria-label={`Quitar ${v}`} className="flex h-7 w-7 items-center justify-center rounded-full active:opacity-70">
                <X size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex min-h-[50px] items-center gap-2 rounded-control border border-outline-variant bg-surface pl-4 pr-1 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
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
          className="min-w-0 flex-1 bg-transparent text-[16px] text-on outline-none placeholder:text-outline"
        />
        <button type="button" onClick={add} aria-label="Añadir" className="flex h-11 w-11 items-center justify-center rounded-full text-primary active:scale-95">
          <Plus size={20} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
