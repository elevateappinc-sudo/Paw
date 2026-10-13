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

/** Campo de búsqueda en vidrio, 48 px, flotante sobre la tab bar. */
export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField({ value, onChange, placeholder, className, onSubmit }, ref) {
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      className={cn("glass flex h-12 items-center gap-2 rounded-full border border-outline-variant px-4 shadow-2", className)}
    >
      <Search size={18} className="shrink-0 text-on-variant" aria-hidden="true" />
      <input
        ref={ref}
        type="search"
        inputMode="search"
        enterKeyHint="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Veterinaria, groomer, alimento…"}
        aria-label="Buscar servicios"
        className="min-w-0 flex-1 bg-transparent text-[16px] text-on outline-none placeholder:text-on-variant [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button type="button" onClick={() => onChange("")} aria-label="Borrar búsqueda" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-on-variant active:bg-surface-2">
          <X size={18} />
        </button>
      )}
    </form>
  );
});
