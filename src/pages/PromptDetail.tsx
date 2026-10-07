import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  Clapperboard,
  Loader2,
  Lock,
  ShieldCheck,
  Star,
  Zap,
} from 'lucide-react';
import { apiGet, apiPost, fmtPrice, type Prompt, type Review } from '../lib/api';
import PromptCard from '../components/PromptCard';

/** Aperçus vidéo démontrant les prompts vidéo (générés avec la technique du prompt). */
const VIDEO_PREVIEWS: Record<number, string> = {
  75: '/videos/temps-fige.mp4',
};

/** Démos interactives par prompt. */
const DEMO_LINKS: Record<number, string> = {
  71: '/demo/galerie',
};

/** Code de parrainage affiliate actif (?ref= capturé, fenêtre 30 jours). */
const getReferral = (): string | null => {
  try {
    const r = JSON.parse(localStorage.getItem('nadi_ref') || 'null') as { code: string; ts: number } | null;
    if (r && Date.now() - r.ts < 30 * 86400000) return r.code;
  } catch {
    /* ignore */
  }
  return null;
};

export default function PromptDetail() {
  const { id } = useParams();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [related, setRelated] = useState<Prompt[]>([]);
  const [activeImg, setActiveImg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [checkout, setCheckout] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [orderState, setOrderState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  useEffect(() => {
    if (!id) return;
    let alive = true;
    setLoading(true);
    setCheckout(false);
    setOrderState('idle');
    setActiveImg(0);
    (async () => {
      const [p, r] = await Promise.allSettled([apiGet.prompt(id), apiGet.reviews(id)]);
      if (!alive) return;
      if (p.status === 'fulfilled' && p.value) {
        setPrompt(p.value);
        const rel = await apiGet
          .prompts({ category_id: String(p.value.category_id), limit: '5', sort: 'popular' })
          .catch(() => []);
        if (alive) setRelated(rel.filter((x) => x.id !== p.value!.id).slice(0, 4));
      }
      if (r.status === 'fulfilled') setReviews(r.value);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-40 text-noir-100/50">
        <Loader2 className="h-7 w-7 animate-spin" />
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-40 text-center">
        <h1 className="font-display text-3xl font-semibold">Prompt introuvable</h1>
        <Link to="/catalogue" className="mt-6 inline-flex items-center gap-2 text-burgundy-300 hover:text-burgundy-200">
          <ArrowLeft className="h-4 w-4" /> Retour au catalogue
        </Link>
      </div>
    );
  }

  const images = [prompt.preview_image_url, ...(prompt.gallery_images || [])];

  const submitOrder = async (e: FormEvent) => {
    e.preventDefault();
    setOrderState('sending');
    try {
      await apiPost('orders', { items: [prompt.id], buyer_name: name, buyer_email: email });
      setOrderState('done');
      /* Conversion affiliate : crédite la cagnotte du parrain (suivi local). */
      const ref = getReferral();
      if (ref) {
        try {
          const convs = JSON.parse(localStorage.getItem('nadi_aff_conv') || '[]') as unknown[];
          convs.push({
            title: prompt.title,
            amount: Number(prompt.price),
            commission: Math.round(Number(prompt.price) * 0.15 * 100) / 100,
            ref,
            date: new Date().toISOString(),
          });
          localStorage.setItem('nadi_aff_conv', JSON.stringify(convs));
        } catch {
          /* ignore */
        }
      }
    } catch {
      setOrderState('error');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <Link to="/catalogue" className="mb-8 inline-flex items-center gap-2 text-sm text-noir-100/60 transition hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Catalogue
      </Link>

      <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr]">
        {/* ------------ Média principal ------------ */}
        <div>
          {VIDEO_PREVIEWS[prompt.id] ? (
            <>
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-black">
                <video
                  src={VIDEO_PREVIEWS[prompt.id]}
                  poster={prompt.preview_image_url}
                  controls
                  playsInline
                  preload="metadata"
                  className="max-h-[72vh] w-full bg-black object-contain"
                />
                <div className="flex items-center justify-between border-t border-white/5 px-5 py-3 text-xs text-noir-100/60">
                  <span className="inline-flex items-center gap-1.5">
                    <Clapperboard className="h-3.5 w-3.5 text-burgundy-400" />
                    Aperçu vidéo — effet « Temps figé » démontré avec le prompt maître
                  </span>
                  <span>10 s · 9:16 · Seedance 2.0</span>
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                {images.map((img, i) => (
                  <div key={img + i} className="overflow-hidden rounded-xl border border-white/10 opacity-80">
                    <img src={img} alt="" className="h-20 w-24 object-cover" />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="overflow-hidden rounded-3xl border border-white/10">
                <img src={images[activeImg]} alt={prompt.title} className="aspect-[4/3] w-full object-cover" />
              </div>
              {images.length > 1 && (
                <div className="mt-4 flex gap-3">
                  {images.map((img, i) => (
                    <button
                      key={img + i}
                      onClick={() => setActiveImg(i)}
                      className={`overflow-hidden rounded-xl border transition ${
                        i === activeImg ? 'border-burgundy-500' : 'border-white/10 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="h-20 w-24 object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ------------ Aperçu du prompt ------------ */}
          {prompt.prompt_preview && (
            <div className="relative mt-10 rounded-2xl border border-white/10 bg-noir-900/60 p-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">Aperçu du prompt</h2>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-burgundy-900/40 px-3 py-1 text-xs text-burgundy-200">
                  <Lock className="h-3 w-3" /> Complet après achat
                </span>
              </div>
              <pre className="max-h-56 overflow-hidden whitespace-pre-wrap font-mono text-sm leading-relaxed text-noir-100/80">
                {prompt.prompt_preview}
              </pre>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 rounded-b-2xl bg-gradient-to-t from-noir-900 to-transparent" />
            </div>
          )}

          {/* ------------ Description longue ------------ */}
          {prompt.long_description && (
            <div className="mt-10">
              <h2 className="font-display mb-4 text-2xl font-semibold">Description</h2>
              <div className="space-y-4 whitespace-pre-line text-noir-100/75">{prompt.long_description}</div>
            </div>
          )}

          {/* ------------ Avis ------------ */}
          <div className="mt-12">
            <h2 className="font-display mb-6 text-2xl font-semibold">
              Avis vérifiés {reviews.length > 0 && <span className="text-noir-100/40">({reviews.length})</span>}
            </h2>
            {reviews.length === 0 ? (
              <p className="rounded-2xl border border-white/5 bg-white/[0.03] p-6 text-sm text-noir-100/60">
                Pas encore d'avis publié pour ce prompt.
              </p>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="rounded-2xl border border-white/5 bg-noir-900/50 p-5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{r.author_name}</span>
                      <span className="inline-flex items-center gap-1 text-sm text-amber-300">
                        <Star className="h-4 w-4 fill-current" /> {r.rating}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-noir-100/70">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ------------ Colonne achat ------------ */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-white/10 bg-noir-900/60 p-7">
            <div className="mb-2 text-xs uppercase tracking-wider text-burgundy-300">
              {prompt.categories?.name} · {prompt.ai_model}
            </div>
            <h1 className="font-display text-3xl font-semibold leading-tight">{prompt.title}</h1>
            <p className="mt-3 text-noir-100/70">{prompt.description}</p>

            <div className="mt-5 flex items-center gap-4 text-sm">
              <span className="inline-flex items-center gap-1.5 text-amber-300">
                <Star className="h-4 w-4 fill-current" /> {(prompt.rating ?? 0).toFixed(1)}
              </span>
              <span className="text-noir-100/50">{prompt.sales_count ?? 0} ventes</span>
              {prompt.sellers && (
                <span className="inline-flex items-center gap-1.5 text-noir-100/70">
                  {prompt.sellers.verified && <BadgeCheck className="h-4 w-4 text-burgundy-400" />}
                  {prompt.sellers.name}
                </span>
              )}
            </div>

            {prompt.tags && prompt.tags.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {prompt.tags.map((t) => (
                  <span key={t} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-noir-100/70">
                    {t}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-7 border-t border-white/10 pt-6">
              <div className="flex items-end justify-between">
                <span className="text-sm text-noir-100/50">Prix unique</span>
                <span className="font-display text-4xl font-semibold text-burgundy-300">{fmtPrice(Number(prompt.price))}</span>
              </div>
              <button
                onClick={() => setCheckout(true)}
                className="mt-5 w-full rounded-full bg-burgundy-600 py-4 font-semibold transition hover:bg-burgundy-500"
              >
                Acheter maintenant
              </button>
              {DEMO_LINKS[prompt.id] && (
                <Link
                  to={DEMO_LINKS[prompt.id]}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-burgundy-500/40 py-3.5 text-sm font-semibold text-burgundy-300 transition hover:bg-burgundy-500/10"
                >
                  <Clapperboard className="h-4 w-4" /> Voir la démo interactive
                </Link>
              )}
              <ul className="mt-5 space-y-2.5 text-xs text-noir-100/60">
                <li className="flex items-center gap-2"><Zap className="h-3.5 w-3.5 text-burgundy-400" /> Accès immédiat au prompt complet</li>
                <li className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-burgundy-400" /> Paiement sécurisé, satisfait ou remboursé 7 j</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-burgundy-400" /> Licence commerciale incluse</li>
              </ul>
            </div>
          </div>
        </aside>
      </div>

      {/* ------------ Similaires ------------ */}
      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display mb-8 text-3xl font-semibold">Dans la même catégorie</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <PromptCard key={p.id} prompt={p} />
            ))}
          </div>
        </section>
      )}

      {/* ------------ Modale checkout ------------ */}
      {checkout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-noir-950/80 p-4 backdrop-blur-sm" onClick={() => setCheckout(false)}>
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-noir-900 p-8" onClick={(e) => e.stopPropagation()}>
            {orderState === 'done' ? (
              <div className="text-center">
                <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-burgundy-600">
                  <Check className="h-7 w-7" />
                </span>
                <h3 className="font-display text-2xl font-semibold">Commande confirmée&nbsp;!</h3>
                <p className="mt-3 text-sm text-noir-100/70">
                  Le prompt complet vient d'être envoyé à <span className="text-white">{email}</span>.
                  Bonne création&nbsp;!
                </p>
                <button onClick={() => setCheckout(false)} className="mt-7 w-full rounded-full bg-white py-3 font-semibold text-noir-950 transition hover:bg-noir-100">
                  Fermer
                </button>
              </div>
            ) : (
              <form onSubmit={submitOrder}>
                <h3 className="font-display text-2xl font-semibold">Finaliser l'achat</h3>
                <p className="mt-2 text-sm text-noir-100/60">
                  {prompt.title} — <span className="text-burgundy-300">{fmtPrice(Number(prompt.price))}</span>
                </p>
                {getReferral() && (
                  <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-gold-500/40 bg-gold-500/10 px-3 py-1 text-xs text-gold-300">
                    🤝 Parrainage : code {getReferral()} — 15 % reversés à votre parrain
                  </p>
                )}
                <label className="mt-6 block text-sm">
                  <span className="mb-1.5 block text-noir-100/70">Nom complet</span>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-noir-950/70 px-4 py-3 text-sm outline-none focus:border-burgundy-500"
                    placeholder="Isabella Moore"
                  />
                </label>
                <label className="mt-4 block text-sm">
                  <span className="mb-1.5 block text-noir-100/70">E-mail</span>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-noir-950/70 px-4 py-3 text-sm outline-none focus:border-burgundy-500"
                    placeholder="vous@studio.com"
                  />
                </label>
                {orderState === 'error' && (
                  <p className="mt-3 text-sm text-red-400">Une erreur est survenue. Réessayez.</p>
                )}
                <button
                  type="submit"
                  disabled={orderState === 'sending'}
                  className="mt-6 w-full rounded-full bg-burgundy-600 py-3.5 font-semibold transition hover:bg-burgundy-500 disabled:opacity-60"
                >
                  {orderState === 'sending' ? 'Traitement…' : `Payer ${fmtPrice(Number(prompt.price))}`}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
