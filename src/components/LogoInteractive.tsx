import { useState } from 'react';

/**
 * Logo NADIPROMTES interactif : le PNG transparent est découpé en zones
 * cliquables (clip-path) — chaque lettre/bloc réagit au survol et au clic
 * avec une animation spring moderne.
 */
const CHUNKS = [
  { id: 'NADI', from: 0, to: 50 },
  { id: 'P', from: 50, to: 57 },
  { id: 'R', from: 57, to: 63.5 },
  { id: 'O', from: 63.5, to: 70 },
  { id: 'M', from: 70, to: 77.5 },
  { id: 'T', from: 77.5, to: 83 },
  { id: 'E', from: 83, to: 89 },
  { id: 'S', from: 89, to: 100 },
];

export default function LogoInteractive({ className = '' }: { className?: string }) {
  const [active, setActive] = useState<string | null>(null);

  return (
    <div className={`logo-interactive ${className}`} role="img" aria-label="NADIPROMTES">
      {CHUNKS.map((c) => (
        <button
          key={c.id}
          type="button"
          tabIndex={-1}
          aria-label={`Lettre ${c.id}`}
          className={`logo-chunk ${active === c.id ? 'logo-chunk-active' : ''}`}
          style={{ clipPath: `inset(-5% ${100 - c.to}% -5% ${c.from}%)` }}
          onClick={() => {
            setActive(null);
            requestAnimationFrame(() => setActive(c.id));
          }}
          onAnimationEnd={() => setActive((a) => (a === c.id ? null : a))}
        >
          <img src="/images/logo-nadipromtes.png" alt="" draggable={false} />
        </button>
      ))}
    </div>
  );
}
