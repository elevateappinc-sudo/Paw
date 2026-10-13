"use client";
import { useEffect } from "react";
import { applyTheme, readThemePreference } from "./theme";

/**
 * Lee la preferencia de tema guardada (localStorage `paw.theme`) y la aplica al montar.
 * Montar una vez en el layout raíz.
 */
export function ThemeInit() {
  useEffect(() => {
    applyTheme(readThemePreference());
  }, []);
  return null;
}
