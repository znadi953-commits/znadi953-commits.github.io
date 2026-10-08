import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  ChevronLeft,
  ChevronRight,
  Heart,
  Loader2,
  Play,
  Search,
  Settings,
  ShieldCheck,
  User,
  Wallet,
} from 'lucide-react';
import { apiGet, fmtPrice, type Category, type Prompt, type Stats } from '../lib/api';
import PromptCard from '../components/PromptCard';
import LogoInteractive from '../components/LogoInteractive';

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [pool, setPool] = useState<Prompt[]>([]);
  const [fresh, setFresh] = useState<Prompt[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [heroIdx, setHeroIdx] = useState(0);
  const [activeCat, setActiveCat] = useState<number | 'all'>('all');
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    (async () => {
      const [cats, prom, rec, st] = await Promise.allSettled([
        apiGet.categories(),
        apiGet.prompts({ limit: '100' }),
        apiGet.prompts({ sort: 'recent', limit: '3' }),
        apiGet.stats(),
      ]);
      if (!alive) return;
      if (cats.status === 'fulfilled') setCategories(cats.value);
      if (prom.status === 'fulfilled') setPool(prom.value);
      if (rec.status === 'fulfilled') setFresh(rec.value);
      if (st.status === 'fulfilled') setStats(st.value);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const hero = pool.filter((p) => p.bestseller || p.featured).slice(0, 6);
  const heroList = hero.length ? hero : pool.slice(0, 6);
  const current = heroList[heroIdx % Math.max(heroList.length, 1)];
  const continueList = pool.filter((p) => p.trending).slice(0, 3);
  const row = (activeCat === 'all' ? pool : pool.filter((p) => p.category_id === activeCat)).slice(0, 4);

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    navigate(q.trim() ? `/catalogue?q=${encodeURIComponent(q.trim())}` : '/catalogue');
  };

  return (
    <>
      {/* ---------------- Dashboard glassmorphism ---------------- */}
      <section className="relative overflow-hidden pb-16 pt-10 sm:pt-14">
        {/* fond photographique flouté */}
        <img
          src="/images/hero-bg.jpg"
          alt=""
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-45 blur-2xl"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-noir-950/70 via-noir-950/55 to-noir-950" />

        {/* rail d'icônes vertical */}
        <div className="absolute left-5 top-1/2 z-10 hidden -translate-y-1/2 flex-col gap-2 rounded-full border border-white/15 bg-white/10 p-2.5 backdrop-blur-xl lg:flex">
          {[
            { icon: Search, to: '/catalogue', label: 'Rechercher' },
            { icon: Heart, to: '/catalogue?sort=popular', label: 'Populaires' },
            { icon: Wallet, to: '/affiliation', label: 'Affiliation' },
            { icon: User, to: '/#vendre', label: 'Vendre' },
            { icon: Settings, to: '/admin/sync', label: 'Admin' },
          ].map(({ icon: Icon, to, label }) => (
            <Link
              key={label}
              to={to}
              title={label}
              className="rounded-full p-2.5 text-white/80 transition hover:bg-white/15 hover:text-white"
            >
              <Icon className="h-[18px] w-[18px]" />
            </Link>
          ))}
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <LogoInteractive className="mx-auto mb-8 w-full max-w-md drop-shadow-[0_0_35px_rgba(160,44,232,0.4)] sm:max-w-lg" />

          {/* panneau de verre */}
          <div className="rounded-[2rem] border border-white/15 bg-white/[0.07] p-4 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] backdrop-blur-2xl sm:p-6">
            {/* barre du haut : recherche + onglets + profil */}
            <div className="flex flex-wrap items-center gap-3">
              <form onSubmit={submitSearch} className="relative min-w-[180px] flex-1 sm:max-w-xs">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Rechercher un prompt…"
                  className="w-full rounded-full border border-white/15 bg-white/10 py-2.5 pl-10 pr-4 text-sm outline-none placeholder:text-white/40 focus:border-burgundy-400/60"
                />
              </form>
              <div className="order-3 -mx-1 flex w-full gap-1 overflow-x-auto px-1 pb-1 sm:order-2 sm:w-auto sm:pb-0">
                <button
                  onClick={() => setActiveCat('all')}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                    activeCat === 'all' ? 'bg-white text-noir-950' : 'text-white/75 hover:bg-white/10'
                  }`}
                >
                  Tout
                </button>
                {categories.slice(0, 6).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveCat(c.id)}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                      activeCat === c.id ? 'bg-white text-noir-950' : 'text-white/75 hover:bg-white/10'
                    }`}
                  >
                    {c.name.split(' ')[0]}
                  </button>
                ))}
              </div>
              <div className="order-2 ml-auto flex items-center gap-2 sm:order-3">
                <button className="relative rounded-full border border-white/15 bg-white/10 p-2.5 transition hover:bg-white/20" title="Notifications">
                  <Bell className="h-4 w-4" />
                  <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-gold-400" />
                </button>
                <Link
                  to="/affiliation"
                  className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 py-1.5 pl-1.5 pr-4 text-sm transition hover:bg-white/20"
                >
                  <img src="/images/logo-nadipromtes-icon.png" alt="" className="h-7 w-7 rounded-full" />
                  Studio NADI
                </Link>
              </div>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[250px_1fr]">
              {/* colonne gauche */}
              <div className="hidden flex-col gap-5 md:flex">
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3.5 backdrop-blur-xl">
                  <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-white/60">
                    <span>Nouveautés</span>
                    <span className="text-gold-300">Aujourd'hui</span>
                  </div>
                  <div className="space-y-3">
                    {fresh.map((p) => (
                      <Link key={p.id} to={`/prompt/${p.id}`} className="group flex gap-3">
                        <img src={p.preview_image_url} alt="" className="h-14 w-20 rounded-lg object-cover" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-semibold">{p.title}</div>
                          <div className="mt-0.5 text-[11px] text-white/50">{p.categories?.name}</div>
                        </div>
                        <span className="self-center rounded-full border border-white/15 bg-white/10 p-1.5 transition group-hover:bg-burgundy-600">
                          <Play className="h-3 w-3" />
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3.5 backdrop-blur-xl">
                  <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/60">
                    Continuer l'exploration
                  </div>
                  <div className="space-y-3">
                    {continueList.map((p) => (
                      <Link key={p.id} to={`/prompt/${p.id}`} className="group flex items-center gap-3">
                        <img src={p.preview_image_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-semibold">{p.title}</div>
                          <div className="text-[11px] text-white/50">{p.ai_model}</div>
                        </div>
                        <span className="rounded-full border border-white/15 bg-white/10 p-1.5 transition group-hover:bg-burgundy-600">
                          <Play className="h-3 w-3" />
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* hero + rangée recommandations */}
              <div>
                {current && (
                  <div className="group relative h-[320px] overflow-hidden rounded-2xl border border-white/10 sm:h-[360px]">
                    <img src={current.preview_image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-noir-950 via-noir-950/35 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-burgundy-600/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider">
                          {current.categories?.name}
                        </span>
                        <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider backdrop-blur">
                          {current.ai_model}
                        </span>
                        {current.trending && (
                          <span className="rounded-full bg-gold-500/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-noir-950">
                            Tendance
                          </span>
                        )}
                      </div>
                      <h2 className="font-display mt-3 max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl">
                        {current.title}
                      </h2>
                      <p className="mt-2 max-w-xl text-sm text-noir-100/80 line-clamp-2">{current.description}</p>
                      <div className="mt-5 flex flex-wrap items-center gap-3">
                        <Link
                          to={`/prompt/${current.id}`}
                          className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-noir-950 transition hover:bg-noir-100"
                        >
                          <Play className="h-4 w-4" /> Voir la fiche
                        </Link>
                        <Link
                          to={`/prompt/${current.id}`}
                          className="inline-flex items-center gap-2 rounded-full bg-gold-500 px-6 py-3 text-sm font-semibold text-noir-950 transition hover:bg-gold-400"
                        >
                          <Wallet className="h-4 w-4" /> Acheter {fmtPrice(Number(current.price))}
                        </Link>
                        <div className="ml-auto flex gap-2">
                          <button
                            onClick={() => setHeroIdx((i) => (i - 1 + heroList.length) % heroList.length)}
                            className="rounded-full border border-white/20 bg-white/10 p-2.5 backdrop-blur transition hover:bg-white/25"
                            aria-label="Précédent"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setHeroIdx((i) => (i + 1) % heroList.length)}
                            className="rounded-full border border-white/20 bg-white/10 p-2.5 backdrop-blur transition hover:bg-white/25"
                            aria-label="Suivant"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mb-3 mt-6 flex items-end justify-between">
                  <h3 className="font-display text-lg font-semibold">Vous aimerez aussi</h3>
                  <Link to="/catalogue" className="inline-flex items-center gap-1.5 text-xs text-burgundy-300 hover:text-burgundy-200">
                    Voir tout <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {row.map((p) => (
                    <Link key={p.id} to={`/prompt/${p.id}`} className="group relative aspect-[3/4] overflow-hidden rounded-xl border border-white/10">
                      <img src={p.preview_image_url} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-noir-950/95 via-transparent to-transparent" />
                      <span className="absolute right-2.5 top-2.5 rounded-full bg-noir-950/70 px-2.5 py-1 text-[11px] font-semibold text-gold-300 backdrop-blur">
                        {fmtPrice(Number(p.price))}
                      </span>
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full border border-white/25 bg-noir-950/60 p-2.5 opacity-0 backdrop-blur transition group-hover:opacity-100">
                        <Play className="h-3.5 w-3.5" />
                      </span>
                      <div className="absolute inset-x-0 bottom-0 p-3">
                        <div className="truncate text-xs font-semibold">{p.title}</div>
                        <div className="text-[10px] text-white/55">{p.categories?.name}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* stats en chips de verre */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Prompts', value: stats ? String(stats.prompts) : '—' },
                { label: 'Vendeurs', value: stats ? String(stats.sellers) : '—' },
                { label: 'Ventes', value: stats ? String(stats.totalSales) : '—' },
                { label: 'Note moyenne', value: stats ? `${stats.avgRating}/5` : '—' },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-xl">
                  <div className="font-display text-xl font-semibold text-gold-300">{s.value}</div>
                  <div className="text-[11px] uppercase tracking-wider text-white/55">{s.label}</div>
                </div>
              ))}
            </div>
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
            {pool.slice(0, 6).map((p) => (
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
