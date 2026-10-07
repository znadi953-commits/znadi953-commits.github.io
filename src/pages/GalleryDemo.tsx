import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiGet, fmtPrice, type Prompt } from '../lib/api';
import './GalleryDemo.css';

/** Vidéos de démonstration par prompt (comme sur la fiche produit). */
const VIDEO_PREVIEWS: Record<number, string> = {
  75: '/videos/temps-fige.mp4',
};

type SetKey = 'catalogue' | 'tendances' | 'video';

const LABELS: Record<SetKey, string> = {
  catalogue: 'Catalogue NADIPROMTES',
  tendances: 'Sélection tendances',
  video: 'Prompts vidéo IA',
};

const HeartIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 21s-7-4.6-9.5-9.1C.8 8.6 2.4 5 6 5c2 0 3.3 1.1 4 2.2C10.7 6.1 12 5 14 5c3.6 0 5.2 3.6 3.5 6.9C19 16.4 12 21 12 21z" />
  </svg>
);

const likesOf = (p: Prompt) => 340 + p.id * 57 + (p.sales_count ?? 0) * 85;

export default function GalleryDemo() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [setKey, setSetKey] = useState<SetKey>('catalogue');
  const [center, setCenter] = useState(0);
  const [clip, setClip] = useState<Prompt | null>(null);
  const [progress, setProgress] = useState(0);
  const timer = useRef<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    apiGet
      .prompts()
      .then(setPrompts)
      .catch(() => setPrompts([]));
  }, []);

  useEffect(() => setCenter(0), [setKey, prompts]);

  useEffect(() => () => {
    if (timer.current) window.clearInterval(timer.current);
  }, []);

  const sets = useMemo<Record<SetKey, Prompt[]>>(
    () => ({
      catalogue: [...prompts].sort((a, b) => b.id - a.id),
      tendances: prompts.filter((p) => p.trending),
      video: prompts.filter((p) => p.categories?.slug === 'video-ia' || VIDEO_PREVIEWS[p.id]),
    }),
    [prompts],
  );

  const shots = sets[setKey];
  const len = shots.length;
  const current = len ? shots[Math.min(center, len - 1)] : null;

  const positions = useMemo(() => {
    if (!len) return [] as { p: Prompt; i: number; pos: 'left' | 'center' | 'right' }[];
    if (len === 1) return [{ p: shots[0], i: 0, pos: 'center' as const }];
    if (len === 2) {
      const c = center % len;
      return [
        { p: shots[c], i: c, pos: 'center' as const },
        { p: shots[(c + 1) % len], i: (c + 1) % len, pos: 'right' as const },
      ];
    }
    return [
      { p: shots[(center - 1 + len) % len], i: (center - 1 + len) % len, pos: 'left' as const },
      { p: shots[center], i: center, pos: 'center' as const },
      { p: shots[(center + 1) % len], i: (center + 1) % len, pos: 'right' as const },
    ];
  }, [shots, center, len]);

  const stopTimer = () => {
    if (timer.current) {
      window.clearInterval(timer.current);
      timer.current = null;
    }
  };

  const openClip = (p: Prompt) => {
    setClip(p);
    setProgress(0);
    stopTimer();
    if (!VIDEO_PREVIEWS[p.id]) {
      timer.current = window.setInterval(() => {
        setProgress((v) => {
          if (v >= 100) stopTimer();
          return Math.min(v + 1.2, 100);
        });
      }, 60);
    }
  };

  const closeClip = () => {
    setClip(null);
    stopTimer();
  };

  const onCardClick = (i: number) => {
    if (i === center && current) {
      if (VIDEO_PREVIEWS[current.id]) openClip(current);
      else navigate(`/prompt/${current.id}`);
    } else {
      setCenter(i);
    }
  };

  const tabs: { key: SetKey; label: string; icon: React.ReactNode }[] = [
    {
      key: 'catalogue',
      label: 'Catalogue',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
        </svg>
      ),
    },
    {
      key: 'tendances',
      label: 'Tendances',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
          <path d="M12 21s-7-4.6-9.5-9.1C.8 8.6 2.4 5 6 5c2 0 3.3 1.1 4 2.2C10.7 6.1 12 5 14 5c3.6 0 5.2 3.6 3.5 6.9C19 16.4 12 21 12 21z" />
        </svg>
      ),
    },
    {
      key: 'video',
      label: 'Vidéo',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
          <rect x="2" y="5" width="20" height="14" rx="3" />
          <path d="M10 9.5v5l4.5-2.5z" fill="currentColor" stroke="none" />
        </svg>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-12 sm:px-6">
      {/* En-tête de page */}
      <div className="mb-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-burgundy-400">Démo interactive</p>
        <h1 className="font-display mt-3 text-3xl font-semibold sm:text-4xl">
          Mockup Galerie — Campagne Mode
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-noir-100/60">
          Le mockup du prompt N°71 rendu vivant avec les vrais projets du catalogue : faites défiler les
          cartes, lancez le clip du prompt vidéo « Temps Figé » et ouvrez les fiches produits.
        </p>
        <Link
          to="/prompt/71"
          className="mt-5 inline-block rounded-full border border-burgundy-500/40 px-5 py-2.5 text-sm font-semibold text-burgundy-300 transition hover:bg-burgundy-500/10"
        >
          Voir la fiche du prompt →
        </Link>
      </div>

      {/* Téléphone / mockup */}
      <div className="gdemo-phone">
        <div className="gd-topbar">
          <Link to="/prompt/71" className="gd-icon" aria-label="Retour à la fiche">←</Link>
          <div className="gd-title-block">
            <h1>GALERIE</h1>
            <p>{LABELS[setKey]}</p>
          </div>
          <Link to="/catalogue" className="gd-icon" aria-label="Catalogue">⋯</Link>
        </div>

        <div className="gd-stage">
          {positions.map(({ p, i, pos }) => (
            <div
              key={`${setKey}-${p.id}-${pos}`}
              className={`gd-card ${pos === 'center' ? 'gd-center' : `gd-side gd-${pos}`}`}
              style={{ backgroundImage: `url(${p.preview_image_url})` }}
              onClick={() => onCardClick(i)}
              role="button"
              aria-label={p.title}
            >
              <span className="gd-time">
                {p.ai_model}
                {VIDEO_PREVIEWS[p.id] ? ' · vidéo' : ''}
              </span>
              <span className="gd-likes">
                <HeartIcon /> {likesOf(p).toLocaleString('fr-FR')}
              </span>
              <div className="gd-cap">
                <b>{p.title}</b>
                <span>
                  {p.categories?.name ?? 'NADIPROMTES'} · {fmtPrice(Number(p.price))}
                </span>
              </div>
              {pos === 'center' && VIDEO_PREVIEWS[p.id] && (
                <div
                  className="gd-play"
                  onClick={(e) => {
                    e.stopPropagation();
                    openClip(p);
                  }}
                  role="button"
                  aria-label="Lancer le clip"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              )}
            </div>
          ))}
          {!len && <span className="gd-counter">Chargement du catalogue…</span>}
        </div>

        <div className="gd-counter">{len ? `${center + 1} / ${len}` : '—'}</div>

        <div className="gd-prompt-panel">
          <h2>Prompt Utilisé</h2>
          <p>
            {current
              ? (current.prompt_preview ?? current.description)
              : 'Chargement du catalogue…'}
          </p>
          {current && (
            <Link to={`/prompt/${current.id}`} className="gd-panel-link">
              Voir la fiche complète de « {current.title} » →
            </Link>
          )}
        </div>

        <div className="gd-tabbar">
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`gd-tab ${setKey === t.key ? 'active' : ''}`}
              onClick={() => setSetKey(t.key)}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overlay clip */}
      <div className={`gd-overlay ${clip ? 'show' : ''}`} onClick={closeClip}>
        {clip && (
          <div className="gd-overlay-inner" onClick={(e) => e.stopPropagation()}>
            {VIDEO_PREVIEWS[clip.id] ? (
              <video
                className="gd-clip-video"
                src={VIDEO_PREVIEWS[clip.id]}
                poster={clip.preview_image_url}
                controls
                autoPlay
                playsInline
                loop
              />
            ) : (
              <div className="gd-clip">
                <img src={clip.preview_image_url} alt={clip.title} />
                <div className="gd-clip-lbl">
                  {clip.title} — {clip.categories?.name ?? 'NADIPROMTES'}
                </div>
              </div>
            )}
            {!VIDEO_PREVIEWS[clip.id] && (
              <div className="gd-progress">
                <i style={{ width: `${progress}%` }} />
              </div>
            )}
            <div className="gd-overlay-btns">
              <button className="gd-close" onClick={closeClip}>
                Fermer
              </button>
              <Link className="gd-fiche" to={`/prompt/${clip.id}`}>
                Voir la fiche
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
