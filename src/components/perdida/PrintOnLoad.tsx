"use client";
import { useEffect } from "react";

/** Abre el diálogo de impresión al cargar (volante de mascota perdida) */
export function PrintOnLoad() {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 600);
    return () => clearTimeout(t);
  }, []);
  return null;
}
