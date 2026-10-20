"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Loaders temáticos (docs/design-system.md · Movimiento).
 * SVG inline + animaciones CSS de globals.css, solo transform y opacity.
 * Con prefers-reduced-motion cada uno queda como ícono estático con pulso.
 * Envolver la carga con useLoaderVisibility para respetar --loader-delay.
 */

interface LoaderProps {
  size?: number;
  /** Texto de estado para lectores de pantalla (y visible si showLabel) */
  label?: string;
  showLabel?: boolean;
  className?: string;
}

/** Huella: almohadilla grande + 4 dedos, en un cuadro de 24 × 24 */
function PawShape({ toes = true }: { toes?: boolean }) {
  return (
    <>
      <path d="M12 13.2c-2.9 0-6 3.1-6 5.6 0 1.6 1.2 2.4 2.7 2.4 1.3 0 2.2-.7 3.3-.7s2 .7 3.3.7c1.5 0 2.7-.8 2.7-2.4 0-2.5-3.1-5.6-6-5.6z" />
      {toes && (
        <>
          <ellipse cx="5" cy="10.4" rx="2" ry="2.5" />
          <ellipse cx="9.2" cy="6.4" rx="2.1" ry="2.7" />
          <ellipse cx="14.8" cy="6.4" rx="2.1" ry="2.7" />
          <ellipse cx="19" cy="10.4" rx="2" ry="2.5" />
        </>
      )}
    </>
  );
}

/**
 * Contenedor accesible de todos los loaders. Con movimiento reducido la
 * animación se reemplaza por su ícono estático (`still`) con un pulso
 * suave de opacidad y el texto de estado visible (salvo `inline`, dentro
 * de botones, donde no hay espacio y el botón ya lleva aria-busy).
 */
function Status({ label, showLabel, inline, still, className, children }: {
  label: string;
  showLabel?: boolean;
  inline?: boolean;
  still: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div role="status" aria-live="polite" className={cn("inline-flex flex-col items-center gap-2", className)}>
      <span className="contents motion-reduce:hidden">{children}</span>
      <span className="loader-still hidden motion-reduce:inline-flex" aria-hidden="true">{still}</span>
      <span className={cn("text-small", showLabel ? "text-text-secondary" : inline ? "sr-only" : "sr-only motion-reduce:not-sr-only motion-reduce:text-text-secondary")}>{label}</span>
    </div>
  );
}

/** Huella quieta: ícono estático de los loaders con movimiento reducido */
function StillPaw({ size, color = "var(--color-primary)" }: { size: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <PawShape />
    </svg>
  );
}

/** Huellitas caminando: loader general por defecto */
export function PawLoader({ size = 56, label = "Cargando", showLabel, className }: LoaderProps) {
  // 4 huellas en diagonal: izquierda, derecha, izquierda, derecha
  const steps = [
    { x: 2, y: 34, r: -20 },
    { x: 18, y: 24, r: 20 },
    { x: 20, y: 10, r: -20 },
    { x: 36, y: 0, r: 20 },
  ];
  return (
    <Status label={label} showLabel={showLabel} className={className} still={<StillPaw size={size * 0.6} />}>
      <svg width={size} height={size} viewBox="0 0 60 60" className="loader-paw text-primary" aria-hidden="true">
        {steps.map((s, i) => (
          <g key={i} transform={`translate(${s.x} ${s.y}) rotate(${s.r} 12 12)`}>
            <g className="loader-paw__step" style={{ animationDelay: `calc(var(--duration-loader) / 4 * ${i})` }} fill="currentColor">
              <PawShape />
            </g>
          </g>
        ))}
      </svg>
    </Status>
  );
}

