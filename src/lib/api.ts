/* Couche données NADIPROMTES — Supabase REST direct (compatible hébergement
   statique type GitHub Pages : aucune fonction serveur requise). */

export type Category = {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  image_url?: string;
};

export type Seller = {
  id: number;
  name: string;
  handle: string;
  avatar_url?: string | null;
  verified?: boolean;
  rating?: number;
  bio?: string;
  total_sales?: number;
};

export type Prompt = {
  id: number;
  title: string;
  description: string;
  long_description?: string;
  price: number;
  ai_model: string;
  category_id: number;
  seller_id: number;
  preview_image_url: string;
  gallery_images?: string[];
  prompt_preview?: string;
  full_prompt_text?: string;
  tags?: string[];
  rating?: number;
  reviews_count?: number;
  sales_count?: number;
  trending?: boolean;
  bestseller?: boolean;
  featured?: boolean;
  created_at?: string;
  sellers?: Seller;
  categories?: Category;
};

export type Review = {
  id: number;
  prompt_id: number;
  author_name: string;
  rating: number;
  comment: string;
  created_at?: string;
};

export type Stats = {
  prompts: number;
  sellers: number;
  reviews: number;
  totalSales: number;
  revenue: number;
  avgRating: number;
};

const SUP_URL =
  (import.meta.env?.VITE_SUPABASE_URL as string | undefined) ??
  'https://eotalzibshezoxjdxigb.supabase.co';
const SUP_ANON =
  (import.meta.env?.VITE_SUPABASE_ANON_KEY as string | undefined) ??
  'sb_publishable_xJFaugNE14SKOdOG27aPCA_x67k7Tpm';

const HEADERS = {
  apikey: SUP_ANON,
  Authorization: `Bearer ${SUP_ANON}`,
};

const PROMPT_SELECT = '*,sellers(id,name,handle,avatar_url,verified,rating),categories(id,name,slug)';

const SORT_MAP: Record<string, [string, boolean]> = {
  popular: ['sales_count', false],
  recent: ['created_at', false],
  price_asc: ['price', true],
  price_desc: ['price', false],
  rating: ['rating', false],
};

async function rest<T>(table: string, qs = ''): Promise<T> {
  const res = await fetch(`${SUP_URL}/rest/v1/${table}${qs ? `?${qs}` : ''}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`Supabase ${res.status}`);
  return (await res.json()) as T;
}

async function restWrite<T>(table: string, qs: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(`${SUP_URL}/rest/v1/${table}${qs ? `?${qs}` : ''}`, {
    method,
    headers: { ...HEADERS, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}`);
  return (await res.json()) as T;
}

export const apiGet = {
  categories: () => rest<Category[]>('categories', 'select=*&order=id.asc'),
  sellers: () => rest<Seller[]>('sellers', 'select=*&order=rating.desc'),

  prompts: (params?: Record<string, string>) => {
    const p = params || {};
    const q = new URLSearchParams();
    q.set('select', PROMPT_SELECT);
    if (p.id) q.set('id', `eq.${p.id}`);
    if (p.category_id) q.set('category_id', `eq.${p.category_id}`);
    if (p.seller_id) q.set('seller_id', `eq.${p.seller_id}`);
    if (p.model && p.model !== 'all') q.set('ai_model', `eq.${p.model}`);
    if (p.min_price) q.set('price', `gte.${p.min_price}`);
    if (p.max_price) q.set('price', `lte.${p.max_price}`);
    if (p.trending === 'true') q.set('trending', 'eq.true');
    if (p.bestseller === 'true') q.set('bestseller', 'eq.true');
    if (p.featured === 'true') q.set('featured', 'eq.true');
    if (p.q) {
      const safe = String(p.q).replace(/[%(),]/g, '').trim();
      if (safe) q.set('or', `(title.ilike.*${safe}*,description.ilike.*${safe}*)`);
    }
    const [col, asc] = SORT_MAP[p.sort || ''] || ['sales_count', false];
    q.set('order', `${col}.${asc ? 'asc' : 'desc'}`);
    if (p.limit) q.set('limit', p.limit);
    return rest<Prompt[]>('prompts', q.toString());
  },

  prompt: async (id: string | number) => {
    const list = await rest<Prompt[]>('prompts', `select=${PROMPT_SELECT}&id=eq.${id}&limit=1`);
    return list[0] ?? null;
  },

  reviews: (promptId: string | number) =>
    rest<Review[]>(
      'reviews',
      `select=*,prompts(id,title,preview_image_url)&prompt_id=eq.${promptId}&order=created_at.desc`,
    ),

  stats: async (): Promise<Stats> => {
    const [prompts, sellers, reviews, orders, rated] = await Promise.all([
      rest<{ id: number }[]>('prompts', 'select=id'),
      rest<{ id: number }[]>('sellers', 'select=id'),
      rest<{ id: number }[]>('reviews', 'select=id'),
      rest<{ amount: number }[]>('orders', 'select=amount'),
      rest<{ rating: number }[]>('prompts', 'select=rating'),
    ]);
    const revenue = orders.reduce((s, o) => s + Number(o.amount || 0), 0);
    const avgRating = rated.length
      ? Math.round((rated.reduce((s, x) => s + Number(x.rating || 0), 0) / rated.length) * 10) / 10
      : 0;
    return {
      prompts: prompts.length,
      sellers: sellers.length,
      reviews: reviews.length,
      totalSales: orders.length,
      revenue: Math.round(revenue * 100) / 100,
      avgRating,
    };
  },
};

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  if (path === 'orders') {
    const { items, buyer_name, buyer_email } = (body || {}) as {
      items?: number[];
      buyer_name?: string;
      buyer_email?: string;
    };
    if (!Array.isArray(items) || items.length === 0) throw new Error('Panier vide.');
    if (!buyer_name || !buyer_email) throw new Error('Nom et e-mail requis.');
    const created: unknown[] = [];
    for (const promptId of items) {
      const rows = await rest<{ id: number; price: number; seller_id: number; sales_count: number | null }[]>(
        'prompts',
        `select=id,price,seller_id,sales_count&id=eq.${Number(promptId)}&limit=1`,
      );
      const prompt = rows[0];
      if (!prompt) continue;
      const amount = Number(prompt.price);
      const commission = Math.round(amount * 0.15 * 100) / 100;
      const seller_payout = Math.round((amount - commission) * 100) / 100;
      const order = await restWrite<unknown[]>(
        'orders',
        '',
        'POST',
        {
          prompt_id: prompt.id,
          seller_id: prompt.seller_id,
          buyer_name,
          buyer_email,
          amount,
          commission,
          seller_payout,
          status: 'completed',
        },
      );
      created.push(...order);
      await restWrite('prompts', `id=eq.${prompt.id}`, 'PATCH', {
        sales_count: (prompt.sales_count || 0) + 1,
      });
    }
    if (created.length === 0) throw new Error('Aucune commande creee.');
    return created as T;
  }
  throw new Error(`API inconnue en mode statique : ${path}`);
}

export const fmtPrice = (n: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 2,
  }).format(n);
