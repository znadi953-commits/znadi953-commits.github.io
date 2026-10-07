import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Loader2, ShieldCheck, Sparkles, Wallet } from 'lucide-react';
import { apiGet, type Category, type Prompt, type Stats } from '../lib/api';
import PromptCard from '../components/PromptCard';
import LogoInteractive from '../components/LogoInteractive';

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Prompt[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [cats, prom, st] = await Promise.allSettled([
        apiGet.categories(),
        apiGet.prompts({ featured: 'true', limit: '6', sort: 'popular' }),
        apiGet.stats(),
      ]);
      if (!alive) return;
      if (cats.status === 'fulfilled') setCategories(cats.value);
      if (prom.status === 'fulfilled') setFeatured(prom.value);
      if (st.status === 'fulfilled') setStats(st.value);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
      {/* ---------------- Hero ---------------- */}
      <section className="relative overflow-hidden">
        <img src="/images/hero-bg.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-noir-950/60 via-noir-950/80 to-noir-950" />
        <div className="relative mx-auto max-w-7xl px-4 py-28 sm:px-6 sm:py-36">
          <LogoInteractive className="mb-10 w-full max-w-xl drop-shadow-[0_0_45px_rgba(160,44,232,0.45)] sm:max-w-2xl lg:max-w-3xl" />
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold-500/40 bg-gold-500/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-gold-300">
            <Sparkles className="h-3.5 w-3.5" /> Marketplace premium de prompts IA
          </p>
          <h1 className="font-display max-w-3xl text-4xl font-semibold leading-tight sm:text-6xl">
            Des prompts d'exception, <span className="text-burgundy-400">testés et notés</span>.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-noir-100/80">
            Achetez des prompts prêts à l'emploi pour Midjourney, GPT, DALL·E et plus encore —
            ou vendez vos créations et conservez 85&nbsp;% des revenus.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              to="/catalogue"
              className="inline-flex items-center gap-2 rounded-full bg-burgundy-600 px-7 py-3.5 font-semibold transition hover:bg-burgundy-500"
            >
              Explorer le catalogue <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#vendre"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3.5 font-semibold transition hover:bg-white/10"
            >
              Devenir vendeur
            </a>
          </div>

          <div className="mt-16 grid max-w-3xl grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { label: 'Prompts', value: stats ? String(stats.prompts) : '—' },
              { label: 'Vendeurs', value: stats ? String(stats.sellers) : '—' },
              { label: 'Ventes', value: stats ? String(stats.totalSales) : '—' },
              { label: 'Note moyenne', value: stats ? `${stats.avgRating}/5` : '—' },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                <div className="font-display text-2xl font-semibold text-gold-300">{s.value}</div>
                <div className="mt-1 text-xs uppercase tracking-wider text-noir-100/60">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Catégories ---------------- */}
      <section id="categories" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">Parcourir par catégorie</h2>
            <p className="mt-2 text-noir-100/60">Chaque catégorie est curée par notre studio.</p>
          </div>
          <Link to="/catalogue" className="hidden items-center gap-2 text-sm text-burgundy-300 transition hover:text-burgundy-200 sm:inline-flex">
            Tout le catalogue <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {loading ? (
          <div className="flex justify-center py-16 text-noir-100/50">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {categories.map((c) => (
              <Link
                key={c.id}
                to={`/catalogue?category=${c.id}`}
                className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/5"
              >
                <img
                  src={c.image_url}
                  alt={c.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-noir-950 via-noir-950/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-4">
                  <div className="font-display text-lg font-semibold">{c.name}</div>
                  <div className="text-xs text-noir-100/60">{c.description}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ---------------- Sélection ---------------- */}
      <section className="border-y border-white/5 bg-noir-900/40">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="mb-10 flex items-end justify-between">
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">Sélection de la rédaction</h2>
            <Link to="/catalogue" className="inline-flex items-center gap-2 text-sm text-burgundy-300 transition hover:text-burgundy-200">
              Voir tout <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <PromptCard key={p.id} prompt={p} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Bandeau vendeurs ---------------- */}
      <section id="vendre" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid items-center gap-10 overflow-hidden rounded-3xl border border-white/5 bg-noir-900/60 lg:grid-cols-2">
          <img src="/images/seller-hero.jpg" alt="Studio de création" className="h-full min-h-[320px] w-full object-cover" />
          <div className="p-8 sm:p-12">
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">
              Vendez vos prompts, <span className="text-burgundy-400">gardez 85&nbsp;%</span>
            </h2>
            <p className="mt-4 text-noir-100/70">
              Rejoignez le studio NADIPROMTES : publication en quelques minutes, paiement sécurisé
              et une audience premium qui cherche exactement ce que vous créez.
            </p>
            <ul className="mt-8 space-y-4 text-sm">
              {[
                { icon: Wallet, t: '85 % de revenus par vente, virement hebdomadaire' },
                { icon: ShieldCheck, t: 'Paiements sécurisés et protection acheteur' },
                { icon: BadgeCheck, t: 'Notation transparente et badge vérifié' },
              ].map(({ icon: Icon, t }) => (
                <li key={t} className="flex items-center gap-3">
                  <span className="rounded-full bg-burgundy-900/50 p-2 text-burgundy-300">
                    <Icon className="h-4 w-4" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
            <Link
              to="/catalogue"
              className="mt-10 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 font-semibold text-noir-950 transition hover:bg-noir-100"
            >
              Découvrir les bestsellers <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
