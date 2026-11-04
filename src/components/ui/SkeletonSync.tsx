"use client";
import { useEffect } from "react";

/**
 * Sincroniza el barrido de todos los .skeleton de la pantalla para que se
 * vea una sola ola (también en iOS, que ignora background-attachment: fixed).
 *
 * A cada bloque le da una animación (Web Animations API) del degradado en
 * coordenadas de la ventana, desplazada por su posición horizontal, y todas
 * arrancan en el mismo instante del reloj del documento (startTime = 0).
 * No toca atributos del DOM, así no interfiere con la hidratación de React.
 * Con movimiento reducido solo alinea el pulso de opacidad de globals.css.
 * Se monta una vez en AppShell.
 */
export function SkeletonSync() {
  useEffect(() => {
    const synced = new WeakMap<HTMLElement, { left: number; width: number; anim: Animation }>();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;

    const sync = () => {
      raf = 0;
      const vw = window.innerWidth;
      const duration = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--duration-shimmer")) || 1400;
      document.querySelectorAll<HTMLElement>(".skeleton").forEach((el) => {
        if (reduce.matches) {
          for (const anim of el.getAnimations()) if (anim.startTime !== 0) anim.startTime = 0;
          return;
        }
        const left = Math.round(el.getBoundingClientRect().left);
        const prev = synced.get(el);
        if (prev && prev.left === left && prev.width === vw) return;
        prev?.anim.cancel();
        const anim = el.animate(
          [{ backgroundPosition: `${vw - left}px 0` }, { backgroundPosition: `${-vw - left}px 0` }],
          { duration, easing: "ease-in-out", iterations: Infinity }
        );
        anim.startTime = 0;
        synced.set(el, { left, width: vw, anim });
      });
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(sync);
    };

    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", schedule);
    reduce.addEventListener("change", schedule);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      reduce.removeEventListener("change", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return null;
}
