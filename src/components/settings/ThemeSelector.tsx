"use client";
import { useEffect, useState } from "react";
import { Toggle } from "@/components/ui";
import { applyTheme, readThemePreference, saveThemePreference, type ThemePreference } from "./theme";

const DARK_QUERY = "(prefers-color-scheme: dark)";

/**
 * Tema de la app con dos interruptores:
 * - "Modo oscuro": activa oscuro o claro (y deja de seguir al sistema).
 * - "Usar el tema del sistema": sigue la preferencia del teléfono; mientras
 *   está activo, "Modo oscuro" muestra lo que dicta el sistema.
 * Persiste en localStorage `paw.theme` (sin valor = sistema).
 */
export function ThemeSelector() {
  const [pref, setPref] = useState<ThemePreference>("system");
  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    setPref(readThemePreference());
    const mq = window.matchMedia(DARK_QUERY);
    setSystemDark(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  function change(next: ThemePreference) {
    setPref(next);
    applyTheme(next);
    saveThemePreference(next);
  }

  const dark = pref === "system" ? systemDark : pref === "dark";

  return (
    <div className="flex flex-col divide-y divide-border">
      <Toggle
        label="Modo oscuro"
        description={dark ? "Fondo oscuro, ideal de noche" : "Fondo claro"}
        checked={dark}
        onChange={(on) => change(on ? "dark" : "light")}
      />
      <Toggle
        label="Usar el tema del sistema"
        description="Cambia solo según la configuración de tu teléfono"
        checked={pref === "system"}
        onChange={(on) => change(on ? "system" : dark ? "dark" : "light")}
      />
    </div>
  );
}
