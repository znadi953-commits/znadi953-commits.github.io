import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, Search, SlidersHorizontal } from 'lucide-react';
import { apiGet, type Category, type Prompt } from '../lib/api';
import PromptCard from '../components/PromptCard';

type SortKey = 'popular' | 'recent' | 'rating' | 'price_asc' | 'price_desc';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'popular', label: 'Populaires' },
  { key: 'recent', label: 'Nouveautés' },
  { key: 'rating', label: 'Mieux notés' },
  { key: 'price_asc', label: 'Prix croissant' },
  { key: 'price_desc', label: 'Prix décroissant' },
];

export default function Catalogue() {
  const [params, setParams] = useSearchParams();
  const [all, setAll] = useState<Prompt[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const q = params.get('q') ?? '';
  const category = params.get('category') ?? '';
  const model = params.get('model') ?? '';
  const sort = (params.get('sort') as SortKey) || 'popular';

  useEffect(() => {
    let alive = true;
    (async () => {
      const [prom, cats] = await Promise.allSettled([apiGet.prompts({ limit: '100' }), apiGet.categories()]);
      if (!alive) return;
      if (prom.status === 'fulfilled') setAll(prom.value);
      if (cats.status === 'fulfilled') setCategories(cats.value);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const models = useMemo(
    () => Array.from(new Set(all.map((p) => p.ai_model))).sort(),
    [all],
  );

  const list = useMemo(() => {
    let out = [...all];
    if (category) out = out.filter((p) => String(p.category_id) === category);
    if (model) out = out.filter((p) => p.ai_model === model);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      out = out.filter(
        (p) =>
          p.title.toLowerCase().includes(s) ||
          p.description.toLowerCase().includes(s) ||
          (p.tags || []).some((t) => t.toLowerCase().includes(s)),
      );
    }
    switch (sort) {
      case 'recent':
        out.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
        break;
      case 'rating':
        out.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case 'price_asc':
        out.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case 'price_desc':
        out.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      default:
        out.sort((a, b) => (b.sales_count ?? 0) - (a.sales_count ?? 0));
    }
    return out;
  }, [all, category, model, q, sort]);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <div className="mb-10">
        <h1 className="font-display text-4xl font-semibold sm:text-5xl">Catalogue</h1>
        <p className="mt-3 max-w-2xl text-noir-100/60">
          {all.length} prompts premium, testés sur des centaines de générations et notés par la communauté.
        </p>
      </div>

      {/* ---------- Filtres ---------- */}
      <div className="mb-10 space-y-4 rounded-2xl border border-white/5 bg-noir-900/50 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-noir-100/40" />
            <input
              value={q}
              onChange={(e) => setParam('q', e.target.value)}
              placeholder="Rechercher un prompt, un style, un tag…"
              className="w-full rounded-full border border-white/10 bg-noir-950/70 py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-noir-100/30 focus:border-burgundy-500"
            />
          </div>
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="h-4 w-4 text-noir-100/40" />
            <select
              value={model}
              onChange={(e) => setParam('model', e.target.value)}
              className="rounded-full border border-white/10 bg-noir-950/70 px-4 py-3 text-sm outline-none focus:border-burgundy-500"
            >
              <option value="">Tous les modèles</option>
              {models.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => setParam('sort', e.target.value)}
              className="rounded-full border border-white/10 bg-noir-950/70 px-4 py-3 text-sm outline-none focus:border-burgundy-500"
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setParam('category', '')}
            className={`rounded-full px-4 py-2 text-sm transition ${
              !category ? 'bg-burgundy-600 font-semibold' : 'border border-white/10 bg-white/5 text-noir-100/70 hover:bg-white/10'
            }`}
          >
            Toutes
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setParam('category', String(c.id))}
              className={`rounded-full px-4 py-2 text-sm transition ${
                category === String(c.id)
                  ? 'bg-burgundy-600 font-semibold'
                  : 'border border-white/10 bg-white/5 text-noir-100/70 hover:bg-white/10'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* ---------- Grille ---------- */}
      {loading ? (
        <div className="flex justify-center py-24 text-noir-100/50">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : list.length === 0 ? (
        <p className="rounded-2xl border border-white/5 bg-white/[0.03] p-12 text-center text-noir-100/60">
          Aucun prompt ne correspond à votre recherche.
        </p>
      ) : (
        <>
          <p className="mb-4 text-sm text-noir-100/50">{list.length} résultat(s)</p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {list.map((p) => (
              <PromptCard key={p.id} prompt={p} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
