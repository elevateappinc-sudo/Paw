/**
 * Ícono de la app (misma huella que public/icon.svg) dibujado con tokens:
 * cuadro primario con la huella en --color-on-primary, opcionalmente con el
 * nombre "Paw" al lado.
 */
export function AppMark({ size = 32, wordmark = false }: { size?: number; wordmark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="flex shrink-0 items-center justify-center rounded-md bg-primary text-on-primary" style={{ width: size, height: size }} aria-hidden="true">
        <svg viewBox="0 0 512 512" width={size * 0.72} height={size * 0.72} fill="currentColor">
          <path d="M256 388c-54 0-98-32-98-72 0-31 26-49 44-67 14-14 23-36 54-36s40 22 54 36c18 18 44 36 44 67 0 40-44 72-98 72z" />
          <ellipse cx="166" cy="200" rx="28" ry="38" />
          <ellipse cx="346" cy="200" rx="28" ry="38" />
          <ellipse cx="214" cy="140" rx="28" ry="38" />
          <ellipse cx="298" cy="140" rx="28" ry="38" />
        </svg>
      </span>
      {wordmark && <span className="text-subtitle font-semibold text-text">Paw</span>}
    </span>
  );
}
