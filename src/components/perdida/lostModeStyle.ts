import type React from "react";

/**
 * Modo mascota perdida (docs/design-system.md): el primario pasa a
 * --color-danger en todo el subárbol. Los componentes del kit (Button,
 * Chip, foco…) leen var(--color-primary), así que cambian de tono solos.
 * Sin "use client" para poder usarlo también en componentes de servidor.
 */
export const LOST_MODE_STYLE = {
  "--color-primary": "var(--color-danger)",
  "--color-on-primary": "var(--color-on-danger)",
  "--color-primary-soft": "var(--color-danger-soft)",
  "--color-primary-text": "var(--color-danger-text)",
} as React.CSSProperties;
