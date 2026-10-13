"use client";
import { motion, useReducedMotion } from "motion/react";
import { page, reducedPage } from "@/lib/motion";

/** Transición de página: fade + 12 px de desplazamiento en 200 ms. */
export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div variants={reduce ? reducedPage : page} initial="initial" animate="animate" className="min-h-dvh">
      {children}
    </motion.div>
  );
}
