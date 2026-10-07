import supabase from './db-client.js';

/**
 * CMS Sync — Notion → NADIPROMTES (Supabase).
 * POST /api/notion-sync  body: { token?, database_id? }
 *   token / database_id optionnels (sinon process.env.NOTION_TOKEN / NOTION_DATABASE_ID).
 * GET  /api/notion-sync  → { configured: boolean }
 *
 * Schéma Notion attendu (propriétés) :
 *   Titre (title) · Prix (number) · Catégorie (select) · Modèle IA (select) ·
 *   Vendeur (select) · Image (url) · Description (rich_text) ·
 *   Description longue (rich_text) · Aperçu prompt (rich_text) ·
 *   Prompt complet (rich_text) · Tags (multi_select) ·
 *   Trending (checkbox) · Bestseller (checkbox)
 * Upsert par titre : même titre → update, sinon insert.
 */
const NOTION_VERSION = '2022-06-28';

const rich = (prop) =>
  Array.isArray(prop?.rich_text) ? prop.rich_text.map((t) => t.plain_text).join('') : '';
const title = (prop) =>
  Array.isArray(prop?.title) ? prop.title.map((t) => t.plain_text).join('') : '';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'GET') {
    return res.status(200).json({
      configured: Boolean(process.env.NOTION_TOKEN && process.env.NOTION_DATABASE_ID),
    });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = req.body || {};
  const token = body.token || process.env.NOTION_TOKEN;
  const databaseId = body.database_id || process.env.NOTION_DATABASE_ID;
  if (!token || !databaseId) {
    return res.status(400).json({
      error:
        'Configuration manquante : renseignez NOTION_TOKEN et NOTION_DATABASE_ID (env ou corps de la requête). Voir /admin/sync pour le guide.',
    });
  }

  try {
    /* 1. Pages Notion */
    const notion = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ page_size: 100 }),
    });
    if (!notion.ok) {
      const t = await notion.text();
      return res.status(502).json({ error: `Notion API ${notion.status}: ${t.slice(0, 300)}` });
    }
    const { results } = await notion.json();

    /* 2. Références catégories / vendeurs */
    const [{ data: cats }, { data: sellers }, { data: existing }] = await Promise.all([
      supabase.from('categories').select('id,name'),
      supabase.from('sellers').select('id,name'),
      supabase.from('prompts').select('id,title'),
    ]);
    const catByName = new Map((cats || []).map((c) => [c.name.toLowerCase(), c.id]));
    const sellerByName = new Map((sellers || []).map((s) => [s.name.toLowerCase(), s.id]));
    const idByTitle = new Map((existing || []).map((p) => [p.title.toLowerCase(), p.id]));

    let inserted = 0;
    let updated = 0;
    const skipped = [];

    for (const page of results || []) {
      const p = page.properties || {};
      const t = title(p.Titre) || title(p.Name) || title(p.title);
      if (!t) {
        skipped.push('page sans titre');
        continue;
      }
      const catName = p.Catégorie?.select?.name || '';
      const sellerName = p.Vendeur?.select?.name || '';
      const row = {
        title: t,
        description: rich(p.Description) || t,
        long_description: rich(p['Description longue']) || undefined,
        price: Number(p.Prix?.number ?? 3.99),
        ai_model: p['Modèle IA']?.select?.name || 'Midjourney',
        category_id: catByName.get((catName || '').toLowerCase()) ?? 1,
        seller_id: sellerByName.get((sellerName || '').toLowerCase()) ?? 1,
        preview_image_url: p.Image?.url || '/images/hero-bg.jpg',
        prompt_preview: rich(p['Aperçu prompt']) || undefined,
        full_prompt_text: rich(p['Prompt complet']) || undefined,
        tags: (p.Tags?.multi_select || []).map((x) => x.name),
        trending: Boolean(p.Trending?.checkbox),
        bestseller: Boolean(p.Bestseller?.checkbox),
      };
      const existingId = idByTitle.get(t.toLowerCase());
      if (existingId) {
        const { error } = await supabase.from('prompts').update(row).eq('id', existingId);
        if (error) skipped.push(`${t}: ${error.message}`);
        else updated += 1;
      } else {
        const { error } = await supabase.from('prompts').insert(row);
        if (error) skipped.push(`${t}: ${error.message}`);
        else inserted += 1;
      }
    }

    return res.status(200).json({
      ok: true,
      pages: (results || []).length,
      inserted,
      updated,
      skipped,
    });
  } catch (err) {
    console.error('notion-sync error:', err);
    return res.status(500).json({ error: err.message });
  }
}
