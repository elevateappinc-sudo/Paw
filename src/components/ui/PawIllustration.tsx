export function PawIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} role="img" aria-label="Huella" aria-hidden="true">
      <circle cx="60" cy="60" r="56" fill="var(--sc)" />
      <path
        d="M60 86c-12 0-22-7-22-16 0-7 6-11 10-15 3-3 5-8 12-8s9 5 12 8c4 4 10 8 10 15 0 9-10 16-22 16z"
        fill="var(--prc)"
        stroke="var(--pr)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <ellipse cx="40" cy="44" rx="6" ry="8" fill="var(--prc)" stroke="var(--pr)" strokeWidth="2.5" />
      <ellipse cx="80" cy="44" rx="6" ry="8" fill="var(--prc)" stroke="var(--pr)" strokeWidth="2.5" />
      <ellipse cx="51" cy="31" rx="6" ry="8" fill="var(--prc)" stroke="var(--pr)" strokeWidth="2.5" />
      <ellipse cx="69" cy="31" rx="6" ry="8" fill="var(--prc)" stroke="var(--pr)" strokeWidth="2.5" />
    </svg>
  );
}
