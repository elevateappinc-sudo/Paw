/**
 * Variantes de movimiento compartidas (motion / Framer Motion v14).
 * Duraciones: 150 micro · 250 estándar · 400 hojas y página.
 * Todas respetan prefers-reduced-motion vía useReducedMotion en los componentes.
 */
import type { Transition, Variants } from "motion/react";

export const EASE_STANDARD = [0.2, 0, 0, 1] as const;
export const EASE_EMPHASIZED = [0.3, 0, 0, 1] as const;

export const spring: Transition = { type: "spring", stiffness: 380, damping: 32, mass: 0.9 };
export const springSoft: Transition = { type: "spring", stiffness: 260, damping: 30 };

export const page: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: EASE_STANDARD } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15, ease: EASE_STANDARD } },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: EASE_STANDARD } },
};

export const stagger = (delay = 0.04): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: delay } },
});

export const sheet: Variants = {
  hidden: { y: "100%" },
  show: { y: 0, transition: spring },
  exit: { y: "100%", transition: { duration: 0.25, ease: EASE_STANDARD } },
};

export const backdrop: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const pop: Variants = {
  hidden: { scale: 0.6, opacity: 0 },
  show: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 420, damping: 22 } },
};

export const reducedPage: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.12 } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
};

export const tapScale = { scale: 0.97 };
