"use client";
import { useEffect } from "react";

/**
 * Sincroniza la respiración de todos los .skeleton de la pantalla para que
 * pulsen a la vez: lleva cada animación CSS al mismo instante del reloj del
 * documento (startTime = 0). Sin esto, los bloques que montan en momentos
 * distintos quedan desfasados y la pantalla parpadea.
 * No toca atributos del DOM, así no interfiere con la hidratación de React.
 * Se monta una vez en AppShell.
 */
export function SkeletonSync() {
  useEffect(() => {
    let raf = 0;
    const sync = () => {
      raf = 0;
      document.querySelectorAll<HTMLElement>(".skeleton").forEach((el) => {
        for (const anim of el.getAnimations()) if (anim.startTime !== 0) anim.startTime = 0;
      });
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(sync);
    };

    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return null;
}
