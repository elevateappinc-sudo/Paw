"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button, Chip, ChipRow, Input } from "@/components/ui";

/**
 * Selector de opción con chips y alta rápida de nuevas opciones.
 * Sustituye al desplegable editable del formulario antiguo.
 */
export function OptionChips({
  label,
  options,
  value,
  onChange,
  onAddOption,
  addPlaceholder = "Nueva opción",
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  onAddOption?: (v: string) => void;
  addPlaceholder?: string;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  function commit() {
    const t = draft.trim();
    if (!t) return;
    onAddOption?.(t);
    onChange(t);
    setDraft("");
    setAdding(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-small font-semibold text-text-secondary">{label}</span>
      <ChipRow>
        {options.map((opt) => (
          <Chip key={opt} selected={value === opt} onClick={() => onChange(opt)}>
            {opt}
          </Chip>
        ))}
        {onAddOption && (
          <Chip onClick={() => setAdding((a) => !a)} leading={<Plus size={14} />} selected={adding && !value}>
            Nueva
          </Chip>
        )}
      </ChipRow>
      {adding && (
        <div className="flex items-end gap-2">
          <Input
            aria-label={addPlaceholder}
            placeholder={addPlaceholder}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commit();
              }
            }}
            className="flex-1"
          />
          <Button type="button" variant="secondary" onClick={commit} disabled={!draft.trim()}>
            Agregar
          </Button>
        </div>
      )}
    </div>
  );
}
