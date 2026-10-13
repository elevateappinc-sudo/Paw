"use client";
import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { SegmentedControl } from "@/components/ui";
import { applyTheme, readThemePreference, saveThemePreference, type ThemePreference } from "./theme";

const OPTIONS: { value: ThemePreference; label: React.ReactNode }[] = [
  {
    value: "system",
    label: (
      <span className="inline-flex items-center gap-1.5">
        <Monitor size={14} aria-hidden="true" /> Sistema
      </span>
    ),
  },
  {
    value: "light",
    label: (
      <span className="inline-flex items-center gap-1.5">
        <Sun size={14} aria-hidden="true" /> Claro
      </span>
    ),
  },
  {
    value: "dark",
    label: (
      <span className="inline-flex items-center gap-1.5">
        <Moon size={14} aria-hidden="true" /> Oscuro
      </span>
    ),
  },
];

/** Selector de tema: Sistema / Claro / Oscuro. Persiste en localStorage `paw.theme`. */
export function ThemeSelector() {
  const [pref, setPref] = useState<ThemePreference>("system");

  useEffect(() => {
    setPref(readThemePreference());
  }, []);

  function change(next: ThemePreference) {
    setPref(next);
    applyTheme(next);
    saveThemePreference(next);
  }

  return <SegmentedControl<ThemePreference> ariaLabel="Tema de la app" options={OPTIONS} value={pref} onChange={change} />;
}