/** Almohadillas que rebotan: dentro de botones y acciones en línea */
export function PawDotsLoader({ size = 18, label = "Guardando", showLabel, inline, className }: LoaderProps & { inline?: boolean }) {
  return (
    <Status label={label} showLabel={showLabel} inline={inline} className={className} still={<StillPaw size={size} color="currentColor" />}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="loader-dots" aria-hidden="true">
        <PawShape toes={false} />
        <ellipse className="loader-dots__toe" cx="6.4" cy="9.6" rx="2.2" ry="2.7" />
        <ellipse className="loader-dots__toe" cx="12" cy="6.4" rx="2.3" ry="2.8" style={{ animationDelay: "120ms" }} />
        <ellipse className="loader-dots__toe" cx="17.6" cy="9.6" rx="2.2" ry="2.7" style={{ animationDelay: "240ms" }} />
      </svg>
    </Status>
  );
}

function useSessionPet(): "dog" | "cat" {
  const [kind, setKind] = useState<"dog" | "cat">("dog");
  useEffect(() => {
    try {
      let k = sessionStorage.getItem("paw_loader_pet");
      if (k !== "dog" && k !== "cat") {
        k = Math.random() < 0.5 ? "dog" : "cat";
        sessionStorage.setItem("paw_loader_pet", k);
      }
      setKind(k as "dog" | "cat");
    } catch {
      /* sin almacenamiento: perro por defecto */
    }
  }, []);
  return kind;
}

/** Silueta en movimiento: cargas largas, primer arranque y sincronización */
export function PetSilhouetteLoader({ size = 96, label = "Preparando todo", showLabel, className }: LoaderProps) {
  const kind = useSessionPet();
  return (
    <Status label={label} showLabel={showLabel} className={className} still={<StillPaw size={size * 0.45} />}>
      <svg width={size} height={size * 0.75} viewBox="0 0 80 60" className="loader-silhouette" aria-hidden="true">
        <g className={kind === "dog" ? "loader-silhouette__trot" : "loader-silhouette__hop"} fill="var(--color-primary)">
          {kind === "dog" ? (
            <>
              <ellipse cx="38" cy="30" rx="17" ry="9" />
              <circle cx="58" cy="22" r="7.5" />
              <ellipse cx="64" cy="25" rx="5" ry="3.5" />
              <path d="M53 14.5l3-7 3.5 7.5z" />
              <path className="loader-silhouette__tail" d="M22 27c-5-1-8-6-8-10 3 3 6 5 10 5z" />
              <rect className="loader-silhouette__leg-a" x="25" y="34" width="4.5" height="14" rx="2.25" />
              <rect className="loader-silhouette__leg-b" x="31" y="34" width="4.5" height="14" rx="2.25" />
              <rect className="loader-silhouette__leg-a" x="44" y="34" width="4.5" height="14" rx="2.25" />
              <rect className="loader-silhouette__leg-b" x="50" y="34" width="4.5" height="14" rx="2.25" />
            </>
          ) : (
            <>
              <path d="M20 40c0-11 9-18 21-18s17 6 17 14v5H20z" />
              <circle cx="58" cy="25" r="8" />
              <path d="M51 20l1-9 6 6zM65 20l-1-9-6 6z" />
              <path className="loader-silhouette__tail" d="M22 36c-8-2-12-10-9-18 2 6 5 10 11 12z" />
              <rect x="24" y="38" width="5" height="10" rx="2.5" />
              <rect x="48" y="38" width="5" height="10" rx="2.5" />
            </>
          )}
        </g>
        <g className="loader-silhouette__ground" stroke="var(--color-border)" strokeWidth="2" strokeLinecap="round">
          {[0, 16, 32, 48, 64, 80, 96].map((x) => (
            <line key={x} x1={x} y1="53" x2={x + 8} y2="53" />
          ))}
        </g>
      </svg>
    </Status>
  );
}

/**
 * Manchas: bienvenida, pull-to-refresh a pantalla completa y fondos de
 * estados de espera. Con `decorative` es solo fondo (sin role="status"):
 * colocarlo con position absolute detrás del contenido.
 */
