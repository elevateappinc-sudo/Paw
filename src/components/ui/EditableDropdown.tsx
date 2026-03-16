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
}

export function EditableDropdown({
  options,
  value,
  onChange,
  onAddOption,
  placeholder = "Seleccionar...",
  className,
}: EditableDropdownProps) {
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
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
        style={{
          background: "#242428",
          border: "1px solid rgba(255,255,255,0.08)",
          color: value ? "#ffffff" : "#8e8e98",
        }}
      >
        <span>{value || placeholder}</span>
        <ChevronDown
          size={15}
          style={{ color: "#8e8e98" }}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-1 rounded-xl z-50 overflow-hidden"
          style={{
            background: "#242428",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          <div className="max-h-44 overflow-y-auto py-1">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                className="w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors"
                style={{
                  color: value === opt ? "#0a84ff" : "#ffffff",
                  background: "transparent",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {opt}
                {value === opt && <Check size={14} style={{ color: "#0a84ff" }} />}
              </button>
            ))}
          </div>
          {onAddOption && (
            <div
              className="px-2 py-2"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  placeholder="Agregar nuevo..."
                  className="flex-1 px-2.5 py-2 text-xs rounded-lg focus:outline-none"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#ffffff",
                  }}
                />
                <button
                  type="button"
                  onClick={handleAdd}
                  className="px-2.5 py-2 rounded-lg transition-colors"
                  style={{ background: "#0a84ff", color: "#fff" }}
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
