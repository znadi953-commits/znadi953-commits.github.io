import supabase from './db-client.js';

const SORT_MAP = {
  popular: ['sales_count', false],
  recent: ['created_at', false],
  price_asc: ['price', true],
  price_desc: ['price', false],
  rating: ['rating', false],
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      const { id, category_id, q, model, min_price, max_price, trending, bestseller, featured, seller_id, sort, limit } = req.query;
      let query = supabase.from('prompts').select('*, sellers(id,name,handle,avatar_url,verified,rating), categories(id,name,slug)');
      if (id) query = query.eq('id', id);
      if (category_id) query = query.eq('category_id', category_id);
      if (seller_id) query = query.eq('seller_id', seller_id);
      if (model && model !== 'all') query = query.eq('ai_model', model);
      if (min_price) query = query.gte('price', Number(min_price));
      if (max_price) query = query.lte('price', Number(max_price));
      if (trending === 'true') query = query.eq('trending', true);
      if (bestseller === 'true') query = query.eq('bestseller', true);
      if (featured === 'true') query = query.eq('featured', true);
      if (q) {
        const safe = String(q).replace(/[%(),]/g, '').trim();
        if (safe) query = query.or('title.ilike.%' + safe + '%,description.ilike.%' + safe + '%');
      }
      const sortCfg = SORT_MAP[sort] || ['sales_count', false];
      query = query.order(sortCfg[0], { ascending: sortCfg[1] });
      if (limit) query = query.limit(Number(limit));
      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const { title, description, long_description, price, ai_model, category_id, seller_id, preview_image_url, gallery_images, prompt_preview, full_prompt_text, tags } = req.body || {};
      if (!title || !description || price == null || !ai_model || !category_id || !seller_id || !preview_image_url || !full_prompt_text) {
        return res.status(400).json({ error: 'Champs requis manquants.' });
      }
      const { data, error } = await supabase.from('prompts').insert({
        title, description, long_description: long_description || description,
        price: Number(price), ai_model, category_id: Number(category_id), seller_id: Number(seller_id),
        preview_image_url, gallery_images: gallery_images || [], prompt_preview: prompt_preview || '',
        full_prompt_text, tags: tags || [],
      }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const body = req.body || {};
      const { id } = body;
      if (!id) return res.status(400).json({ error: 'ID requis.' });
      const fields = { ...body };
      delete fields.id;
      const { data, error } = await supabase.from('prompts').update(fields).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'ID requis.' });
      const { error } = await supabase.from('prompts').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API prompts error:', err);
    return res.status(500).json({ error: err.message });
  }
}