export function SpotsLoader({ size = 160, label = "Cargando", showLabel, decorative, className }: LoaderProps & { decorative?: boolean }) {
  const spots = [
    { top: "8%", left: "10%", w: "38%", tone: "var(--color-primary)", delay: 0 },
    { top: "42%", left: "52%", w: "34%", tone: "var(--color-accent)", delay: 400 },
    { top: "56%", left: "14%", w: "24%", tone: "var(--color-primary)", delay: 800 },
    { top: "12%", left: "60%", w: "20%", tone: "var(--color-accent)", delay: 1200 },
  ];
  const field = (
    <div className={cn("relative", decorative && className)} style={{ width: size, height: size }} aria-hidden="true">
      {spots.map((sp, i) => (
        <span
          key={i}
          className="loader-spot absolute aspect-square"
          style={{ top: sp.top, left: sp.left, width: sp.w, background: sp.tone, animationDelay: `${sp.delay}ms` }}
        />
      ))}
    </div>
  );
  if (decorative) return field;
  return (
    <Status label={label} showLabel={showLabel} className={className} still={<StillPaw size={size * 0.3} />}>
      {field}
    </Status>
  );
}

/**
 * Cola que se mueve: pull-to-refresh. `pull` va de 0 a 1 según cuánto se
 * estira; mientras más se estira, más rápido oscila la cola.
 */
export function TailRefresh({ size = 40, pull = 1, label = "Actualizando", showLabel, className }: LoaderProps & { pull?: number }) {
  const p = Math.max(0, Math.min(1, pull));
  return (
    <Status label={label} showLabel={showLabel} className={className} still={<StillPaw size={size * 0.7} />}>
      <svg width={size} height={size} viewBox="0 0 40 40" className="loader-tail" aria-hidden="true" style={{ opacity: 0.4 + p * 0.6 }}>
        <g fill="var(--color-primary)">
          <path d="M14 18c0-5 5-8 12-8h14v18H18c-3 0-4-2-4-4z" />
          <rect x="17" y="24" width="4.5" height="12" rx="2.25" />
          <rect x="31" y="24" width="4.5" height="12" rx="2.25" />
        </g>
        <path
          className="loader-tail__wag"
          d="M15 16c-4-1-7-5-7-10"
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="3.5"
          strokeLinecap="round"
          style={{ animationDuration: `calc(var(--duration-loader) / ${1 + p * 2})` }}
        />
      </svg>
    </Status>
  );
}

/** Radar con huella: exclusivo del modo mascota perdida */
export function LostPetRadar({ size = 120, label = "Buscando reportes cercanos", showLabel, className }: LoaderProps) {
  return (
    <Status label={label} showLabel={showLabel} className={className} still={<StillPaw size={size * 0.3} color="var(--color-danger)" />}>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }} aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="loader-radar__ring absolute inset-0 rounded-full border-2 border-danger"
            style={{ animationDelay: `calc(var(--duration-loader) / 3 * ${i})` }}
          />
        ))}
        <svg width={size * 0.3} height={size * 0.3} viewBox="0 0 24 24" fill="var(--color-danger)" className="relative">
          <PawShape />
        </svg>
      </div>
    </Status>
  );
}

/**
 * Muestra un loader solo si la espera supera --loader-delay (300 ms) y lo
 * mantiene al menos --loader-min-visible (500 ms) para evitar parpadeos.
 */
export function useLoaderVisibility(loading: boolean, delay = 300, minVisible = 500) {
  const [visible, setVisible] = useState(false);
  const [shownAt, setShownAt] = useState<number | null>(null);

  useEffect(() => {
    if (loading) {
      if (visible) return;
      const t = setTimeout(() => {
        setVisible(true);
        setShownAt(Date.now());
      }, delay);
      return () => clearTimeout(t);
    }
    if (!visible) return;
    const remaining = Math.max(0, minVisible - (Date.now() - (shownAt ?? 0)));
    const t = setTimeout(() => {
      setVisible(false);
      setShownAt(null);
    }, remaining);
    return () => clearTimeout(t);
  }, [loading, visible, shownAt, delay, minVisible]);

  return visible;
}
