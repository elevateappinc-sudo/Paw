"use client";
import { forwardRef } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchFieldProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  onSubmit?: () => void;
}

/** Campo de búsqueda de Explorar, 48 px, en la cabecera de la pantalla. */
export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField({ value, onChange, placeholder, className, onSubmit }, ref) {
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      className={cn("flex h-12 items-center gap-2 rounded-full border border-border bg-surface pl-4", value ? "pr-1" : "pr-4", className)}
    >
      <Search size={18} className="shrink-0 text-text-secondary" aria-hidden="true" />
      <input
        ref={ref}
        type="search"
        inputMode="search"
        enterKeyHint="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Veterinaria, groomer, alimento…"}
        aria-label="Buscar servicios"
        className="min-h-11 min-w-0 flex-1 bg-transparent text-body text-text outline-none placeholder:text-text-secondary [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button type="button" onClick={() => onChange("")} aria-label="Borrar búsqueda" className="pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text-secondary">
          <X size={18} aria-hidden="true" />
        </button>
      )}
    </form>
  );
});
