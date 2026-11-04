/**
 * Variantes de movimiento compartidas (motion / Framer Motion).
 * Duraciones y curvas espejo de src/styles/tokens.css:
 * fast 120 ms · base 200 ms · slow 320 ms · stagger 40 ms.
 * Solo se anima transform y opacity. Todas respetan prefers-reduced-motion
 * vía useReducedMotion en los componentes.
 */
import type { Transition, Variants } from "motion/react";

export const DURATION = { fast: 0.12, base: 0.2, slow: 0.32 } as const;
export const STAGGER_STEP = 0.04;

export const EASE_STANDARD = [0.2, 0, 0, 1] as const;
export const EASE_ENTER = [0, 0, 0, 1] as const;
export const EASE_EXIT = [0.3, 0, 1, 1] as const;
export const EASE_PLAYFUL = [0.34, 1.56, 0.64, 1] as const;
/** @deprecated usar EASE_ENTER */
export const EASE_EMPHASIZED = EASE_ENTER;

export const spring: Transition = { duration: DURATION.slow, ease: EASE_ENTER };
export const springSoft: Transition = { duration: DURATION.base, ease: EASE_STANDARD };

/** Cambio de pestaña / pantalla: fundido cruzado */
export const page: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: DURATION.base, ease: EASE_STANDARD } },
  exit: { opacity: 0, transition: { duration: DURATION.fast, ease: EASE_EXIT } },
};

/** Aparición de contenido: opacidad 0→1 + translateY(8px → 0) */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE_ENTER } },
};

/** Listas: escalonado --stagger-step (máximo 8 elementos escalonados) */
export const stagger = (delay = STAGGER_STEP): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: delay } },
});

/** Hoja inferior y modales: translateY(100% → 0) */
export const sheet: Variants = {
  hidden: { y: "100%" },
  show: { y: 0, transition: { duration: DURATION.slow, ease: EASE_ENTER } },
  exit: { y: "100%", transition: { duration: DURATION.base, ease: EASE_EXIT } },
};

export const backdrop: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: DURATION.base } },
  exit: { opacity: 0, transition: { duration: DURATION.fast } },
};

/** Celebraciones puntuales (check de tarea hecha) */
export const pop: Variants = {
  hidden: { scale: 0.6, opacity: 0 },
  show: { scale: 1, opacity: 1, transition: { duration: DURATION.slow, ease: EASE_PLAYFUL } },
};

export const reducedPage: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: DURATION.fast } },
  exit: { opacity: 0, transition: { duration: DURATION.fast } },
};

export const tapScale = { scale: 0.97 };
